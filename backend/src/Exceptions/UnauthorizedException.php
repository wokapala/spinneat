<?php

declare(strict_types=1);

namespace App\Exceptions;

final class UnauthorizedException extends AppException
{
    public function __construct(string $message = 'Unauthorized')
    {
        parent::__construct($message, 401);
    }
}
