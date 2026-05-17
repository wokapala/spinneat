<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Request;
use App\Exceptions\ForbiddenException;

final class AdminMiddleware
{
    public function handle(Request $request): void
    {
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
    }
}
