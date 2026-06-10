<?php

declare(strict_types=1);

namespace App\Repositories;

class RatingRepository extends BaseRepository
{
    public function upsert(int $userId, int $dishId, int $score, ?string $comment): array
    {
        return $this->fetchOne(
            'INSERT INTO ratings (user_id, dish_id, score, comment)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (user_id, dish_id) DO UPDATE
                SET score = EXCLUDED.score, comment = EXCLUDED.comment, rated_at = NOW()
             RETURNING *',
            [$userId, $dishId, $score, $comment]
        );
    }

    public function findByDish(int $dishId): array
    {
        return $this->fetchAll(
            'SELECT r.*, u.name AS user_name FROM ratings r
             JOIN users u ON u.id = r.user_id
             WHERE r.dish_id = ? ORDER BY r.rated_at DESC',
            [$dishId]
        );
    }

    public function findByUser(int $userId): array
    {
        return $this->fetchAll(
            'SELECT r.*, d.name AS dish_name FROM ratings r
             JOIN dishes d ON d.id = r.dish_id
             WHERE r.user_id = ? ORDER BY r.rated_at DESC',
            [$userId]
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM ratings WHERE id = ?', [$id]);
    }
}
