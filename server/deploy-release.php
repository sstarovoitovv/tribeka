<?php

declare(strict_types=1);

/** A release is fully uploaded before one atomic rename changes the active symlink. */
function releasePath(string $appPath, string $id): string
{
    if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{2,79}$/D', $id) !== 1) {
        throw new RuntimeException('Invalid release identifier.');
    }
    $root = realpath($appPath . '/releases');
    $release = realpath($appPath . '/releases/' . $id);
    if ($root === false || $release === false || dirname($release) !== $root || is_link($appPath . '/releases/' . $id)) {
        throw new RuntimeException('Release must be an existing directory inside releases.');
    }
    return $release;
}

function assertRelease(string $path, string $id): void
{
    foreach (['public/index.html', 'public/404.html', 'public/.htaccess', 'public/sitemap.xml', 'public/api/request.php', 'public/release.json', 'server/backup-data.php'] as $file) {
        if (!is_file($path . '/' . $file)) throw new RuntimeException('Incomplete release: ' . $file);
    }
    $marker = json_decode((string) file_get_contents($path . '/public/release.json'), true);
    if (($marker['release'] ?? null) !== $id) throw new RuntimeException('Release marker does not match.');
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $file) {
        if ($file->isLink()) throw new RuntimeException('Symlinks inside a release are forbidden.');
    }
}

function currentRelease(string $appPath, string $docroot): string
{
    $current = $appPath . '/current';
    if (!is_link($current) || !is_link($docroot) || readlink($docroot) !== $current . '/public') {
        throw new RuntimeException('Atomic layout is not initialized. Physical production directories are never overwritten; follow docs/deployment.md bootstrap.');
    }
    $resolved = realpath($current);
    if ($resolved === false || dirname($resolved) !== realpath($appPath . '/releases')) {
        throw new RuntimeException('Active release points outside releases.');
    }
    return $resolved;
}

function atomicReleaseLink(string $current, string $target): void
{
    $temporary = dirname($current) . '/.current-' . bin2hex(random_bytes(8));
    if (!symlink($target, $temporary)) throw new RuntimeException('Cannot create the next release link.');
    try {
        // POSIX rename over another symlink is atomic; never unlink current first.
        if (!rename($temporary, $current)) throw new RuntimeException('Cannot atomically activate release.');
        clearstatcache(true);
    } finally {
        if (is_link($temporary)) unlink($temporary);
    }
}

function preserveReleaseAssets(string $previous, string $next): void
{
    $source = $previous . '/public/assets';
    if (!is_dir($source)) return;
    $destination = $next . '/public/assets';
    if (!is_dir($destination) && (!mkdir($destination, 0755, true) || !chmod($destination, 0755))) throw new RuntimeException('Cannot prepare release assets.');
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST) as $file) {
        if ($file->isLink()) throw new RuntimeException('Asset symlinks are forbidden.');
        $target = $destination . substr($file->getPathname(), strlen($source));
        if ($file->isDir()) {
            if (!is_dir($target) && (!mkdir($target, 0755) || !chmod($target, 0755))) throw new RuntimeException('Cannot retain asset directory.');
            continue;
        }
        if (is_file($target)) {
            if (hash_file('sha256', $target) !== hash_file('sha256', $file->getPathname())) throw new RuntimeException('Asset name collision; refusing to overwrite cached content.');
            continue;
        }
        if (!copy($file->getPathname(), $target) || !chmod($target, 0644)) throw new RuntimeException('Cannot retain previous release asset.');
    }
}

function stageRollbackRelease(string $appPath, string $source): array
{
    // A rollback becomes a new artifact, so previously published releases stay unchanged.
    $id = 'rollback-' . gmdate('YmdHis') . '-' . bin2hex(random_bytes(4));
    $destination = $appPath . '/releases/' . $id;
    if (!mkdir($destination, 0755) || !chmod($destination, 0755)) throw new RuntimeException('Cannot stage rollback.');
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST) as $file) {
        if ($file->isLink()) throw new RuntimeException('Rollback source contains a symlink.');
        $target = $destination . substr($file->getPathname(), strlen($source));
        $mode = fileperms($file->getPathname()) & 0777;
        if ($file->isDir()) {
            if (!mkdir($target, $mode) || !chmod($target, $mode)) throw new RuntimeException('Cannot copy rollback directory.');
        } else {
            if (!copy($file->getPathname(), $target) || !chmod($target, $mode)) throw new RuntimeException('Cannot copy rollback file.');
        }
    }
    file_put_contents($destination . '/public/release.json', json_encode(['release' => $id, 'restored_from' => basename($source)]) . "\n");
    return [$id, $destination];
}

function activateRelease(string $current, string $target, callable $health, ?string $rollbackTarget = null): void
{
    $previous = realpath($current);
    if ($previous === false || !is_link($current)) throw new RuntimeException('Previous release is unavailable.');
    atomicReleaseLink($current, $target);
    try {
        if (!$health()) throw new RuntimeException('Health check failed.');
    } catch (Throwable $error) {
        atomicReleaseLink($current, $rollbackTarget ?? $previous);
        throw new RuntimeException('Activation failed; previous release restored. ' . $error->getMessage(), 0, $error);
    }
}

function releaseCommand(array $command): void
{
    $process = proc_open($command, [0 => ['file', '/dev/null', 'r'], 1 => STDOUT, 2 => STDERR], $pipes);
    if (!is_resource($process) || proc_close($process) !== 0) throw new RuntimeException('Release preparation command failed.');
}

function releaseHttp(string $url, string $method = 'GET'): array
{
    $body = tempnam(sys_get_temp_dir(), 'tribeka-body-');
    $headers = tempnam(sys_get_temp_dir(), 'tribeka-headers-');
    try {
        $command = ['curl', '--silent', '--show-error', '--max-time', '20', '--request', $method, '--header', 'Cache-Control: no-cache', '--header', 'Origin: https://xn--80abmkm6an.xn--p1ai', '--dump-header', $headers, '--output', $body, '--write-out', '%{http_code}', $url];
        $process = proc_open($command, [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => STDERR], $pipes);
        if (!is_resource($process)) throw new RuntimeException('Cannot run curl.');
        $status = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        if (proc_close($process) !== 0) throw new RuntimeException('Production HTTP check failed.');
        return [(int) $status, (string) file_get_contents($body), strtolower((string) file_get_contents($headers))];
    } finally {
        if (is_file($body)) unlink($body);
        if (is_file($headers)) unlink($headers);
    }
}

function productionHealthy(string $base, string $id): bool
{
    $nonce = '?release-check=' . rawurlencode($id) . '-' . bin2hex(random_bytes(4));
    [$status, $body] = releaseHttp($base . '/release.json' . $nonce);
    if ($status !== 200 || (json_decode($body, true)['release'] ?? null) !== $id) return false;
    [$status, $body, $headers] = releaseHttp($base . '/' . $nonce);
    if ($status !== 200 || !str_contains($body, '<h1') || !str_contains($headers, 'x-content-type-options: nosniff') || !str_contains($headers, 'content-security-policy:')) return false;
    [$status] = releaseHttp($base . '/__release_missing_' . rawurlencode($id) . '/');
    if ($status !== 404) return false;
    [$status, , $headers] = releaseHttp($base . '/api/request.php', 'OPTIONS');
    if ($status !== 204 || !str_contains($headers, 'x-tribeka-release: ' . strtolower($id))) return false;
    $host = (string) parse_url($base, PHP_URL_HOST);
    if ($host === 'xn--80abmkm6an.xn--p1ai') {
        [$status, , $headers] = releaseHttp('https://www.' . $host . '/about/');
        if ($status !== 301 || !str_contains($headers, 'location: ' . $base . '/about/')) return false;
    }
    return true;
}

if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    umask(0077);
    try {
        $options = getopt('', ['app-path:', 'docroot:', 'release-id:', 'rollback-id:', 'health-url:']);
        $appPath = realpath((string) ($options['app-path'] ?? ''));
        $docroot = (string) ($options['docroot'] ?? '');
        $id = (string) ($options['rollback-id'] ?? $options['release-id'] ?? '');
        $base = rtrim((string) ($options['health-url'] ?? ''), '/');
        if ($appPath === false || $appPath === '/' || !str_starts_with($base, 'https://')) throw new RuntimeException('Supply app-path, docroot, release-id (or rollback-id), and an HTTPS health-url.');
        $lock = fopen($appPath . '/deploy.lock', 'c');
        if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Another deployment is running.');
        $previous = currentRelease($appPath, $docroot);
        $release = releasePath($appPath, $id);
        assertRelease($release, $id);
        if ($release === $previous) throw new RuntimeException('This release is already active.');
        if (isset($options['rollback-id'])) [$id, $release] = stageRollbackRelease($appPath, $release);
        // An in-flight old HTML response must still find its hashed JS/CSS after the switch.
        preserveReleaseAssets($previous, $release);
        // The reverse direction needs the new assets too, without mutating the active release.
        [, $fallback] = stageRollbackRelease($appPath, $previous);
        preserveReleaseAssets($release, $fallback);
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($release, FilesystemIterator::SKIP_DOTS)) as $file) {
            if ($file->getExtension() === 'php') releaseCommand([PHP_BINARY, '-l', $file->getPathname()]);
        }
        // Backup failure is fatal before activation. This script obtains the shared maintenance lock.
        releaseCommand([PHP_BINARY, $release . '/server/backup-data.php']);
        activateRelease($appPath . '/current', $release, static fn (): bool => productionHealthy($base, $id), $fallback);
        fwrite(STDOUT, 'Active release: ' . $id . '; previous: ' . basename($previous) . PHP_EOL);
    } catch (Throwable $error) {
        fwrite(STDERR, $error->getMessage() . PHP_EOL);
        exit(1);
    }
}
