<?php

declare(strict_types=1);

require_once __DIR__ . '/_lib/request-security.php';
$releaseMarker = __DIR__ . '/../release.json';
if (is_file($releaseMarker)) {
    $release = json_decode((string) file_get_contents($releaseMarker), true);
    if (is_string($release['release'] ?? null) && preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{2,79}$/D', $release['release'])) {
        header('X-Tribeka-Release: ' . $release['release']);
    }
}

use Tribeka\Security\ValidationException;
use function Tribeka\Security\acquireMaintenanceLock;
use function Tribeka\Security\ensurePrivateDirectory;
use function Tribeka\Security\privateConfigPath;
use function Tribeka\Security\scalarField;
use function Tribeka\Security\takeRateLimit;
use function Tribeka\Security\trustedOrigin;
use function Tribeka\Security\validateAttachments;
use function Tribeka\Security\validateFields;
use const Tribeka\Security\MAX_TOTAL_SIZE;

function respond(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if ($status !== 204) {
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    exit;
}

function removeLeadDirectory(?string $directory): void
{
    if (!$directory || !is_dir($directory)) {
        return;
    }
    foreach (new FilesystemIterator($directory, FilesystemIterator::SKIP_DOTS) as $file) {
        if ($file->isFile() || $file->isLink()) {
            unlink($file->getPathname());
        }
    }
    rmdir($directory);
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['POST', 'OPTIONS'], true)) {
    header('Allow: POST, OPTIONS');
    respond(405, ['error' => 'Метод не поддерживается.']);
}

$configPath = privateConfigPath();
try {
    if (!is_file($configPath)) {
        throw new RuntimeException('Private configuration is missing');
    }
    $config = require $configPath;
    if (!is_array($config) || !is_array($config['trusted_origins'] ?? [])) {
        throw new RuntimeException('Private configuration is invalid');
    }
} catch (Throwable $exception) {
    error_log('Tribeka request form configuration error: ' . $exception->getMessage());
    respond(503, ['error' => 'Сервис временно недоступен.']);
}

$origin = trustedOrigin($_SERVER['HTTP_ORIGIN'] ?? null, $config);
header('Vary: Origin');
if ($origin !== null) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type');
}
if ($method === 'OPTIONS') {
    respond($origin === null ? 403 : 204, []);
}
if (isset($_SERVER['HTTP_ORIGIN']) && $origin === null) {
    respond(403, ['error' => 'Источник запроса не разрешён.']);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > MAX_TOTAL_SIZE + 1024 * 1024) {
    respond(413, ['error' => 'Слишком большой размер запроса.']);
}
$contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
if (!in_array($contentType, ['multipart/form-data', 'application/x-www-form-urlencoded'], true)) {
    respond(415, ['error' => 'Некорректный формат запроса.']);
}
if ($contentLength > 0 && $_POST === [] && $_FILES === []) {
    respond(413, ['error' => 'Запрос пуст или превышает ограничение сервера.']);
}

// Use the socket peer, never untrusted X-Forwarded-For. Proxy deployments must
// configure the web server's trusted real-IP module before changing this value.
$remoteAddress = filter_var($_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP) ?: 'unknown';
try {
    $retryAfter = takeRateLimit(
        (string) ($config['rate_limit_dir'] ?? dirname($configPath) . '/rate-limits'),
        $remoteAddress
    );
    if ($retryAfter > 0) {
        header('Retry-After: ' . $retryAfter);
        respond(429, ['error' => 'Повторите отправку через несколько секунд.']);
    }
    if (scalarField($_POST, 'website', 2048) !== '') {
        respond(200, ['ok' => true]);
    }
    $fields = validateFields($_POST, $config);
    $name = $fields['name'];
    $phone = $fields['phone'];
    $message = $fields['message'];
    $consentVersion = $fields['consentVersion'];
    $policyVersion = $fields['policyVersion'];
    $sourceUrl = $fields['sourceUrl'];
    $pendingAttachments = validateAttachments($_FILES);
} catch (ValidationException $exception) {
    respond($exception->status, ['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    error_log('Tribeka request form validation service error: ' . $exception->getMessage());
    respond(503, ['error' => 'Сервис временно недоступен.']);
}

$uploadRoot = rtrim((string) ($config['upload_dir'] ?? ''), '/');
$recipient = (string) ($config['recipient'] ?? '');
$sender = (string) ($config['sender'] ?? '');
$retentionDays = (int) ($config['retention_days'] ?? 365);
if (
    $uploadRoot === ''
    || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false
    || filter_var($sender, FILTER_VALIDATE_EMAIL) === false
    || preg_match('/[\r\n\x00]/', $recipient . $sender)
    || $retentionDays < 1
    || $retentionDays > 3650
) {
    error_log('Tribeka request form: private configuration is invalid');
    respond(503, ['error' => 'Сервис временно недоступен.']);
}

try {
    $uploadRoot = ensurePrivateDirectory($uploadRoot);
    $maintenanceLock = acquireMaintenanceLock(
        (string) ($config['maintenance_lock'] ?? dirname($configPath) . '/maintenance.lock')
    );
    if ($maintenanceLock === false) {
        header('Retry-After: 30');
        respond(503, ['error' => 'Выполняется резервное копирование. Повторите отправку чуть позже.']);
    }
} catch (Throwable $exception) {
    error_log('Tribeka request form maintenance lock error: ' . $exception->getMessage());
    respond(503, ['error' => 'Сервис временно недоступен.']);
}

$publicId = bin2hex(random_bytes(16));
$leadDirectory = $uploadRoot . '/' . $publicId;
$storedAttachments = [];
$pdo = null;

try {
    if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0700, true) && !is_dir($uploadRoot)) {
        throw new RuntimeException('Unable to create upload root');
    }
    if (!mkdir($leadDirectory, 0700) && !is_dir($leadDirectory)) {
        throw new RuntimeException('Unable to create lead directory');
    }

    foreach ($pendingAttachments as $attachment) {
        $storedName = bin2hex(random_bytes(16)) . '.' . $attachment['extension'];
        $storedPath = $leadDirectory . '/' . $storedName;
        if (!move_uploaded_file($attachment['temporary_path'], $storedPath)) {
            throw new RuntimeException('Unable to move uploaded file');
        }
        if (!chmod($storedPath, 0600)) {
            throw new RuntimeException('Unable to protect uploaded file');
        }

        $storedAttachments[] = [
            ...$attachment,
            'stored_name' => $storedName,
            'storage_path' => $publicId . '/' . $storedName,
            'full_path' => $storedPath,
            'sha256' => hash_file('sha256', $storedPath),
        ];
    }

    $pdo = new PDO(
        (string) $config['dsn'],
        (string) $config['username'],
        (string) $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $pdo->exec("SET time_zone = '+00:00'");
    $pdo->beginTransaction();

    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $expiresAt = $now->modify(sprintf('+%d days', $retentionDays));
    $insertLead = $pdo->prepare(
        'INSERT INTO leads (
            public_id, name, phone, message, source_origin, source_url, ip_address,
            user_agent, consent_version, policy_version, consent_accepted_at, expires_at
        ) VALUES (
            :public_id, :name, :phone, :message, :source_origin, :source_url, :ip_address,
            :user_agent, :consent_version, :policy_version, :consent_accepted_at, :expires_at
        )'
    );
    $insertLead->execute([
        'public_id' => $publicId,
        'name' => $name,
        'phone' => $phone,
        'message' => $message !== '' ? $message : null,
        'source_origin' => $origin,
        'source_url' => $sourceUrl !== '' ? $sourceUrl : null,
        'ip_address' => $remoteAddress !== 'unknown' ? $remoteAddress : null,
        'user_agent' => mb_strcut((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 512, 'UTF-8') ?: null,
        'consent_version' => $consentVersion,
        'policy_version' => $policyVersion,
        'consent_accepted_at' => $now->format('Y-m-d H:i:s'),
        'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
    ]);
    $leadId = (int) $pdo->lastInsertId();

    $insertAttachment = $pdo->prepare(
        'INSERT INTO lead_attachments (
            lead_id, original_name, stored_name, storage_path, mime_type, size_bytes, sha256
        ) VALUES (
            :lead_id, :original_name, :stored_name, :storage_path, :mime_type, :size_bytes, :sha256
        )'
    );

    foreach ($storedAttachments as $attachment) {
        $insertAttachment->execute([
            'lead_id' => $leadId,
            'original_name' => $attachment['original_name'],
            'stored_name' => $attachment['stored_name'],
            'storage_path' => $attachment['storage_path'],
            'mime_type' => $attachment['mime_type'],
            'size_bytes' => $attachment['size_bytes'],
            'sha256' => $attachment['sha256'],
        ]);
    }

    $pdo->commit();
    flock($maintenanceLock, LOCK_UN);
    fclose($maintenanceLock);
} catch (Throwable $exception) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    removeLeadDirectory($leadDirectory);
    if (is_resource($maintenanceLock)) {
        flock($maintenanceLock, LOCK_UN);
        fclose($maintenanceLock);
    }
    error_log('Tribeka request form storage error: ' . $exception->getMessage());
    respond(500, ['error' => 'Не удалось сохранить заявку.']);
}

$boundary = 'tribeka-' . bin2hex(random_bytes(16));
$subject = 'Новая заявка с сайта ТРИБЕКА № ' . strtoupper(substr($publicId, 0, 8));
$bodyText = "Номер: {$publicId}\r\n";
$bodyText .= 'Дата (UTC): ' . gmdate('Y-m-d H:i:s') . "\r\n";
$bodyText .= "Имя: {$name}\r\nТелефон: {$phone}\r\n\r\nЗадача:\r\n" . ($message !== '' ? $message : 'Не указана');
$bodyText .= "\r\n\r\nСогласие: {$consentVersion}\r\nПолитика: {$policyVersion}";
$body = "--{$boundary}\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n{$bodyText}\r\n";

foreach ($storedAttachments as $attachment) {
    $encodedName = rawurlencode($attachment['original_name']);
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$attachment['mime_type']}; name*=UTF-8''{$encodedName}\r\n";
    $body .= "Content-Disposition: attachment; filename*=UTF-8''{$encodedName}\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode((string) file_get_contents($attachment['full_path']))) . "\r\n";
}

$body .= "--{$boundary}--\r\n";
$headers = [
    'From: Сайт ТРИБЕКА <' . $sender . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = mail(
    $recipient,
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    $body,
    implode("\r\n", $headers),
    '-f' . escapeshellarg($sender)
);

try {
    $updateNotification = $pdo->prepare(
        'UPDATE leads
         SET notification_status = :status,
             notification_sent_at = :sent_at,
             notification_error = :error
         WHERE id = :id'
    );
    $updateNotification->execute([
        'status' => $sent ? 'sent' : 'failed',
        'sent_at' => $sent ? gmdate('Y-m-d H:i:s') : null,
        'error' => $sent ? null : 'mail() returned false',
        'id' => $leadId,
    ]);
} catch (Throwable $exception) {
    error_log('Tribeka request form notification status error: ' . $exception->getMessage());
}

if (!$sent) {
    error_log('Tribeka request form: notification failed for lead ' . $publicId);
}

respond(200, ['ok' => true, 'request_id' => $publicId]);
