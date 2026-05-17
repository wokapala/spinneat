<?php

declare(strict_types=1);

namespace App\Exceptions;

final class NotFoundException extends AppException
{
    public function __construct(string $message = 'Not Found')
    {
        parent::__construct($message, 404);
    }
}
