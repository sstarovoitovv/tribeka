<?php

declare(strict_types=1);

const BACKUP_ROOT = '/var/www/u3633961/data/backups';
const DEFAULT_BACKUPS_TO_KEEP = 10;
const BACKUP_NAME_PATTERN = '/^tribeka-before-[a-f0-9]{7}-(?:[0-9]+|[0-9]{8}-[0-9]{6})$/D';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function removeBackupDirectory(string $path, string $backupRoot): void
{
    $resolvedPath = realpath($path);
    if (
        $resolvedPath === false
        || !str_starts_with($resolvedPath, $backupRoot . DIRECTORY_SEPARATOR)
        || preg_match(BACKUP_NAME_PATTERN, basename($resolvedPath)) !== 1
        || is_link($resolvedPath)
    ) {
        throw new RuntimeException('Refused to remove an unsafe backup path.');
    }

    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($resolvedPath, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($items as $item) {
        $itemPath = $item->getPathname();
        if ($item->isLink() || $item->isFile()) {
            if (!unlink($itemPath)) {
                throw new RuntimeException('Unable to remove a file from the backup.');
            }
            continue;
        }

        if ($item->isDir() && !rmdir($itemPath)) {
            throw new RuntimeException('Unable to remove a directory from the backup.');
        }
    }

    if (!rmdir($resolvedPath)) {
        throw new RuntimeException('Unable to remove the backup directory.');
    }
}

$options = getopt('', ['keep::', 'dry-run']);
$keepValue = $options['keep'] ?? (string) DEFAULT_BACKUPS_TO_KEEP;
if (!is_string($keepValue) || !ctype_digit($keepValue)) {
    fwrite(STDERR, "The --keep value must be an integer.\n");
    exit(1);
}

$backupsToKeep = (int) $keepValue;
if ($backupsToKeep < 2 || $backupsToKeep > 50) {
    fwrite(STDERR, "The --keep value must be between 2 and 50.\n");
    exit(1);
}

$backupRoot = realpath(BACKUP_ROOT);
if ($backupRoot === false || !is_dir($backupRoot)) {
    fwrite(STDERR, "The backup root is unavailable.\n");
    exit(1);
}

$directoryNames = scandir($backupRoot);
if ($directoryNames === false) {
    fwrite(STDERR, "Unable to read the backup root.\n");
    exit(1);
}

$backups = [];
foreach ($directoryNames as $directoryName) {
    if (preg_match(BACKUP_NAME_PATTERN, $directoryName) !== 1) {
        continue;
    }

    $path = $backupRoot . DIRECTORY_SEPARATOR . $directoryName;
    if (!is_dir($path) || is_link($path)) {
        continue;
    }

    $backups[] = [
        'name' => $directoryName,
        'path' => $path,
        'modified_at' => filemtime($path) ?: 0,
    ];
}

usort($backups, static function (array $left, array $right): int {
    $timeComparison = $right['modified_at'] <=> $left['modified_at'];
    return $timeComparison !== 0 ? $timeComparison : strcmp($right['name'], $left['name']);
});

$expiredBackups = array_slice($backups, $backupsToKeep);
$dryRun = array_key_exists('dry-run', $options);
$deleted = 0;

foreach ($expiredBackups as $backup) {
    if ($dryRun) {
        fwrite(STDOUT, 'would-delete=' . $backup['name'] . PHP_EOL);
        continue;
    }

    removeBackupDirectory($backup['path'], $backupRoot);
    fwrite(STDOUT, 'deleted=' . $backup['name'] . PHP_EOL);
    $deleted++;
}

fwrite(STDOUT, sprintf(
    "%s found=%d keep=%d expired=%d deleted=%d dry_run=%s\n",
    gmdate('c'),
    count($backups),
    $backupsToKeep,
    count($expiredBackups),
    $deleted,
    $dryRun ? 'yes' : 'no'
));
