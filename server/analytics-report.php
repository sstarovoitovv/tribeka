<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$configPath = getenv('TRIBEKA_PRIVATE_CONFIG') ?: '/var/www/u3633961/data/tribeka-private/config.php';
$config = require $configPath;
$directory = $config['analytics_dir'] ?? dirname($configPath) . '/analytics';
$report = [];
foreach (glob($directory . '/*.json') ?: [] as $file) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}\.json$/D', basename($file)) || is_link($file)) continue;
    $day = substr(basename($file), 0, 10);
    if ($day < gmdate('Y-m-d', time() - 89 * 86400)) continue;
    $rows = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    foreach ($rows as $row) $report[] = ['day' => $day, ...$row['dimensions'], 'count' => $row['count']];
}
echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), PHP_EOL;
