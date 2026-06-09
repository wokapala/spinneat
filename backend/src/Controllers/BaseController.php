<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\ValidationException;

abstract class BaseController
{
    protected function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $rule) {
            $parts    = explode('|', $rule);
            $required = in_array('required', $parts);
            $value    = $data[$field] ?? null;

            if ($required && ($value === null || $value === '')) {
                $errors[$field] = "Field '{$field}' is required";
                continue;
            }

            if ($value !== null) {
                if (!is_scalar($value)) {
                    $errors[$field] = "Field '{$field}' must be a scalar value";
                    continue;
                }

                foreach ($parts as $part) {
                    if (str_starts_with($part, 'min:')) {
                        $min = (int) substr($part, 4);
                        if (strlen((string) $value) < $min) {
                            $errors[$field] = "Field '{$field}' must be at least {$min} characters";
                        }
                    }
                    if (str_starts_with($part, 'max:')) {
                        $max = (int) substr($part, 4);
                        if (strlen((string) $value) > $max) {
                            $errors[$field] = "Field '{$field}' must be at most {$max} characters";
                        }
                    }
                    if ($part === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[$field] = "Field '{$field}' must be a valid email";
                    }
                    if ($part === 'int' && filter_var($value, FILTER_VALIDATE_INT) === false) {
                        $errors[$field] = "Field '{$field}' must be an integer";
                    }
                }
            }
        }

        if ($errors) {
            throw new ValidationException($errors);
        }

        return $data;
    }

    protected function currentUserId(): int
    {
        return (int) ($_SESSION['user_id'] ?? 0);
    }

    protected function currentUserRole(): string
    {
        return $_SESSION['user_role'] ?? 'guest';
    }
}
