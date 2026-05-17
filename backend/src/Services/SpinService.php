<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Repositories\SpinRepository;

final class SpinService
{
    public function __construct(
        private readonly SpinRepository $spins = new SpinRepository()
    ) {}

    public function spin(int $userId, ?int $listId, ?int $categoryId): array
    {
        $db = Database::getInstance();
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
}
