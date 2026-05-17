<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Exceptions\ValidationException;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class AuthServiceTest extends TestCase
{
    private AuthService $service;
    private MockObject $repo;

    protected function setUp(): void
    {
        $this->repo    = $this->createMock(UserRepository::class);
        $this->service = new AuthService($this->repo);
    }

    public function testRegisterThrowsOnShortPassword(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->register([
            'email'    => 'test@example.com',
            'password' => '123',
            'name'     => 'Test',
        ]);
    }

    public function testRegisterThrowsOnInvalidEmail(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->register([
            'email'    => 'not-an-email',
            'password' => 'ValidPass123',
            'name'     => 'Test',
        ]);
    }

    public function testRegisterThrowsOnDuplicateEmail(): void
    {
        $existingUser = $this->createMock(User::class);

        $this->repo
            ->method('findByEmail')
            ->willReturn($existingUser);

        $this->expectException(ValidationException::class);

        $this->service->register([
            'email'    => 'existing@example.com',
            'password' => 'ValidPass123',
            'name'     => 'Test User',
        ]);
    }
}
