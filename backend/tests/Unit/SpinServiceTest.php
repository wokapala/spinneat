<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Exceptions\NotFoundException;
use App\Repositories\SpinRepository;
use App\Services\SpinService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class SpinServiceTest extends TestCase
{
    private SpinService $service;
    private MockObject $repo;

    protected function setUp(): void
    {
        $this->repo    = $this->createMock(SpinRepository::class);
        $this->service = new SpinService($this->repo);
    }

    public function testSpinThrowsWhenNoDishAvailable(): void
    {
        $this->repo
            ->method('randomDish')
            ->willReturn(null);

        $this->expectException(NotFoundException::class);

        // SpinService calls Database::getInstance() for transaction —
        // this test just validates the no-dish-found guard.
        // Full integration covered by endpoints.sh.
        $this->service->spin(1, null, null);
    }
}
