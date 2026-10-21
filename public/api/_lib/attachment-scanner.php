<?php

declare(strict_types=1);

namespace Tribeka\Security;

require_once __DIR__ . '/request-security.php';

if (PHP_SAPI !== 'cli' && realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}

/** Execute a trusted scanner directly, without a shell or unbounded output/wait. */
function runScanner(array $command, float $timeout): array
{
    $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($process)) {
        throw new \RuntimeException('Unable to start attachment scanner');
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);
    $deadline = microtime(true) + $timeout;
    $output = '';
    try {
        do {
            $output .= stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
            if (strlen($output) > 65536 || microtime(true) > $deadline) {
                throw new \RuntimeException('Attachment scanner exceeded its execution limit');
            }
            $status = proc_get_status($process);
            if (!$status['running']) {
                $output .= stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
                return [$status['exitcode'], $output];
            }
            usleep(10000);
        } while (true);
    } finally {
        if (proc_get_status($process)['running']) {
            proc_terminate($process, 9);
        }
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);
    }
}

/** Enabled only after the host has a current, tested ClamAV installation. */
function scanAttachments(array $attachments, array $config): void
{
    $scanner = $config['antivirus'] ?? null;
    if ($attachments === [] || !is_array($scanner) || ($scanner['enabled'] ?? false) !== true) {
        return;
    }
    $binary = $scanner['binary'] ?? '';
    $database = $scanner['database_dir'] ?? '';
    $timeout = (int) ($scanner['timeout_seconds'] ?? 15);
    if (!is_string($binary) || !str_starts_with($binary, '/') || !is_executable($binary)
        || !is_string($database) || !str_starts_with($database, '/') || !is_dir($database)
        || $timeout < 1 || $timeout > 120) {
        throw new \RuntimeException('Invalid attachment scanner configuration');
    }
    $command = [$binary, '--database=' . $database];
    [$code, $version] = runScanner([...$command, '--version'], min($timeout, 5));
    $databaseDate = explode('/', trim($version), 3)[2] ?? '';
    $timestamp = strtotime($databaseDate . ' UTC');
    if ($code !== 0 || $timestamp === false || $timestamp < time() - 7 * 86400 || $timestamp > time() + 86400) {
        throw new \RuntimeException('Attachment scanner database is missing or outdated');
    }
    [$code] = runScanner([
        ...$command, '--no-summary', '--infected', '--alert-encrypted=yes',
        '--alert-exceeds-max=yes', '--alert-broken=yes', '--alert-macros=yes',
        '--max-filesize=16M', '--max-scansize=64M', '--max-files=1000',
        '--max-recursion=8', '--max-scantime=10000', '--',
        ...array_column($attachments, 'temporary_path'),
    ], $timeout);
    if ($code === 1) {
        throw new ValidationException('Вложение содержит угрозу, зашифровано или не может быть полностью проверено.');
    }
    if ($code !== 0) {
        throw new \RuntimeException('Attachment scanner could not complete inspection');
    }
}
