<?php
declare(strict_types=1);
require __DIR__ . '/../../public/api/_lib/analytics.php';
use function Tribeka\Analytics\{validateEvent, storeEvent};
$directory = sys_get_temp_dir() . '/tribeka-analytics-test-' . bin2hex(random_bytes(6));
mkdir($directory, 0700);
$checks = 0;
function check(bool $value, string $label): void { global $checks; if (!$value) throw new RuntimeException($label); $checks++; }
$event = ['event'=>'form_submit', 'path'=>'/contacts/', 'source'=>'yandex', 'medium'=>'cpc', 'campaign'=>'other'];
try {
    check(validateEvent($event, ['/contacts/'], []) === $event, 'Valid dimensions');
    foreach ([['name'=>'Private'], ['path'=>'/contacts/?phone=123'], ['source'=>['nested']], ['campaign'=>'private@example.com'], ['channel'=>'telegram']] as $bad) {
        try { validateEvent([...$event, ...$bad], ['/contacts/'], []); throw new RuntimeException('Unsafe input accepted'); }
        catch (InvalidArgumentException) { $checks++; }
    }
    $now = strtotime('2026-09-07T12:00:00Z');
    file_put_contents($directory . '/2026-01-01.json', '{}');
    storeEvent($directory, $event, $now);
    storeEvent($directory, $event, $now);
    $stored = json_decode(file_get_contents($directory . '/2026-09-07.json'), true, 512, JSON_THROW_ON_ERROR);
    check(array_values($stored)[0]['count'] === 2, 'Atomic aggregate increment');
    check(count($stored) === 1, 'No per-visitor records');
    check(!is_file($directory . '/2026-01-01.json'), 'Expired daily data removed');
    check((fileperms($directory . '/2026-09-07.json') & 0777) === 0600, 'Closed aggregate file');
    echo "Analytics PHP: $checks checks passed\n";
} finally { foreach (glob($directory . '/*') as $file) unlink($file); rmdir($directory); }

// Exercise the real collector with isolated files and no production backend.
$directory = sys_get_temp_dir() . '/tribeka-collector-test-' . bin2hex(random_bytes(6));
mkdir($directory . '/public/api/_lib', 0700, true);
foreach (['analytics.php', '_lib/analytics.php', '_lib/request-security.php'] as $file) copy(__DIR__ . '/../../public/api/' . $file, $directory . '/public/api/' . $file);
file_put_contents($directory . '/public/api/_lib/analytics-routes.json', '["/contacts/"]');
file_put_contents($directory . '/config.php', '<?php return ' . var_export(['trusted_origins' => ['http://localhost'], 'analytics_dir' => $directory . '/data'], true) . ';');
$socket = stream_socket_server('tcp://127.0.0.1:0');
$address = stream_socket_get_name($socket, false); fclose($socket);
$log = $directory . '/server.log';
$process = proc_open([PHP_BINARY, '-d', 'display_errors=1', '-S', $address, '-t', $directory . '/public'], [0=>['file','/dev/null','r'], 1=>['file',$log,'a'], 2=>['file',$log,'a']], $pipes, null, [...getenv(), 'TRIBEKA_PRIVATE_CONFIG'=>$directory . '/config.php']);
try {
    for ($attempt = 0; $attempt < 50; $attempt++) {
        $ready = @stream_socket_client('tcp://' . $address, $errno, $error, .1);
        if ($ready) { fclose($ready); break; }
        usleep(20000);
    }
    $send = function (array $payload, array $headers = [], string $method = 'POST') use ($address): int {
        $header = ['Origin: http://localhost', 'Content-Type: application/json', ...$headers];
        $context = stream_context_create(['http'=>['method'=>$method, 'header'=>implode("\r\n", $header), 'content'=>json_encode($payload), 'ignore_errors'=>true, 'timeout'=>3]]);
        $body = file_get_contents('http://' . $address . '/api/analytics.php', false, $context);
        if ($body !== '') throw new RuntimeException('Collector leaked response body');
        preg_match('/HTTP\/\S+ (\d+)/', $http_response_header[0], $status);
        return (int) $status[1];
    };
    check($send($event, [], 'OPTIONS') === 204, 'Collector preflight');
    check($send([...$event, 'phone'=>'private']) === 422, 'Collector rejects PII fields');
    check($send($event, ['DNT: 1']) === 204 && !is_dir($directory . '/data'), 'DNT stores nothing');
    check($send($event, ['Sec-GPC: 1']) === 204 && !is_dir($directory . '/data'), 'GPC stores nothing');
    check($send($event) === 204, 'Collector persists accepted dimensions');
    check($send($event) === 429, 'Collector rate limit');
    check($send([...$event, 'event'=>'phone_click']) === 204, 'Different conversion type is not lost after page event');
    $file = glob($directory . '/data/*.json')[0];
    $rows = json_decode(file_get_contents($file), true);
    check(count($rows) === 2, 'HTTP events stored as anonymous groups');
    echo "Analytics PHP total: $checks checks passed (including actual HTTP collector)\n";
} finally {
    proc_terminate($process); proc_close($process);
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($iterator as $entry) { if ($entry->isDir()) rmdir($entry->getPathname()); else unlink($entry->getPathname()); }
    rmdir($directory);
}
