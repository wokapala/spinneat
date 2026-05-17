<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Request;
use App\Exceptions\UnauthorizedException;

final class AuthMiddleware
{
    public function handle(Request $request): void
    {
        if (empty($_SESSION['user_id'])) {
            throw new UnauthorizedException('Authentication required');
        }
    }
}
