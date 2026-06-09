<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\ListRepository;
use App\Repositories\SpinRepository;

final class SpinService
{
    public function __construct(
        private readonly SpinRepository $spins = new SpinRepository(),
        private readonly ListRepository $lists = new ListRepository(),
        private ?Database $db = null,
    ) {}

    public function spin(int $userId, ?int $listId, ?int $categoryId): array
    {
        if ($listId !== null) {
            $this->assertListAccessible($listId, $userId);
        }

        $db = $this->db ??= Database::getInstance();
        $db->beginTransaction();

        try {
            $dish = $this->spins->randomDish($listId, $categoryId);

            if (!$dish) {
                throw new NotFoundException('No dishes available to spin');
            }

            $history = $this->spins->recordSpin($userId, (int) $dish['dish_id'], $listId);

            $db->commit();

            return [
                'dish'    => $dish,
                'history' => $history,
            ];
        } catch (\Throwable $e) {
            $db->rollback();
            throw $e;
        }
    }

    public function getHistory(int $userId, int $page = 1): array
    {
        $limit  = 20;
        $offset = ($page - 1) * $limit;

        return [
            'items' => $this->spins->getHistory($userId, $limit, $offset),
            'total' => $this->spins->countHistory($userId),
            'page'  => $page,
            'limit' => $limit,
        ];
    }

    /**
     * A user may spin only from their own lists or lists shared as public —
     * otherwise the list_id parameter would leak other users' private data.
     */
    private function assertListAccessible(int $listId, int $userId): void
    {
        $list = $this->lists->findById($listId);

        if (!$list) {
            throw new NotFoundException('List not found');
        }

        if ((int) $list['user_id'] !== $userId && !$list['is_public']) {
            throw new ForbiddenException('You do not have access to this list');
        }
    }
}
