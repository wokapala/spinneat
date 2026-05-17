<?php

declare(strict_types=1);

namespace App\Exceptions;

final class ForbiddenException extends AppException
{
    public function __construct(string $message = 'Forbidden')
    {
        parent::__construct($message, 403);
    }
}
