<?php

declare(strict_types=1);

const RECIPIENT = 'tribekaspb@bk.ru';
const SENDER = 'noreply@xn--80abmkm6an.xn--p1ai';
const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;

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

$remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/tribeka-form-' . hash('sha256', $remoteAddress);
$lastRequest = is_file($rateFile) ? (int) file_get_contents($rateFile) : 0;
if ($lastRequest > time() - 30) {
    respond(429, ['error' => 'Повторите отправку через несколько секунд.']);
}

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$privacyAccepted = isset($_POST['privacy']);

if ($name === '' || $phone === '' || !$privacyAccepted) {
    respond(422, ['error' => 'Заполните обязательные поля.']);
}

if (mb_strlen($name) > 120 || mb_strlen($phone) > 80 || mb_strlen($message) > 5000) {
    respond(422, ['error' => 'Одно из полей слишком длинное.']);
}

$uploadedFiles = $_FILES['attachments'] ?? null;
$attachments = [];
$totalSize = 0;
$allowedExtensions = ['pdf', 'dwg', 'dxf', 'step', 'stp', 'iges', 'igs', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'webp'];

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
        if ($totalSize > MAX_TOTAL_SIZE) {
            respond(413, ['error' => 'Общий размер файлов превышает 15 МБ.']);
        }

        $temporaryName = (string) ($temporaryNames[$index] ?? '');
        if (!is_uploaded_file($temporaryName)) {
            respond(422, ['error' => 'Не удалось проверить загруженный файл.']);
        }

        $safeName = preg_replace('/[^\pL\pN._ -]+/u', '_', basename((string) $originalName));
        $attachments[] = [
            'name' => $safeName ?: 'attachment.' . $extension,
            'path' => $temporaryName,
            'type' => mime_content_type($temporaryName) ?: 'application/octet-stream',
        ];
    }
}

$boundary = 'tribeka-' . bin2hex(random_bytes(16));
$subject = 'Новая заявка с сайта ТРИБЕКА';
$bodyText = "Имя: {$name}\r\nТелефон: {$phone}\r\n\r\nЗадача:\r\n" . ($message !== '' ? $message : 'Не указана');
$body = "--{$boundary}\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n{$bodyText}\r\n";

foreach ($attachments as $attachment) {
    $encodedName = rawurlencode($attachment['name']);
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$attachment['type']}; name*=UTF-8''{$encodedName}\r\n";
    $body .= "Content-Disposition: attachment; filename*=UTF-8''{$encodedName}\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode((string) file_get_contents($attachment['path']))) . "\r\n";
}

$body .= "--{$boundary}--\r\n";
$headers = [
    'From: Сайт ТРИБЕКА <' . SENDER . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = mail(
    RECIPIENT,
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    $body,
    implode("\r\n", $headers),
    '-f' . SENDER
);

if (!$sent) {
    error_log('Tribeka request form: mail() returned false');
    respond(500, ['error' => 'Не удалось отправить заявку.']);
}

file_put_contents($rateFile, (string) time(), LOCK_EX);
respond(200, ['ok' => true]);
