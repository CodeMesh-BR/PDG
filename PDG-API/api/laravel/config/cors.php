<?php

$csv = static function (?string $value): array {
    if ($value === null || trim($value) === '') {
        return [];
    }

    return array_values(array_filter(
        array_map('trim', explode(',', $value)),
        static fn (string $item): bool => $item !== ''
    ));
};

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $csv(env(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3001,http://127.0.0.1:3001,http://localhost:3000,http://127.0.0.1:3000'
    )),

    'allowed_origins_patterns' => $csv(env('CORS_ALLOWED_ORIGIN_PATTERNS', '')),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => (int) env('CORS_MAX_AGE', 86400),

    'supports_credentials' => filter_var(
        env('CORS_SUPPORTS_CREDENTIALS', false),
        FILTER_VALIDATE_BOOLEAN
    ),
];
