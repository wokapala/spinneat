<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\UnauthorizedException;
use App\Exceptions\ValidationException;
use App\Models\User;
use App\Repositories\UserRepository;

final class AuthService
{
    public function __construct(
        private readonly UserRepository $users = new UserRepository()
    ) {}

    public function register(array $data): User
    {
        $errors = [];

        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required';
        }

        if (empty($data['password']) || strlen($data['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters';
        }

        if (empty($data['name']) || strlen(trim($data['name'])) < 2) {
            $errors['name'] = 'Name must be at least 2 characters';
        }

        if ($errors) {
            throw new ValidationException($errors);
        }

        if ($this->users->findByEmail($data['email'])) {
            throw new ValidationException(['email' => 'Email already in use']);
        }

        return $this->users->create(
            $data['email'],
            password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            trim($data['name'])
        );
    }

    public function login(string $email, string $password): User
    {
        $user = $this->users->findByEmail($email);

        if (!$user || !password_verify($password, $user->password)) {
            throw new UnauthorizedException('Invalid email or password');
        }

        $_SESSION['user_id']   = $user->id;
        $_SESSION['user_role'] = $user->role;

        return $user;
    }

    public function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    public function currentUser(): ?User
    {
        if (empty($_SESSION['user_id'])) {
            return null;
        }
        return $this->users->findById((int) $_SESSION['user_id']);
    }
}
