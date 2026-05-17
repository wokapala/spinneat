<?php

declare(strict_types=1);

namespace App\Repositories;

final class SpinRepository extends BaseRepository
{
    public function randomDish(?int $listId = null, ?int $categoryId = null): ?array
    {
        if ($listId !== null) {
            return $this->fetchOne(
                'SELECT * FROM get_random_dish($1)',
                [$listId]
            );
        }

        if ($categoryId !== null) {
            return $this->fetchOne(
                'SELECT d.id AS dish_id, d.name AS dish_name, c.name AS category,
                        c.icon AS category_icon, c.color AS category_color
                 FROM dishes d JOIN categories c ON c.id = d.category_id
                 WHERE d.is_active = TRUE AND d.category_id = $1
                 ORDER BY RANDOM() LIMIT 1',
                [$categoryId]
            );
        }

        return $this->fetchOne('SELECT * FROM get_random_dish()');
    }

    public function recordSpin(int $userId, int $dishId, ?int $listId): array
    {
        return $this->fetchOne(
            'INSERT INTO spin_history (user_id, dish_id, list_id) VALUES ($1, $2, $3) RETURNING *',
            [$userId, $dishId, $listId]
        );
    }

    public function getHistory(int $userId, int $limit = 20, int $offset = 0): array
    {
        return $this->fetchAll(
            'SELECT sh.id, sh.spun_at, sh.list_id,
                    d.id AS dish_id, d.name AS dish_name, d.image_url,
                    c.name AS category_name, c.icon AS category_icon, c.color AS category_color
             FROM spin_history sh
             JOIN dishes d    ON d.id = sh.dish_id
             JOIN categories c ON c.id = d.category_id
             WHERE sh.user_id = $1
             ORDER BY sh.spun_at DESC
             LIMIT $2 OFFSET $3',
            [$userId, $limit, $offset]
        );
    }

    public function countHistory(int $userId): int
    {
        $row = $this->fetchOne('SELECT COUNT(*) AS cnt FROM spin_history WHERE user_id = $1', [$userId]);
        return (int) ($row['cnt'] ?? 0);
    }
}
