<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/public/api/_lib/request-security.php';

use Tribeka\Security\ValidationException;
use function Tribeka\Security\acquireMaintenanceLock;
use function Tribeka\Security\ensurePrivateDirectory;
use function Tribeka\Security\inspectAttachment;
use function Tribeka\Security\normalizedUploads;
use function Tribeka\Security\takeRateLimit;
use function Tribeka\Security\trustedOrigin;
use function Tribeka\Security\validateAttachments;
use function Tribeka\Security\validateFields;
use const Tribeka\Security\CONSENT_VERSION;
use const Tribeka\Security\POLICY_VERSION;

// Each worker competes for the same record after a common barrier. proc_open
// exercises independent PHP processes, matching PHP-FPM/Apache workers.
if (($argv[1] ?? '') === '--rate-worker') {
    while (!is_file($argv[3])) {
        usleep(1000);
    }
    echo takeRateLimit($argv[2], 'concurrent-client', 1000) === 0 ? 'accepted' : 'limited';
    exit;
}

$tests = 0;
$temp = sys_get_temp_dir() . '/tribeka-php-test-' . bin2hex(random_bytes(8));
mkdir($temp, 0700);
$server = null;

function check(bool $condition, string $description): void
{
    global $tests;
    if (!$condition) {
        throw new RuntimeException($description);
    }
    $tests++;
    echo "PASS {$description}\n";
}

function rejects(callable $operation, string $description, int $status = 422): void
{
    try {
        $operation();
    } catch (ValidationException $exception) {
        check($exception->status === $status, $description);
        return;
    }
    throw new RuntimeException('Expected rejection: ' . $description);
}

function deleteTree(string $directory): void
{
    if (!is_dir($directory)) {
        return;
    }
    foreach (new FilesystemIterator($directory, FilesystemIterator::SKIP_DOTS) as $file) {
        if ($file->isDir() && !$file->isLink()) {
            deleteTree($file->getPathname());
        } else {
            unlink($file->getPathname());
        }
    }
    rmdir($directory);
}

function fixture(string $name, string $contents): string
{
    global $temp;
    $path = $temp . '/' . $name;
    file_put_contents($path, $contents);
    return $path;
}

function httpRequest(string $base, string $method, array|string|null $body = null, ?string $origin = null, array $headers = []): array
{
    $curl = curl_init($base . '/api/request.php');
    $responseHeaders = [];
    if ($origin !== null) {
        $headers[] = 'Origin: ' . $origin;
    }
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_HEADERFUNCTION => static function ($handle, string $header) use (&$responseHeaders): int {
            if (str_contains($header, ':')) {
                [$name, $value] = explode(':', $header, 2);
                $responseHeaders[strtolower(trim($name))] = trim($value);
            }
            return strlen($header);
        },
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }
    $text = curl_exec($curl);
    if ($text === false) {
        throw new RuntimeException('HTTP test failed: ' . curl_error($curl));
    }
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    return ['status' => $status, 'headers' => $responseHeaders, 'body' => $text];
}

try {
    $valid = [
        'name' => ' Александр ',
        'phone' => '8 (906) 260-30-60',
        'privacy' => 'on',
        'consent_version' => CONSENT_VERSION,
        'policy_version' => POLICY_VERSION,
        'message' => "Изготовить деталь.\nМатериал: сталь.",
        'source_url' => 'https://xn--80abmkm6an.xn--p1ai/contacts/?email=private@example.com#secret',
    ];
    $fields = validateFields($valid);
    check($fields['name'] === 'Александр' && $fields['phone'] === '+79062603060', 'valid Russian input is normalized on the server');
    check($fields['sourceUrl'] === 'https://xn--80abmkm6an.xn--p1ai/contacts/', 'source URL stores no query or fragment');
    check(validateFields([...$valid, 'phone' => '+44 20 7946 0958'])['phone'] === '+442079460958', 'international E.164 input remains supported');
    foreach (['false', '0', '', 'yes', 'true'] as $privacy) {
        rejects(fn () => validateFields([...$valid, 'privacy' => $privacy]), 'consent value ' . var_export($privacy, true) . ' is rejected');
    }
    foreach (['name', 'phone', 'message', 'privacy', 'website', 'source_url', 'policy_version'] as $field) {
        rejects(fn () => validateFields([...$valid, $field => ['nested' => 'payload']]), 'nested ' . $field . ' is rejected without a warning');
    }
    foreach (['test', '+7 123', '+7 000 000 0000', '9062603060', '+7 906 2603060 ext123', "+7\r\n9062603060", '+0000000000'] as $phone) {
        rejects(fn () => validateFields([...$valid, 'phone' => $phone]), 'invalid phone ' . json_encode($phone) . ' is rejected');
    }
    rejects(fn () => validateFields([...$valid, 'name' => str_repeat('Я', 121)]), 'name length is bounded in Unicode characters');
    rejects(fn () => validateFields([...$valid, 'name' => "Alice\r\nBcc: bad@example.com"]), 'name header injection is rejected');
    rejects(fn () => validateFields([...$valid, 'message' => "bad\x00value"]), 'control bytes are rejected');
    rejects(fn () => validateFields([...$valid, 'message' => "bad\xFFvalue"]), 'invalid UTF-8 is rejected');
    rejects(fn () => validateFields([...$valid, 'policy_version' => 'old']), 'stale policy version returns conflict', 409);
    rejects(fn () => validateFields([...$valid, 'source_url' => 'https://attacker.example/page']), 'foreign source page is rejected');
    check(trustedOrigin('https://attacker.vercel.app') === null, 'arbitrary Vercel projects are not trusted');
    check(trustedOrigin('http://localhost:5173') === null, 'localhost is not trusted by production defaults');
    check(trustedOrigin('https://review.vercel.app', ['trusted_origins' => ['https://review.vercel.app']]) !== null, 'explicit preview origin can be allowed');
    check(trustedOrigin('https://xn--80abmkm6an.xn--p1ai.attacker.com') === null, 'origin suffix spoof is rejected');

    $pdf = fixture('drawing.pdf', "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n");
    $png = fixture('drawing.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMkkAAAAASUVORK5CYII='));
    $step = fixture('drawing.step', "ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Part'),'2;1');\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;\n");
    $dxf = fixture('drawing.dxf', "0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
    $iges = fixture('drawing.iges', str_pad('Test CAD drawing', 72) . "S      1\n" . str_pad('S      1G      0D      0P      0', 72) . "T      1\n");
    foreach ([$pdf, $png, $step, $dxf, $iges] as $path) {
        $attachment = inspectAttachment($path, basename($path));
        check($attachment['size_bytes'] === filesize($path), basename($path) . ' content and real bytes are accepted');
    }
    $exe = fixture('renamed.pdf', "MZ" . str_repeat("\0", 128) . '<?php echo "bad";');
    $php = fixture('renamed.step', '<?php system($_GET["cmd"]);');
    $html = fixture('renamed.dxf', '<html><script>alert(1)</script></html>');
    foreach ([$exe, $php, $html] as $path) {
        rejects(fn () => inspectAttachment($path, basename($path)), basename($path) . ' renamed executable/web content is rejected');
    }
    rejects(fn () => inspectAttachment($pdf, 'payload.php.pdf'), 'double executable extension is rejected');
    rejects(fn () => inspectAttachment($pdf, '../drawing.pdf'), 'path traversal filename is rejected');
    rejects(fn () => inspectAttachment($pdf, "drawing\r\n.pdf"), 'attachment header injection is rejected');
    rejects(fn () => inspectAttachment($pdf, 'drawing.png'), 'valid PDF renamed PNG is rejected');
    rejects(fn () => inspectAttachment(fixture('truncated.pdf', '%PDF-1.7 bad'), 'truncated.pdf'), 'truncated PDF is rejected');
    rejects(fn () => inspectAttachment(fixture('empty.pdf', ''), 'empty.pdf'), 'empty file is rejected', 413);
    $oversize = $temp . '/large.pdf';
    $handle = fopen($oversize, 'wb');
    ftruncate($handle, 15 * 1024 * 1024 + 1);
    fclose($handle);
    rejects(fn () => inspectAttachment($oversize, 'large.pdf'), 'real filesystem size enforces the upload limit', 413);
    $upload = ['name' => ['drawing.pdf'], 'tmp_name' => [$pdf], 'error' => [UPLOAD_ERR_OK], 'size' => [filesize($pdf)], 'type' => ['text/x-php']];
    check(count(normalizedUploads(['attachments' => $upload])) === 1, 'multipart array shape is supported independently of client MIME');
    $single = array_map(fn ($items) => $items[0], $upload);
    check(count(normalizedUploads(['attachments' => $single])) === 1, 'legacy single multipart upload remains supported');
    rejects(fn () => normalizedUploads(['attachments' => [...$upload, 'size' => []]]), 'mismatched multipart arrays are rejected');
    rejects(fn () => normalizedUploads(['attachments' => [...$upload, 'name' => [['nested.pdf']]]]), 'nested multipart filename is rejected');
    rejects(fn () => normalizedUploads(['attachments' => array_map(fn ($items) => array_fill(0, 6, $items[0]), $upload)]), 'six uploads are rejected');
    rejects(fn () => validateAttachments(['attachments' => $single]), 'local filesystem paths cannot impersonate HTTP uploads');

    $rates = $temp . '/rates';
    check(takeRateLimit($rates, 'client', 1000) === 0, 'first rate reservation succeeds');
    check(takeRateLimit($rates, 'client', 1000) === 30, 'same client is rejected immediately');
    check(takeRateLimit($rates, 'other-client', 1000) === 0, 'independent client is unaffected');
    check(takeRateLimit($rates, 'client', 1029) === 1, 'Retry-After reflects remaining seconds');
    check(takeRateLimit($rates, 'client', 1030) === 0, 'reservation expires at the exact boundary');
    $workers = [];
    $barrier = $temp . '/start-workers';
    for ($i = 0; $i < 16; $i++) {
        $pipes = [];
        $process = proc_open([PHP_BINARY, __FILE__, '--rate-worker', $rates, $barrier], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) {
            throw new RuntimeException('Could not spawn rate limiter worker');
        }
        fclose($pipes[0]);
        $workers[] = [$process, $pipes];
    }
    touch($barrier);
    $accepted = 0;
    foreach ($workers as [$process, $pipes]) {
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        if (proc_close($process) !== 0 || $errors !== '') {
            throw new RuntimeException('Rate worker failed: ' . $errors);
        }
        $accepted += $output === 'accepted' ? 1 : 0;
    }
    check($accepted === 1, '16 concurrent PHP processes reserve exactly one submission');
    check((fileperms($rates) & 0777) === 0700, 'rate directory has private permissions');
    foreach (glob($rates . '/*.json') as $file) {
        check((fileperms($file) & 0777) === 0600, 'rate state has private permissions');
    }
    $corruptKey = 'corrupt';
    file_put_contents($rates . '/' . substr(hash('sha256', $corruptKey), 0, 2) . '.json', '{broken');
    try {
        takeRateLimit($rates, $corruptKey);
        throw new RuntimeException('Corrupt limiter unexpectedly accepted a request');
    } catch (JsonException) {
        check(true, 'corrupt rate state fails closed');
    }
    $lockPath = $temp . '/maintenance.lock';
    $exclusive = fopen($lockPath, 'c+b');
    flock($exclusive, LOCK_EX);
    check(acquireMaintenanceLock($lockPath, 0.03) === false, 'backup lock blocks form mutation with a bounded wait');
    flock($exclusive, LOCK_UN);
    fclose($exclusive);
    $shared = acquireMaintenanceLock($lockPath);
    check(is_resource($shared), 'form can acquire shared lock after backup completes');
    $secondShared = acquireMaintenanceLock($lockPath);
    check(is_resource($secondShared), 'independent submissions may share maintenance lock');
    fclose($shared);
    fclose($secondShared);
    try {
        ensurePrivateDirectory(dirname(__DIR__, 2) . '/public');
        throw new LogicException('Public storage was permitted');
    } catch (RuntimeException $exception) {
        check(!$exception instanceof LogicException, 'storage inside the web root is rejected');
    }

    // Real HTTP multipart requests exercise PHP upload parsing/is_uploaded_file.
    // A deliberately nonexistent SQLite database/driver contract prevents any
    // access to production data and lets us verify rollback cleanup after upload.
    $httpRates = $temp . '/http-rates';
    $config = [
        'dsn' => 'sqlite:' . $temp . '/isolated.sqlite',
        'username' => '', 'password' => '',
        'upload_dir' => $temp . '/uploads',
        'rate_limit_dir' => $httpRates,
        'maintenance_lock' => $temp . '/http-maintenance.lock',
        'recipient' => 'test@example.com', 'sender' => 'test@example.com',
        'trusted_origins' => ['http://localhost:5173'],
    ];
    $configFile = fixture('config.php', "<?php return " . var_export($config, true) . ";\n");
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $error);
    if ($socket === false) {
        throw new RuntimeException('Unable to allocate HTTP test port: ' . $error);
    }
    $address = stream_socket_get_name($socket, false);
    fclose($socket);
    $pipes = [];
    $server = proc_open(
        [PHP_BINARY, '-d', 'upload_max_filesize=16M', '-d', 'post_max_size=17M', '-d', 'display_errors=0', '-S', $address, '-t', dirname(__DIR__, 2) . '/public'],
        [0 => ['pipe', 'r'], 1 => ['file', $temp . '/http.log', 'a'], 2 => ['file', $temp . '/http.log', 'a']],
        $pipes,
        null,
        [...getenv(), 'TRIBEKA_PRIVATE_CONFIG' => $configFile]
    );
    if (!is_resource($server)) {
        throw new RuntimeException('Unable to start isolated PHP HTTP server');
    }
    fclose($pipes[0]);
    for ($i = 0; $i < 100; $i++) {
        $connection = @stream_socket_client('tcp://' . $address, $errno, $error, 0.02);
        if ($connection !== false) {
            fclose($connection);
            break;
        }
        usleep(20000);
    }
    $base = 'http://' . $address;
    check(httpRequest($base, 'GET')['status'] === 405, 'HTTP endpoint returns 405 for GET');
    $preflight = httpRequest($base, 'OPTIONS', null, 'http://localhost:5173');
    check($preflight['status'] === 204 && $preflight['body'] === '', 'trusted preflight is an empty 204');
    check(httpRequest($base, 'OPTIONS', null, 'https://attacker.vercel.app')['status'] === 403, 'untrusted preview preflight is forbidden');
    check(httpRequest($base, 'POST', $valid, 'https://attacker.vercel.app')['status'] === 403, 'untrusted POST is forbidden');
    check(httpRequest($base, 'POST', '{}', null, ['Content-Type: application/json'])['status'] === 415, 'unexpected JSON body is rejected');
    $badConsent = httpRequest($base, 'POST', [...$valid, 'privacy' => 'false']);
    check($badConsent['status'] === 422, 'real HTTP request cannot submit false consent');
    $limited = httpRequest($base, 'POST', $valid);
    check($limited['status'] === 429 && isset($limited['headers']['retry-after']), 'HTTP rate limit includes Retry-After');
    deleteTree($httpRates);
    $nested = httpRequest($base, 'POST', http_build_query([...$valid, 'name' => ['value']]), null, ['Content-Type: application/x-www-form-urlencoded']);
    check($nested['status'] === 422 && json_decode($nested['body'], true) !== null, 'HTTP nested scalar returns JSON validation error');
    deleteTree($httpRates);
    $forged = httpRequest($base, 'POST', [...$valid, 'attachments[0]' => new CURLFile($exe, 'application/pdf', 'drawing.pdf')]);
    check($forged['status'] === 422, 'real multipart executable renamed PDF is rejected despite forged browser MIME');
    deleteTree($httpRates);
    $tooMany = $valid;
    for ($i = 0; $i < 6; $i++) {
        $tooMany['attachments[' . $i . ']'] = new CURLFile($pdf, 'application/pdf', 'drawing-' . $i . '.pdf');
    }
    check(httpRequest($base, 'POST', $tooMany)['status'] === 422, 'HTTP parser retains all six attachments and rejects the count');
    deleteTree($httpRates);
    $validUpload = httpRequest($base, 'POST', [...$valid, 'attachments[0]' => new CURLFile($pdf, 'text/x-php', 'drawing.pdf'), 'attachments[1]' => new CURLFile($step, 'application/octet-stream', 'drawing.step')]);
    check($validUpload['status'] === 500, 'two valid uploads pass validation and reach isolated storage failure');
    check(glob($temp . '/uploads/*') === [], 'storage failure removes both uploaded files and their directory');
    check(($validUpload['headers']['cache-control'] ?? '') === 'no-store', 'responses containing request information cannot be cached');
    $log = file_get_contents($temp . '/http.log');
    check(!str_contains($log, 'Warning:') && !str_contains($log, 'Fatal error:'), 'malformed HTTP requests produce no PHP warnings or fatal errors');
    echo "\n{$tests} PHP security checks passed.\n";
} catch (Throwable $exception) {
    fwrite(STDERR, "FAIL: " . $exception->getMessage() . "\n" . $exception->getTraceAsString() . "\n");
    exit(1);
} finally {
    if (is_resource($server)) {
        proc_terminate($server);
        proc_close($server);
    }
    deleteTree($temp);
}
