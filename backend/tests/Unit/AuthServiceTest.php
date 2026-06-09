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
        $this->repo
            ->method('findByEmail')
            ->willReturn($this->makeUser('existing@example.com'));

        $this->expectException(ValidationException::class);

        $this->service->register([
            'email'    => 'existing@example.com',
            'password' => 'ValidPass123',
            'name'     => 'Test User',
        ]);
    }

    public function testRegisterThrowsOnPasswordWithoutDigit(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->register([
            'email'    => 'letters@example.com',
            'password' => 'onlyletters',
            'name'     => 'Letters',
        ]);
    }

    public function testRegisterThrowsOnPasswordWithoutLetter(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->register([
            'email'    => 'digits@example.com',
            'password' => '12345678',
            'name'     => 'Digits',
        ]);
    }

    public function testRegisterTrimsNameAndEmail(): void
    {
        $this->repo->method('findByEmail')->willReturn(null);
        $this->repo
            ->expects(self::once())
            ->method('create')
            ->with(
                self::equalTo('clean@example.com'),
                self::isString(),
                self::equalTo('Clean Name')
            )
            ->willReturn($this->makeUser('clean@example.com', 'Clean Name'));

        $this->service->register([
            'email'    => '  clean@example.com  ',
            'password' => 'GoodPass1',
            'name'     => '  Clean Name  ',
        ]);
    }

    /** User is a final POPO, so tests build real instances instead of mocks. */
    private function makeUser(string $email, string $name = 'Test User'): User
    {
        return new User(
            id:        1,
            email:     $email,
            password:  password_hash('Irrelevant1', PASSWORD_BCRYPT, ['cost' => 4]),
            name:      $name,
            role:      'user',
            avatarUrl: null,
            createdAt: '2026-01-01 00:00:00',
        );
    }
}
