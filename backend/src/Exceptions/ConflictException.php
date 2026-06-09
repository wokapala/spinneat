<?php

declare(strict_types=1);

namespace App\Exceptions;

final class ConflictException extends AppException
{
    public function __construct(string $message = 'Conflict')
    {
        parent::__construct($message, 409);
    }
}
