<?php

declare(strict_types=1);

return [
    'dsn' => 'mysql:host=localhost;dbname=database_name;charset=utf8mb4',
    'username' => 'database_user',
    'password' => 'replace_with_a_strong_password',
    'upload_dir' => '/absolute/path/outside/web/root/uploads',
    'recipient' => 'leads@example.com',
    'sender' => 'noreply@example.com',
    'retention_days' => 365,
];
