<?php
declare(strict_types=1);
namespace Tribeka\Analytics;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }

function validateEvent(array $input, array $paths, array $campaigns): array
{
    $allowed = ['event', 'path', 'source', 'medium', 'campaign', 'channel', 'service'];
    if (array_diff(array_keys($input), $allowed)) throw new \InvalidArgumentException('Unexpected analytics fields');
    $values = [
        'event' => ['page_view', 'form_start', 'form_submit', 'phone_click', 'messenger_click', 'email_click', 'service_click'],
        'path' => $paths,
        'source' => ['yandex', 'google', 'telegram', 'vk', 'whatsapp', 'email', 'direct', 'other'],
        'medium' => ['cpc', 'organic', 'social', 'referral', 'email', 'none', 'other'],
        'campaign' => [...$campaigns, 'none', 'other'],
    ];
    $result = [];
    foreach ($values as $key => $options) {
        if (!isset($input[$key]) || !is_string($input[$key]) || !in_array($input[$key], $options, true)) throw new \InvalidArgumentException('Invalid analytics category');
        $result[$key] = $input[$key];
    }
    if ($result['event'] === 'messenger_click') {
        if (!in_array($input['channel'] ?? null, ['telegram', 'whatsapp', 'max'], true)) throw new \InvalidArgumentException('Invalid messenger');
        $result['channel'] = $input['channel'];
    } elseif (isset($input['channel'])) throw new \InvalidArgumentException('Unexpected messenger');
    if ($result['event'] === 'service_click') {
        if (!is_string($input['service'] ?? null) || !in_array($input['service'], $paths, true) || !preg_match('~^/services/[^/]+/$~D', $input['service'])) throw new \InvalidArgumentException('Invalid service');
        $result['service'] = $input['service'];
    } elseif (isset($input['service'])) throw new \InvalidArgumentException('Unexpected service');
    return $result;
}

function storeEvent(string $directory, array $event, ?int $now = null): void
{
    $now ??= time();
    $lock = fopen($directory . '/aggregate.lock', 'c+');
    if (!$lock || !flock($lock, LOCK_EX)) throw new \RuntimeException('Analytics unavailable');
    try {
        $path = $directory . '/' . gmdate('Y-m-d', $now) . '.json';
        if (is_link($path)) throw new \RuntimeException('Invalid analytics storage');
        $rows = is_file($path) ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : [];
        $key = hash('sha256', json_encode($event, JSON_THROW_ON_ERROR));
        if (!isset($rows[$key]) && count($rows) >= 10000) throw new \RuntimeException('Daily analytics cardinality limit');
        $rows[$key] = ['dimensions' => $event, 'count' => ($rows[$key]['count'] ?? 0) + 1];
        $temp = tempnam($directory, '.aggregate-');
        if ($temp === false) throw new \RuntimeException('Analytics unavailable');
        try {
            chmod($temp, 0600);
            $json = json_encode($rows, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            if (file_put_contents($temp, $json) !== strlen($json) || !rename($temp, $path)) throw new \RuntimeException('Analytics unavailable');
        } finally { if (is_file($temp)) unlink($temp); }
        foreach (glob($directory . '/*.json') ?: [] as $old) {
            if (preg_match('/^\d{4}-\d{2}-\d{2}\.json$/D', basename($old)) && !is_link($old) && basename($old) < gmdate('Y-m-d', $now - 89 * 86400) . '.json') unlink($old);
        }
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
