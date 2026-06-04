<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Per-session CSRF token. Generated lazily on first access and validated
 * with a constant-time comparison so timing leaks can't be used to forge it.
 */
final class Csrf
{
    private const SESSION_KEY = 'csrf_token';

    public static function token(): string
    {
        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }
        return $_SESSION[self::SESSION_KEY];
    }

    public static function verify(?string $candidate): bool
    {
        if (!$candidate || empty($_SESSION[self::SESSION_KEY])) {
            return false;
        }
        return hash_equals($_SESSION[self::SESSION_KEY], $candidate);
    }
}
