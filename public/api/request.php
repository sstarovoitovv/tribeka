<?php

declare(strict_types=1);

const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const CONSENT_VERSION = '2026-09-04';
const POLICY_VERSION = '2026-09-04';

function respond(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function allowedOrigin(?string $origin): ?string
{
    if (!$origin) {
        return null;
    }

    $patterns = [
        '~^https://(?:www\.)?xn--80abmkm6an\.xn--p1ai$~i',
        '~^https://[a-z0-9-]+\.vercel\.app$~i',
        '~^http://(?:localhost|127\.0\.0\.1)(?::\d+)?$~i',
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $origin) === 1) {
            return $origin;
        }
    }

    return null;
}

function removeLeadDirectory(?string $directory): void
{
    if (!$directory || !is_dir($directory)) {
        return;
    }

    $files = new FilesystemIterator($directory, FilesystemIterator::SKIP_DOTS);
    foreach ($files as $file) {
        if ($file->isFile() || $file->isLink()) {
            unlink($file->getPathname());
        }
    }
    rmdir($directory);
}

$origin = allowedOrigin($_SERVER['HTTP_ORIGIN'] ?? null);
if ($origin !== null) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    respond($origin === null ? 403 : 204, []);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    respond(405, ['error' => 'Метод не поддерживается.']);
}

if (isset($_SERVER['HTTP_ORIGIN']) && $origin === null) {
    respond(403, ['error' => 'Источник запроса не разрешён.']);
}

if (!empty($_POST['website'])) {
    respond(200, ['ok' => true]);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > MAX_TOTAL_SIZE + 1024 * 1024) {
    respond(413, ['error' => 'Слишком большой размер запроса.']);
}

$remoteAddress = substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
$rateFile = sys_get_temp_dir() . '/tribeka-form-' . hash('sha256', $remoteAddress);
$lastRequest = is_file($rateFile) ? (int) file_get_contents($rateFile) : 0;
if ($lastRequest > time() - 30) {
    respond(429, ['error' => 'Повторите отправку через несколько секунд.']);
}

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$privacyAccepted = isset($_POST['privacy']);
$consentVersion = trim((string) ($_POST['consent_version'] ?? ''));
$policyVersion = trim((string) ($_POST['policy_version'] ?? ''));
$sourceUrl = trim((string) ($_POST['source_url'] ?? ''));

if ($name === '' || $phone === '' || !$privacyAccepted) {
    respond(422, ['error' => 'Заполните обязательные поля.']);
}

if ($consentVersion !== CONSENT_VERSION || $policyVersion !== POLICY_VERSION) {
    respond(409, ['error' => 'Документы были обновлены. Обновите страницу и повторите отправку.']);
}

if (mb_strlen($name) > 120 || mb_strlen($phone) > 80 || mb_strlen($message) > 5000) {
    respond(422, ['error' => 'Одно из полей слишком длинное.']);
}

if ($sourceUrl !== '' && (mb_strlen($sourceUrl) > 2048 || filter_var($sourceUrl, FILTER_VALIDATE_URL) === false)) {
    $sourceUrl = '';
}

$uploadedFiles = $_FILES['attachments'] ?? null;
$pendingAttachments = [];
$totalSize = 0;
$allowedExtensions = ['pdf', 'dwg', 'dxf', 'step', 'stp', 'iges', 'igs', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'webp'];
$fileInfo = new finfo(FILEINFO_MIME_TYPE);

if (is_array($uploadedFiles) && isset($uploadedFiles['name'])) {
    $names = is_array($uploadedFiles['name']) ? $uploadedFiles['name'] : [$uploadedFiles['name']];
    $temporaryNames = is_array($uploadedFiles['tmp_name']) ? $uploadedFiles['tmp_name'] : [$uploadedFiles['tmp_name']];
    $sizes = is_array($uploadedFiles['size']) ? $uploadedFiles['size'] : [$uploadedFiles['size']];
    $errors = is_array($uploadedFiles['error']) ? $uploadedFiles['error'] : [$uploadedFiles['error']];

    if (count($names) > MAX_FILES) {
        respond(422, ['error' => 'Можно прикрепить не более пяти файлов.']);
    }

    foreach ($names as $index => $originalName) {
        $error = (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($error !== UPLOAD_ERR_OK) {
            respond(422, ['error' => 'Не удалось загрузить один из файлов.']);
        }

        $extension = strtolower(pathinfo((string) $originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions, true)) {
            respond(422, ['error' => 'Формат одного из файлов не поддерживается.']);
        }

        $size = (int) ($sizes[$index] ?? 0);
        $totalSize += $size;
        if ($size <= 0 || $totalSize > MAX_TOTAL_SIZE) {
            respond(413, ['error' => 'Общий размер файлов превышает 15 МБ.']);
        }

        $temporaryName = (string) ($temporaryNames[$index] ?? '');
        if (!is_uploaded_file($temporaryName)) {
            respond(422, ['error' => 'Не удалось проверить загруженный файл.']);
        }

        $safeName = preg_replace('/[^\pL\pN._ -]+/u', '_', basename((string) $originalName));
        $safeName = mb_strcut($safeName ?: 'attachment.' . $extension, 0, 255, 'UTF-8');
        $pendingAttachments[] = [
            'original_name' => $safeName,
            'temporary_path' => $temporaryName,
            'extension' => $extension,
            'mime_type' => substr($fileInfo->file($temporaryName) ?: 'application/octet-stream', 0, 127),
            'size_bytes' => $size,
        ];
    }
}

$configPath = getenv('TRIBEKA_PRIVATE_CONFIG') ?: dirname(__DIR__, 3) . '/tribeka-private/config.php';
if (!is_file($configPath)) {
    error_log('Tribeka request form: private configuration is missing');
    respond(500, ['error' => 'Сервис временно недоступен.']);
}

$config = require $configPath;
$uploadRoot = rtrim((string) ($config['upload_dir'] ?? ''), '/');
$recipient = (string) ($config['recipient'] ?? '');
$sender = (string) ($config['sender'] ?? '');
$retentionDays = (int) ($config['retention_days'] ?? 365);

if (
    $uploadRoot === ''
    || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false
    || filter_var($sender, FILTER_VALIDATE_EMAIL) === false
    || $retentionDays < 1
    || $retentionDays > 3650
) {
    error_log('Tribeka request form: private configuration is invalid');
    respond(500, ['error' => 'Сервис временно недоступен.']);
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
        chmod($storedPath, 0600);

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
} catch (Throwable $exception) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    removeLeadDirectory($leadDirectory);
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
    '-f' . $sender
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

file_put_contents($rateFile, (string) time(), LOCK_EX);
respond(200, ['ok' => true, 'request_id' => $publicId]);
