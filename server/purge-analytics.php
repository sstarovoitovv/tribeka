<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../public/api/_lib/request-security.php';
$configPath = Tribeka\Security\privateConfigPath();
$config = require $configPath;
$directory = $config['analytics_dir'] ?? dirname($configPath) . '/analytics';
if (!is_dir($directory)) exit;
$maintenance = Tribeka\Security\acquireMaintenanceLock($config['maintenance_lock'] ?? dirname($configPath) . '/maintenance.lock');
if (!$maintenance) { fwrite(STDERR, "Backup in progress; retry analytics retention.\n"); exit(1); }
$lock = fopen($directory . '/aggregate.lock', 'c+');
if (!$lock || !flock($lock, LOCK_EX)) exit(1);
$count = 0;
try {
    foreach (glob($directory . '/*.json') ?: [] as $file) {
        if (preg_match('/^\d{4}-\d{2}-\d{2}\.json$/D', basename($file)) && !is_link($file) && basename($file) < gmdate('Y-m-d', time() - 89 * 86400) . '.json') {
            if (!unlink($file)) throw new RuntimeException('Cannot remove expired analytics');
            $count++;
        }
    }
    echo "Expired analytics days removed: $count\n";
} finally { flock($lock, LOCK_UN); fclose($lock); flock($maintenance, LOCK_UN); fclose($maintenance); }
