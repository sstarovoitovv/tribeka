<?php

declare(strict_types=1);

namespace Tribeka\Security;

// This library contains no credentials and is bundled with each immutable release.
if (PHP_SAPI !== 'cli' && realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}

const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const CONSENT_VERSION = '2026-09-04';
const POLICY_VERSION = '2026-09-08';

final class ValidationException extends \RuntimeException
{
    public function __construct(string $message, public readonly int $status = 422)
    {
        parent::__construct($message);
    }
}

function privateConfigPath(): string
{
    return getenv('TRIBEKA_PRIVATE_CONFIG') ?: '/var/www/u3633961/data/tribeka-private/config.php';
}

function trustedOrigin(?string $origin, array $config = []): ?string
{
    $allowed = [
        'https://xn--80abmkm6an.xn--p1ai',
        'https://www.xn--80abmkm6an.xn--p1ai',
        ...($config['trusted_origins'] ?? []),
    ];
    return $origin !== null && in_array($origin, $allowed, true) ? $origin : null;
}

function scalarField(array $fields, string $key, int $maxLength): string
{
    $value = $fields[$key] ?? '';
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        throw new ValidationException('Некорректный формат поля заявки.');
    }
    if (mb_strlen($value, 'UTF-8') > $maxLength || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
        throw new ValidationException('Одно из полей слишком длинное или содержит недопустимые символы.');
    }
    return trim($value);
}

function normalizePhone(string $phone): string
{
    if (!preg_match('/^(?:\+|8)[0-9 ()\-.]+$/D', $phone)) {
        throw new ValidationException('Начните телефон с +кода страны или с 8 для России.');
    }
    $digits = preg_replace('/\D/', '', $phone);
    if (!str_starts_with($phone, '+')) {
        if (strlen($digits) !== 11) {
            throw new ValidationException('Проверьте номер телефона.');
        }
        $digits = '7' . substr($digits, 1);
    }
    // E.164 format plus the shared Russia/Kazakhstan numbering plan. Other
    // countries use structural validation; the browser validates numbering data.
    if (!preg_match('/^[1-9][0-9]{7,14}$/D', $digits)
        || (str_starts_with($digits, '7') && !preg_match('/^7[346789][0-9]{9}$/D', $digits))
        || preg_match('/^([0-9])\1+$/D', $digits)) {
        throw new ValidationException('Проверьте номер телефона и код страны.');
    }
    return '+' . $digits;
}

function validateFields(array $fields, array $config = []): array
{
    $name = scalarField($fields, 'name', 120);
    $phone = scalarField($fields, 'phone', 80);
    $message = scalarField($fields, 'message', 5000);
    $privacy = scalarField($fields, 'privacy', 16);
    $consentVersion = scalarField($fields, 'consent_version', 32);
    $policyVersion = scalarField($fields, 'policy_version', 32);
    $sourceUrl = scalarField($fields, 'source_url', 2048);
    scalarField($fields, 'website', 2048);

    if ($name === '' || $phone === '' || $privacy !== 'on') {
        throw new ValidationException('Заполните имя, телефон и подтвердите согласие.');
    }
    if (preg_match('/[\r\n\t]/', $name) || !preg_match('/\p{L}/u', $name)) {
        throw new ValidationException('Проверьте имя.');
    }
    if ($consentVersion !== CONSENT_VERSION || $policyVersion !== POLICY_VERSION) {
        throw new ValidationException('Документы были обновлены. Обновите страницу и повторите отправку.', 409);
    }
    $phone = normalizePhone($phone);

    // Persist only a trusted source page. Query strings/fragments can contain
    // personal information; campaign attribution is not collected.
    if ($sourceUrl !== '') {
        $parts = parse_url($sourceUrl);
        if ($parts === false || !isset($parts['scheme'], $parts['host']) || isset($parts['user'], $parts['pass'])) {
            throw new ValidationException('Некорректный адрес страницы.');
        }
        $sourceOrigin = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
        if (trustedOrigin($sourceOrigin, $config) === null) {
            throw new ValidationException('Некорректный адрес страницы.');
        }
        $sourceUrl = $sourceOrigin . ($parts['path'] ?? '/');
    }
    return compact('name', 'phone', 'message', 'consentVersion', 'policyVersion', 'sourceUrl');
}

function ensurePrivateDirectory(string $directory, ?string $webRoot = null): string
{
    if ($directory === '' || !str_starts_with($directory, '/')) {
        throw new \RuntimeException('Private directory must be an absolute path');
    }
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new \RuntimeException('Unable to create private directory');
    }
    $resolved = realpath($directory);
    $root = realpath($webRoot ?? dirname(__DIR__, 2));
    if ($resolved === false || ($root !== false && ($resolved === $root || str_starts_with($resolved, $root . '/')))) {
        throw new \RuntimeException('Private data must be outside the web root');
    }
    if (!chmod($resolved, 0700)) {
        throw new \RuntimeException('Unable to protect private directory');
    }
    return $resolved;
}

/** Fixed shards are never unlinked: deleting a live lock file defeats flock. */
function takeRateLimit(string $directory, string $key, ?int $now = null, int $interval = 30): int
{
    if ($interval < 1) {
        throw new \InvalidArgumentException('Rate interval must be positive');
    }
    $directory = ensurePrivateDirectory($directory);
    $now ??= time();
    $hash = hash('sha256', $key);
    $path = $directory . '/' . substr($hash, 0, 2) . '.json';
    if (is_link($path)) {
        throw new \RuntimeException('Invalid rate limiter file');
    }
    $file = fopen($path, 'c+b');
    if ($file === false) {
        throw new \RuntimeException('Unable to open rate limiter');
    }
    try {
        if (!chmod($path, 0600) || !flock($file, LOCK_EX)) {
            throw new \RuntimeException('Unable to lock rate limiter');
        }
        $raw = stream_get_contents($file, 512 * 1024 + 1);
        if ($raw === false || strlen($raw) > 512 * 1024) {
            throw new \RuntimeException('Rate limiter state is invalid');
        }
        $state = $raw === '' ? [] : json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($state)) {
            throw new \RuntimeException('Rate limiter state is invalid');
        }
        foreach ($state as $entry => $expires) {
            if (!is_int($expires) || !is_string($entry) || !preg_match('/^[a-f0-9]{64}$/D', $entry)) {
                throw new \RuntimeException('Rate limiter state is invalid');
            }
            if ($expires <= $now) {
                unset($state[$entry]);
            }
        }
        if (isset($state[$hash])) {
            return $state[$hash] - $now;
        }
        if (count($state) >= 4096) {
            return $interval;
        }
        $state[$hash] = $now + $interval;
        $encoded = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($file);
        if (fwrite($file, $encoded) !== strlen($encoded) || !ftruncate($file, strlen($encoded)) || !fflush($file)) {
            throw new \RuntimeException('Unable to save rate limiter');
        }
        return 0;
    } finally {
        flock($file, LOCK_UN);
        fclose($file);
    }
}

/** @return resource|false */
function acquireMaintenanceLock(string $path, float $timeout = 2.0)
{
    $directory = ensurePrivateDirectory(dirname($path));
    $path = $directory . '/' . basename($path);
    if (is_link($path)) {
        throw new \RuntimeException('Invalid maintenance lock');
    }
    $file = fopen($path, 'c+b');
    if ($file === false || !chmod($path, 0600)) {
        throw new \RuntimeException('Unable to open maintenance lock');
    }
    $deadline = microtime(true) + $timeout;
    do {
        if (flock($file, LOCK_SH | LOCK_NB)) {
            return $file;
        }
        usleep(20000);
    } while (microtime(true) < $deadline);
    fclose($file);
    return false;
}

function normalizedUploads(array $files): array
{
    if ($files === []) {
        return [];
    }
    if (array_diff(array_keys($files), ['attachments']) || !isset($files['attachments']) || !is_array($files['attachments'])) {
        throw new ValidationException('Некорректный формат вложений.');
    }
    $upload = $files['attachments'];
    $keys = ['name', 'tmp_name', 'size', 'error', 'type'];
    foreach ($keys as $key) {
        if (!array_key_exists($key, $upload)) {
            throw new ValidationException('Некорректный формат вложений.');
        }
    }
    $multiple = is_array($upload['name']);
    $indices = $multiple ? array_keys($upload['name']) : [0];
    if (count($indices) > MAX_FILES) {
        throw new ValidationException('Можно прикрепить не более пяти файлов.');
    }
    foreach ($keys as $key) {
        if (is_array($upload[$key]) !== $multiple || ($multiple && array_keys($upload[$key]) !== $indices)) {
            throw new ValidationException('Некорректный формат вложений.');
        }
    }
    $result = [];
    foreach ($indices as $index) {
        $item = [];
        foreach ($keys as $key) {
            $item[$key] = $multiple ? $upload[$key][$index] : $upload[$key];
        }
        if (!is_string($item['name']) || !is_string($item['tmp_name']) || !is_string($item['type'])
            || !is_int($item['size']) || !is_int($item['error'])) {
            throw new ValidationException('Некорректный формат вложений.');
        }
        if ($item['error'] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if (in_array($item['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            throw new ValidationException('Общий размер файлов превышает 15 МБ.', 413);
        }
        if ($item['error'] !== UPLOAD_ERR_OK) {
            throw new ValidationException('Не удалось загрузить один из файлов.');
        }
        $result[] = $item;
    }
    return $result;
}

function inspectAttachment(string $path, string $originalName): array
{
    if (!mb_check_encoding($originalName, 'UTF-8') || strlen($originalName) > 255
        || preg_match('/[\x00-\x1F\x7F\/\\\\]/', $originalName)
        || preg_match('/\.(?:php[0-9]*|phtml|phar|exe|com|bat|cmd|js|html?|sh|ps1|scr|msi)(?:\.|$)/i', $originalName)) {
        throw new ValidationException('Недопустимое имя вложения.');
    }
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $size = filesize($path);
    if ($size === false || $size < 1 || $size > MAX_TOTAL_SIZE) {
        throw new ValidationException('Общий размер файлов превышает 15 МБ или файл пуст.', 413);
    }
    $head = file_get_contents($path, false, null, 0, 8192);
    $tail = file_get_contents($path, false, null, max(0, $size - 2048), 2048);
    $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($path);
    if ($head === false || $tail === false || !is_string($mime)) {
        throw new ValidationException('Не удалось проверить вложение.');
    }
    $binaryMime = ['application/octet-stream'];
    $textMime = ['text/plain', 'application/octet-stream'];
    $allowedMimes = match ($extension) {
        'pdf' => ['application/pdf'],
        'jpg', 'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'webp' => ['image/webp'],
        'dwg' => ['image/vnd.dwg', 'image/x-dwg', 'application/acad', 'application/x-acad', ...$binaryMime],
        'dxf' => ['image/vnd.dxf', 'image/x-dxf', 'application/dxf', 'application/x-dxf', ...$textMime],
        'step', 'stp' => ['model/step', 'model/step+zip', 'application/step', ...$textMime],
        'iges', 'igs' => ['model/iges', 'application/iges', 'application/x-iges', ...$textMime],
        'zip' => ['application/zip', 'application/x-zip-compressed'],
        'rar' => ['application/vnd.rar', 'application/x-rar', 'application/x-rar-compressed'],
        '7z' => ['application/x-7z-compressed'],
        default => [],
    };
    $signatureValid = match ($extension) {
        'pdf' => preg_match('/^%PDF-1\.[0-9]|^%PDF-2\.0/', $head) === 1 && str_contains($tail, '%%EOF'),
        'jpg', 'jpeg' => str_starts_with($head, "\xFF\xD8\xFF") && str_ends_with(rtrim($tail, "\r\n"), "\xFF\xD9"),
        'png' => str_starts_with($head, "\x89PNG\r\n\x1A\n") && str_ends_with($tail, "IEND\xAE\x42\x60\x82"),
        'webp' => str_starts_with($head, 'RIFF') && substr($head, 8, 4) === 'WEBP'
            && strlen($head) >= 12 && unpack('Vsize', substr($head, 4, 4))['size'] + 8 === $size,
        'dwg' => preg_match('/^AC10[0-9]{2}\x00/', $head) === 1,
        'dxf' => str_starts_with($head, "AutoCAD Binary DXF\r\n\x1A\x00")
            || (preg_match('/^\s*(?:999\s*\r?\n[^\r\n]*\r?\n\s*)*0\s*\r?\nSECTION\s*\r?\n\s*2\s*\r?\n[A-Z]+\s*\r?\n/', $head) === 1
                && preg_match('/(?:^|\n)\s*0\s*\r?\nEOF\s*$/', $tail) === 1),
        'step', 'stp' => preg_match('/^\s*ISO-10303-21\s*;/', $head) === 1 && str_contains($tail, 'END-ISO-10303-21;'),
        'iges', 'igs' => preg_match('/^.{72}S\s*1\r?\n/', $head) === 1 && preg_match('/(?:^|\n).{72}T\s*[0-9]+\s*$/', $tail) === 1,
        'zip' => str_starts_with($head, "PK\x03\x04") || str_starts_with($head, "PK\x05\x06"),
        'rar' => str_starts_with($head, "Rar!\x1A\x07\x00") || str_starts_with($head, "Rar!\x1A\x07\x01\x00"),
        '7z' => str_starts_with($head, "7z\xBC\xAF\x27\x1C"),
        default => false,
    };
    if (!$signatureValid || !in_array($mime, $allowedMimes, true)) {
        throw new ValidationException('Содержимое вложения не соответствует формату.');
    }
    if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
        $dimensions = @getimagesize($path);
        if ($dimensions === false || $dimensions[0] < 1 || $dimensions[1] < 1 || $dimensions[0] * $dimensions[1] > 40000000) {
            throw new ValidationException('Изображение повреждено или имеет слишком большой размер.');
        }
    }
    // Never extract archives or serve uploads from a public route. Signatures do
    // not prove that CAD/PDF/archive content is malware-free; see server docs.
    $safeName = preg_replace('/[^\pL\pN._ -]+/u', '_', $originalName);
    return [
        'original_name' => $safeName ?: 'attachment.' . $extension,
        'temporary_path' => $path,
        'extension' => $extension,
        'mime_type' => $mime,
        'size_bytes' => $size,
    ];
}

function validateAttachments(array $files): array
{
    $result = [];
    $total = 0;
    foreach (normalizedUploads($files) as $upload) {
        if (!is_uploaded_file($upload['tmp_name'])) {
            throw new ValidationException('Не удалось проверить загруженный файл.');
        }
        $attachment = inspectAttachment($upload['tmp_name'], $upload['name']);
        if ($attachment['size_bytes'] !== $upload['size']) {
            throw new ValidationException('Размер вложения не соответствует загруженному файлу.');
        }
        $total += $attachment['size_bytes'];
        if ($total > MAX_TOTAL_SIZE) {
            throw new ValidationException('Общий размер файлов превышает 15 МБ.', 413);
        }
        $result[] = $attachment;
    }
    return $result;
}

/** Values are always bound parameters; callers own the surrounding transaction. */
function storeLead(\PDO $pdo, array $lead, array $attachments): int
{
    $insertLead = $pdo->prepare(
        'INSERT INTO leads (
            public_id, name, phone, message, source_origin, source_url, ip_address,
            user_agent, consent_version, policy_version, consent_accepted_at, expires_at
        ) VALUES (
            :public_id, :name, :phone, :message, :source_origin, :source_url, :ip_address,
            :user_agent, :consent_version, :policy_version, :consent_accepted_at, :expires_at
        )'
    );
    $insertLead->execute($lead);

    $leadId = (int) $pdo->lastInsertId();

    $insertAttachment = $pdo->prepare(
        'INSERT INTO lead_attachments (
            lead_id, original_name, stored_name, storage_path, mime_type, size_bytes, sha256
        ) VALUES (
            :lead_id, :original_name, :stored_name, :storage_path, :mime_type, :size_bytes, :sha256
        )'
    );

    foreach ($attachments as $attachment) {
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

    return $leadId;
}
