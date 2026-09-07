<?php
declare(strict_types=1);
require_once __DIR__ . '/_lib/request-security.php';
require_once __DIR__ . '/_lib/analytics.php';
use function Tribeka\Security\{privateConfigPath, trustedOrigin, ensurePrivateDirectory, takeRateLimit, acquireMaintenanceLock};
use function Tribeka\Analytics\{validateEvent, storeEvent};

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function analyticsRespond(int $status): never { http_response_code($status); exit; }
$configPath = privateConfigPath();
if (!is_file($configPath)) analyticsRespond(503);
try {
    $config = require $configPath;
    if (!is_array($config) || !is_array($config['trusted_origins'] ?? [])) analyticsRespond(503);
} catch (Throwable) { analyticsRespond(503); }
$origin = trustedOrigin($_SERVER['HTTP_ORIGIN'] ?? null, $config);
if ($origin !== null) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') analyticsRespond($origin ? 204 : 403);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST, OPTIONS'); analyticsRespond(405); }
if ($origin === null) analyticsRespond(403);
if (($_SERVER['HTTP_DNT'] ?? '') === '1' || ($_SERVER['HTTP_SEC_GPC'] ?? '') === '1') analyticsRespond(204);
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') analyticsRespond(415);
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 2048) analyticsRespond(413);
$body = file_get_contents('php://input', false, null, 0, 2049);
if ($body === false || strlen($body) > 2048) analyticsRespond(413);
try {
    $data = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($data)) analyticsRespond(422);
    $routesFile = __DIR__ . '/_lib/analytics-routes.json';
    if (!is_file($routesFile)) analyticsRespond(503);
    $paths = json_decode(file_get_contents($routesFile), true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($paths)) analyticsRespond(503);
    $event = validateEvent($data, $paths, $config['analytics_campaigns'] ?? []);
} catch (JsonException | InvalidArgumentException $error) { analyticsRespond(422); }
catch (Throwable $error) { analyticsRespond(503); }
try {
    $directory = $config['analytics_dir'] ?? dirname($configPath) . '/analytics';
    ensurePrivateDirectory($directory, dirname(__DIR__));
    $rateDirectory = dirname($configPath) . '/analytics-rate';
    ensurePrivateDirectory($rateDirectory, dirname(__DIR__));
    if (takeRateLimit($rateDirectory, ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ':' . $event['event'], time(), 1) > 0) analyticsRespond(429);
    $lock = acquireMaintenanceLock($config['maintenance_lock'] ?? dirname($configPath) . '/maintenance.lock');
    if (!$lock) analyticsRespond(503);
    try { storeEvent($directory, $event); } finally { flock($lock, LOCK_UN); fclose($lock); }
} catch (Throwable $error) { error_log('Tribeka analytics storage unavailable'); analyticsRespond(503); }
analyticsRespond(204);
