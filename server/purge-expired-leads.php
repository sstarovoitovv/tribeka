<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$configPath = getenv('TRIBEKA_PRIVATE_CONFIG') ?: '/var/www/u3633961/data/tribeka-private/config.php';
if (!is_file($configPath)) {
    fwrite(STDERR, "Private configuration was not found.\n");
    exit(1);
}

$config = require $configPath;
$uploadRoot = rtrim((string) ($config['upload_dir'] ?? ''), '/');
if ($uploadRoot === '' || !is_dir($uploadRoot)) {
    fwrite(STDERR, "Upload directory is unavailable.\n");
    exit(1);
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

$expiredLeads = $pdo->query(
    "SELECT id, public_id FROM leads WHERE expires_at <= UTC_TIMESTAMP() ORDER BY id LIMIT 500"
)->fetchAll();

$deleteLead = $pdo->prepare('DELETE FROM leads WHERE id = :id');
$deleted = 0;

foreach ($expiredLeads as $lead) {
    $publicId = (string) $lead['public_id'];
    if (preg_match('/^[a-f0-9]{32}$/', $publicId) !== 1) {
        fwrite(STDERR, "Skipped lead with invalid public ID.\n");
        continue;
    }

    $leadDirectory = $uploadRoot . '/' . $publicId;
    if (is_dir($leadDirectory)) {
        $files = new FilesystemIterator($leadDirectory, FilesystemIterator::SKIP_DOTS);
        foreach ($files as $file) {
            if ($file->isFile() || $file->isLink()) {
                unlink($file->getPathname());
            }
        }
        rmdir($leadDirectory);
    }

    $deleteLead->execute(['id' => $lead['id']]);
    $deleted += $deleteLead->rowCount();
}

fwrite(STDOUT, sprintf("%s deleted=%d\n", gmdate('c'), $deleted));
