<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Csrf;
use App\Core\Request;
use App\Exceptions\ForbiddenException;

/**
 * Rejects state-changing requests that don't carry a valid CSRF token in
 * the X-CSRF-Token header. Safe methods (GET/HEAD/OPTIONS) are skipped
 * because they should never mutate server state.
 */
final class CsrfMiddleware
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request): void
    {
        if (in_array($request->method(), self::SAFE_METHODS, true)) {
            return;
        }

        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        if (!Csrf::verify($header)) {
            throw new ForbiddenException('CSRF token missing or invalid');
        }
    }
}
