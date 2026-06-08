<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Csrf;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses — each test needs a fresh $_SESSION.
 */
final class CsrfTest extends TestCase
{
    protected function setUp(): void
    {
        $_SESSION = [];
    }

    public function testTokenIsCachedAcrossCalls(): void
    {
        $first  = Csrf::token();
        $second = Csrf::token();

        self::assertSame($first, $second);
        self::assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $first);
    }

    public function testVerifyAcceptsMatchingToken(): void
    {
        $token = Csrf::token();
        self::assertTrue(Csrf::verify($token));
    }

    public function testVerifyRejectsTamperedToken(): void
    {
        Csrf::token();
        self::assertFalse(Csrf::verify('not-the-real-token'));
    }

    public function testVerifyRejectsEmptyToken(): void
    {
        Csrf::token();
        self::assertFalse(Csrf::verify(''));
        self::assertFalse(Csrf::verify(null));
    }

    public function testVerifyFailsWhenSessionHasNoToken(): void
    {
        // $_SESSION wiped in setUp — nothing to compare against.
        self::assertFalse(Csrf::verify('anything'));
    }
}
