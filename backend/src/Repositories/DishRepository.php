<?php

declare(strict_types=1);

namespace App\Repositories;

final class DishRepository extends BaseRepository
{
    public function findAll(?int $categoryId = null, ?string $search = null): array
    {
        $where = ['d.is_active = TRUE'];
        $params = [];
        $idx = 1;

        if ($categoryId !== null) {
            $where[] = "d.category_id = \${$idx}";
            $params[] = $categoryId;
            $idx++;
        }

        if ($search !== null) {
            $where[] = "(d.name ILIKE \${$idx} OR d.description ILIKE \${$idx})";
            $params[] = "%{$search}%";
            $idx++;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        return $this->fetchAll(
            "SELECT * FROM v_dish_details {$whereClause} ORDER BY spin_count DESC, d.name ASC",
            $params
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM v_dish_details WHERE id = $1', [$id]);
    }

    public function create(array $data): array
    {
        $row = $this->fetchOne(
            'INSERT INTO dishes (name, description, category_id, image_url, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [$data['name'], $data['description'] ?? null, $data['category_id'], $data['image_url'] ?? null, $data['created_by'] ?? null]
        );
        return $this->findById((int) $row['id']);
    }

    public function update(int $id, array $data): ?array
    {
        $this->execute(
            'UPDATE dishes SET name = $1, description = $2, category_id = $3, image_url = $4, is_active = $5
             WHERE id = $6',
            [$data['name'], $data['description'] ?? null, $data['category_id'], $data['image_url'] ?? null, $data['is_active'] ?? true, $id]
        );
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        return $this->execute('UPDATE dishes SET is_active = FALSE WHERE id = $1', [$id]) > 0;
    }

    public function getFavorites(int $userId): array
    {
        return $this->fetchAll(
            'SELECT vd.* FROM v_dish_details vd
             JOIN favorites f ON f.dish_id = vd.id
             WHERE f.user_id = $1 ORDER BY f.created_at DESC',
            [$userId]
        );
    }

    public function addFavorite(int $userId, int $dishId): void
    {
        $this->execute(
            'INSERT INTO favorites (user_id, dish_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [$userId, $dishId]
        );
    }

    public function removeFavorite(int $userId, int $dishId): void
    {
        $this->execute(
            'DELETE FROM favorites WHERE user_id = $1 AND dish_id = $2',
            [$userId, $dishId]
        );
    }

    public function isFavorite(int $userId, int $dishId): bool
    {
        $row = $this->fetchOne(
            'SELECT 1 FROM favorites WHERE user_id = $1 AND dish_id = $2',
            [$userId, $dishId]
        );
        return $row !== null;
    }
}
