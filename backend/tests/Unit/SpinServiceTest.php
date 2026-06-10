<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Database;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\ListRepository;
use App\Repositories\SpinRepository;
use App\Services\SpinService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class SpinServiceTest extends TestCase
{
    private SpinService $service;
    private MockObject $spins;
    private MockObject $lists;
    private MockObject $db;

    protected function setUp(): void
    {
        $this->spins   = $this->createMock(SpinRepository::class);
        $this->lists   = $this->createMock(ListRepository::class);
        $this->db      = $this->createMock(Database::class);
        $this->service = new SpinService($this->spins, $this->lists, $this->db);
    }

    public function testSpinThrowsWhenNoDishAvailable(): void
    {
        $this->spins->method('randomDish')->willReturn(null);

        $this->db->expects(self::once())->method('beginTransaction');
        $this->db->expects(self::once())->method('rollback');
        $this->db->expects(self::never())->method('commit');

        $this->expectException(NotFoundException::class);

        $this->service->spin(1, null, null);
    }

    public function testSpinCommitsAndReturnsDishWithHistory(): void
    {
        $dish    = ['dish_id' => 7, 'dish_name' => 'Bigos'];
        $history = ['id' => 99, 'user_id' => 1, 'dish_id' => 7];

        $this->spins->method('randomDish')->willReturn($dish);
        $this->spins->method('recordSpin')->with(1, 7, null)->willReturn($history);

        $this->db->expects(self::once())->method('beginTransaction');
        $this->db->expects(self::once())->method('commit');
        $this->db->expects(self::never())->method('rollback');

        $result = $this->service->spin(1, null, null);

        self::assertSame($dish, $result['dish']);
        self::assertSame($history, $result['history']);
    }

    public function testSpinThrowsWhenListDoesNotExist(): void
    {
        $this->lists->method('findById')->willReturn(null);

        $this->expectException(NotFoundException::class);

        $this->service->spin(1, 123, null);
    }

    public function testSpinForbidsAnotherUsersPrivateList(): void
    {
        $this->lists->method('findById')->willReturn([
            'id' => 5, 'user_id' => 2, 'is_public' => false,
        ]);

        $this->expectException(ForbiddenException::class);

        $this->service->spin(1, 5, null);
    }

    public function testSpinAllowsAnotherUsersPublicList(): void
    {
        $this->lists->method('findById')->willReturn([
            'id' => 5, 'user_id' => 2, 'is_public' => true,
        ]);

        $dish = ['dish_id' => 3, 'dish_name' => 'Pad Thai'];
        $this->spins->method('randomDish')->willReturn($dish);
        $this->spins->method('recordSpin')->willReturn(['id' => 1]);

        $result = $this->service->spin(1, 5, null);

        self::assertSame($dish, $result['dish']);
    }
}
