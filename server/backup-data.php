<?php

declare(strict_types=1);

function backupRun(array $command, ?string $output = null): void
{
    $process = proc_open($command, [0 => ['file', '/dev/null', 'r'], 1 => $output === null ? STDOUT : ['file', $output, 'w'], 2 => STDERR], $pipes);
    if (!is_resource($process) || proc_close($process) !== 0) throw new RuntimeException('Backup command failed; snapshot was not published.');
}

function backupRemove(string $directory): void
{
    if (is_link($directory)) throw new RuntimeException('Refused to remove a backup symlink.');
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST) as $entry) {
        if ($entry->isDir() && !$entry->isLink()) rmdir($entry->getPathname());
        else unlink($entry->getPathname());
    }
    rmdir($directory);
}

function backupArchive(string $directory, string $destination): void
{
    if (is_link($directory)) throw new RuntimeException('Backup source must not be a symlink.');
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS)) as $entry) {
        if ($entry->isLink()) throw new RuntimeException('Backup source contains an unsafe symlink.');
    }
    backupRun(['tar', '-czf', $destination, '-C', $directory, '.']);
    chmod($destination, 0600);
}

function backupDatabaseOptions(array $config): string
{
    if (!str_starts_with((string) ($config['dsn'] ?? ''), 'mysql:')) throw new RuntimeException('Only a MySQL DSN can be backed up.');
    $dsn = [];
    foreach (explode(';', substr($config['dsn'], 6)) as $part) {
        if (str_contains($part, '=')) {
            [$key, $value] = explode('=', $part, 2);
            $dsn[$key] = $value;
        }
    }
    if (preg_match('/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/D', $dsn['dbname'] ?? '') !== 1) throw new RuntimeException('Unsupported database name.');
    $options = ['user' => $config['username'], 'password' => $config['password']];
    foreach (['host' => 'host', 'port' => 'port', 'unix_socket' => 'socket'] as $key => $target) {
        if (isset($dsn[$key])) $options[$target] = $dsn[$key];
    }
    $result = "[client]\n";
    foreach ($options as $key => $value) {
        if (preg_match('/[\r\n\x00]/', (string) $value)) throw new RuntimeException('Unsupported newline in database configuration.');
        $result .= $key . '="' . str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $value) . '"' . "\n";
    }
    return $result;
}

function backupPrune(string $root, int $keep, int $ageDays): void
{
    if ($keep < 2 || $keep > 50 || $ageDays < 1 || $ageDays > 90) throw new RuntimeException('Invalid backup retention.');
    if (!is_dir($root) || is_link($root) || realpath($root) === '/') throw new RuntimeException('Invalid backup root.');
    $backups = [];
    foreach (new DirectoryIterator($root) as $entry) {
        if (!$entry->isDir() || $entry->isLink() || !preg_match('/^tribeka-data-[0-9]{8}-[0-9]{6}-[a-f0-9]{8}$/D', $entry->getFilename())) continue;
        if (!is_file($entry->getPathname() . '/manifest.json')) continue;
        $backups[] = ['path' => $entry->getPathname(), 'time' => $entry->getMTime()];
    }
    usort($backups, static fn (array $a, array $b): int => $b['time'] <=> $a['time'] ?: strcmp($b['path'], $a['path']));
    foreach ($backups as $index => $backup) {
        if ($index >= $keep || $backup['time'] < time() - $ageDays * 86400) backupRemove($backup['path']);
    }
}

function createDataBackup(string $configPath): string
{
    umask(0077);
    if (!is_file($configPath) || is_link($configPath)) throw new RuntimeException('Private configuration is missing or is a symlink.');
    $configPath = realpath($configPath);
    $config = require $configPath;
    $root = (string) ($config['backup_dir'] ?? dirname($configPath) . '/backups');
    if (!str_starts_with($root, '/') || is_link($root)) throw new RuntimeException('Backup root must be an absolute private directory.');
    if (!is_dir($root) && !mkdir($root, 0700, true)) throw new RuntimeException('Cannot create backup directory.');
    $root = realpath($root);
    $uploadPath = (string) ($config['upload_dir'] ?? '');
    $uploads = realpath($uploadPath);
    if ($uploads === false || $uploads === '/' || is_link($uploadPath) || !is_dir($uploads) || str_starts_with($root . '/', $uploads . '/') || $root === dirname($configPath) || $root === '/') throw new RuntimeException('Unsafe backup or upload directory.');
    // /var/www is the hosting account parent, not the public docroot itself.
    foreach ([realpath(__DIR__ . '/../public'), '/var/www/u3633961/data/www'] as $publicRoot) {
        if ($publicRoot !== false && str_starts_with($root . '/', rtrim($publicRoot, '/') . '/')) throw new RuntimeException('Backups cannot be stored in a public document root.');
    }
    chmod($root, 0700);
    $keep = (int) ($config['backup_keep'] ?? 10);
    $age = (int) ($config['backup_max_age_days'] ?? 14);
    if ($keep < 2 || $keep > 50 || $age < 1 || $age > 90) throw new RuntimeException('Invalid backup retention.');
    $lockPath = (string) ($config['maintenance_lock'] ?? dirname($configPath) . '/maintenance.lock');
    $lock = fopen($lockPath, 'c');
    if ($lock === false) throw new RuntimeException('Cannot open maintenance lock.');
    $deadline = microtime(true) + 30;
    while (!flock($lock, LOCK_EX | LOCK_NB)) {
        if (microtime(true) >= $deadline) throw new RuntimeException('Maintenance lock is busy; no snapshot created.');
        usleep(100000);
    }
    $id = 'tribeka-data-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4));
    $pending = $root . '/.pending-' . $id;
    $published = $root . '/' . $id;
    mkdir($pending, 0700);
    try {
        // All writers (requests, purge, analytics) hold LOCK_SH on this same file.
        $credentials = $pending . '/.mysql.cnf';
        file_put_contents($credentials, backupDatabaseOptions($config));
        chmod($credentials, 0600);
        preg_match('/(?:^mysql:|;)dbname=([^;]+)/', (string) $config['dsn'], $database);
        backupRun(['mysqldump', '--defaults-extra-file=' . $credentials, '--single-transaction', '--quick', '--skip-lock-tables', '--no-tablespaces', '--default-character-set=utf8mb4', $database[1]], $pending . '/database.sql');
        unlink($credentials);
        if (filesize($pending . '/database.sql') === 0) throw new RuntimeException('Database dump is empty.');
        backupArchive($uploads, $pending . '/uploads.tar.gz');
        backupRun(['tar', '-czf', $pending . '/config.tar.gz', '-C', dirname($configPath), basename($configPath)]);
        $analytics = (string) ($config['analytics_dir'] ?? dirname($configPath) . '/analytics');
        if (is_dir($analytics)) backupArchive($analytics, $pending . '/analytics.tar.gz');
        $files = [];
        foreach (new DirectoryIterator($pending) as $file) {
            if (!$file->isFile()) continue;
            chmod($file->getPathname(), 0600);
            $files[$file->getFilename()] = ['bytes' => $file->getSize(), 'sha256' => hash_file('sha256', $file->getPathname())];
        }
        file_put_contents($pending . '/manifest.json', json_encode(['version' => 1, 'created_at' => gmdate('c'), 'expires_at' => gmdate('c', time() + $age * 86400), 'files' => $files], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
        if (!rename($pending, $published)) throw new RuntimeException('Cannot publish completed backup.');
    } finally {
        if (is_dir($pending)) backupRemove($pending);
        flock($lock, LOCK_UN);
        fclose($lock);
    }
    backupPrune($root, $keep, $age);
    return $published;
}

if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    try {
        $options = getopt('', ['prune-only']);
        $configPath = getenv('TRIBEKA_PRIVATE_CONFIG') ?: '/var/www/u3633961/data/tribeka-private/config.php';
        if (isset($options['prune-only'])) {
            $config = require $configPath;
            backupPrune((string) ($config['backup_dir'] ?? dirname($configPath) . '/backups'), (int) ($config['backup_keep'] ?? 10), (int) ($config['backup_max_age_days'] ?? 14));
            fwrite(STDOUT, "Backup retention applied.\n");
        } else {
            fwrite(STDOUT, 'Complete private backup: ' . createDataBackup($configPath) . PHP_EOL);
        }
    } catch (Throwable $error) {
        fwrite(STDERR, $error->getMessage() . PHP_EOL);
        exit(1);
    }
}
