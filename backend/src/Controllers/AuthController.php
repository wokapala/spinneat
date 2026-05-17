<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ValidationException;
use App\Services\AuthService;

final class AuthController extends BaseController
{
    public function __construct(
        private readonly AuthService $auth = new AuthService()
    ) {}

    public function register(Request $request): void
    {
        $user = $this->auth->register($request->getBody());
        Response::success($user->toPublicArray(), 'Registration successful', 201);
    }

    public function login(Request $request): void
    {
        $email    = $request->input('email', '');
        $password = $request->input('password', '');

        if (!$email || !$password) {
            throw new ValidationException(['email' => 'Email and password are required']);
        }

        $user = $this->auth->login($email, $password);
        Response::success($user->toPublicArray(), 'Login successful');
    }

    public function logout(Request $request): void
    {
        $this->auth->logout();
        Response::success(null, 'Logged out');
    }

    public function me(Request $request): void
    {
        $user = $this->auth->currentUser();
        Response::success($user?->toPublicArray());
    }
}
