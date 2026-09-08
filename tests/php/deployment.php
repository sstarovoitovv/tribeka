<?php

declare(strict_types=1);

require __DIR__ . '/../../server/deploy-release.php';
require __DIR__ . '/../../server/backup-data.php';
umask(0077);

$sandbox = sys_get_temp_dir() . '/tribeka-deploy-test-' . bin2hex(random_bytes(6));
mkdir($sandbox, 0700);
$sandbox = realpath($sandbox);
$checks = 0;
function verify(bool $condition, string $description): void
{
    global $checks;
    if (!$condition) throw new RuntimeException('FAIL: ' . $description);
    $checks++;
    fwrite(STDOUT, 'PASS: ' . $description . PHP_EOL);
}
function refuses(callable $action): bool
{
    try { $action(); return false; } catch (RuntimeException) { return true; }
}
try {
    $app = $sandbox . '/app';
    mkdir($app . '/releases', 0700, true);
    foreach (['old-release', 'new-release'] as $id) {
        $release = $app . '/releases/' . $id;
        mkdir($release . '/public/api', 0700, true);
        chmod($release . '/public', 0755);
        mkdir($release . '/server', 0700);
        foreach (['index.html', '404.html', '.htaccess', 'sitemap.xml', 'api/request.php'] as $file) file_put_contents($release . '/public/' . $file, $id);
        file_put_contents($release . '/public/release.json', json_encode(['release' => $id]));
        file_put_contents($release . '/server/backup-data.php', '<?php');
    }
    $old = $app . '/releases/old-release';
    $new = $app . '/releases/new-release';
    symlink($old, $app . '/current');
    mkdir($sandbox . '/physical-root');
    verify(refuses(static fn () => currentRelease($app, $sandbox . '/physical-root')), 'Physical production directory is refused without mutation');
    symlink($app . '/current/public', $sandbox . '/webroot');
    verify(currentRelease($app, $sandbox . '/webroot') === $old, 'Existing atomic layout accepted');
    verify(refuses(static fn () => releasePath($app, '../escape')), 'Release path traversal rejected');
    assertRelease($new, 'new-release');
    verify(refuses(static fn () => assertRelease($new, 'wrong-release')), 'Wrong build marker rejected');
    mkdir($old . '/public/assets');
    mkdir($new . '/public/assets');
    file_put_contents($old . '/public/assets/index-oldhash.js', 'old javascript');
    file_put_contents($new . '/public/assets/index-newhash.js', 'new javascript');
    preserveReleaseAssets($old, $new);
    activateRelease($app . '/current', $new, static fn (): bool => file_get_contents($sandbox . '/webroot/index.html') === 'new-release');
    verify(realpath($app . '/current') === $new, 'Healthy release activates atomically');
    verify(file_get_contents($sandbox . '/webroot/assets/index-oldhash.js') === 'old javascript', 'In-flight old HTML can still load its hashed assets after activation');
    file_put_contents($new . '/public/assets/index-oldhash.js', 'collision');
    verify(refuses(static fn () => preserveReleaseAssets($old, $new)), 'Hash-name collision refuses overwriting existing assets');
    file_put_contents($new . '/public/assets/index-oldhash.js', 'old javascript');
    [$rollbackId, $rollbackPath] = stageRollbackRelease($app, $old);
    preserveReleaseAssets($new, $rollbackPath);
    assertRelease($rollbackPath, $rollbackId);
    verify((fileperms($rollbackPath) & 0777) === 0755 && (fileperms($rollbackPath . '/public') & 0777) === 0755, 'Rollback public directories retain traversal permissions under private umask');
    verify(!is_file($old . '/public/assets/index-newhash.js') && is_file($rollbackPath . '/public/assets/index-newhash.js'), 'Rollback stages a new artifact with current assets and preserves original release');
    verify(refuses(static fn () => activateRelease($app . '/current', $old, static fn (): bool => false)), 'Unhealthy activation fails');
    verify(realpath($app . '/current') === $new, 'Unhealthy activation restores previous release');
    activateRelease($app . '/current', $old, static fn (): bool => true);
    verify(realpath($app . '/current') === $old, 'Explicit rollback uses the same atomic mechanism');
    verify(refuses(static fn () => activateRelease($app . '/current', $new, static fn (): bool => false, $rollbackPath)), 'Automatic rollback can activate prepared previous-code snapshot');
    verify(file_get_contents($sandbox . '/webroot/index.html') === 'old-release' && is_file($sandbox . '/webroot/assets/index-newhash.js'), 'Automatic rollback preserves assets referenced during the failed activation');
    atomicReleaseLink($app . '/current', $old);

    // A separate reader continuously opens the live path while the parent swaps it.
    $reader = $sandbox . '/reader.php';
    file_put_contents($reader, '<?php for ($i=0;$i<2000;$i++) { $v=@file_get_contents($argv[1]); if (!in_array($v, ["old-release","new-release"], true)) exit(9); usleep(100); }');
    $process = proc_open([PHP_BINARY, $reader, $sandbox . '/webroot/index.html'], [0 => ['file', '/dev/null', 'r'], 1 => STDOUT, 2 => STDERR], $pipes);
    for ($i = 0; $i < 200; $i++) atomicReleaseLink($app . '/current', $i % 2 ? $old : $new);
    verify(proc_close($process) === 0, 'Concurrent readers never observe missing or mixed files during switches');

    // Mirror the hosting path: /var/www is an account parent, not necessarily public.
    $private = $sandbox . '/var/www/u3633961/data/tribeka-private';
    mkdir($private . '/uploads', 0700, true);
    file_put_contents($private . '/uploads/drawing.pdf', '%PDF fixture');
    $configPath = $private . '/config.php';
    $config = ['dsn' => 'mysql:host=localhost;dbname=tribeka_test;charset=utf8mb4', 'username' => 'fixture_user', 'password' => 'never-print-this-fixture', 'upload_dir' => $private . '/uploads', 'maintenance_lock' => $private . '/maintenance.lock'];
    file_put_contents($configPath, '<?php return ' . var_export($config, true) . ';');
    mkdir($sandbox . '/bin', 0700);
    $dump = $sandbox . '/bin/mysqldump';
    file_put_contents($dump, '#!' . PHP_BINARY . "\n<?php\n" . '$h=fopen(getenv("TRIBEKA_TEST_LOCK"),"c"); if(flock($h,LOCK_SH|LOCK_NB)) exit(8); echo "-- test SQL snapshot\\nCREATE TABLE fixture (id INT);\\n";');
    chmod($dump, 0700);
    putenv('PATH=' . $sandbox . '/bin:' . getenv('PATH'));
    putenv('TRIBEKA_TEST_LOCK=' . $private . '/maintenance.lock');
    $backup = createDataBackup($configPath);
    $manifest = json_decode((string) file_get_contents($backup . '/manifest.json'), true);
    verify(count($manifest['files']) === 3, 'Snapshot includes SQL, uploads and private configuration under exclusive lock');
    foreach ($manifest['files'] as $file => $metadata) verify(hash_file('sha256', $backup . '/' . $file) === $metadata['sha256'], 'Manifest checksum verifies ' . $file);
    verify((fileperms($backup . '/database.sql') & 0777) === 0600, 'Sensitive backup files have 0600 permissions');
    verify(!file_exists($backup . '/.mysql.cnf'), 'Temporary database credentials removed');
    file_put_contents($dump, "#!/bin/sh\nexit 1\n");
    verify(refuses(static fn () => createDataBackup($configPath)), 'SQL dump failure prevents publishing a snapshot');
    verify(count(glob($private . '/backups/tribeka-data-*')) === 1 && count(glob($private . '/backups/.pending-*')) === 0, 'Failed snapshot leaves no partial backup or credentials');
    touch($backup, time() - 20 * 86400);
    mkdir($private . '/backups/do-not-touch', 0700);
    backupPrune($private . '/backups', 10, 14);
    verify(!is_dir($backup) && is_dir($private . '/backups/do-not-touch'), 'Age retention removes only completed backups with validated names');
    fwrite(STDOUT, $checks . " deployment/backup checks passed.\n");
} finally {
    backupRemove($sandbox);
}
