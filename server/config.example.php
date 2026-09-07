<?php

declare(strict_types=1);

return [
    'dsn' => 'mysql:host=localhost;dbname=database_name;charset=utf8mb4',
    'username' => 'database_user',
    'password' => 'replace_with_a_strong_password',
    'upload_dir' => '/absolute/path/outside/web/root/uploads',
    'maintenance_lock' => '/absolute/path/outside/web/root/maintenance.lock',
    'rate_limit_dir' => '/absolute/path/outside/web/root/rate-limits',
    'trusted_origins' => [
        'https://xn--80abmkm6an.xn--p1ai',
        'https://www.xn--80abmkm6an.xn--p1ai',
        // Add the exact approved preview origin here; never *.vercel.app.
    ],
    'backup_dir' => '/absolute/path/outside/web/root/backups',
    'backup_keep' => 10,
    'backup_max_age_days' => 14,
    'analytics_campaigns' => [], // Same approved campaign codes as VITE_ANALYTICS_CAMPAIGNS.
    'analytics_dir' => '/absolute/path/outside/web/root/analytics',
    'recipient' => 'leads@example.com',
    'sender' => 'noreply@example.com',
    'retention_days' => 365,
];
