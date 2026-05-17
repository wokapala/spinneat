<?php

declare(strict_types=1);

namespace App\Repositories;

final class DishRepository extends BaseRepository
{
    public function findAll(?int $categoryId = null, ?string $search = null): array
    {
        $where = ['is_active = TRUE'];
        $params = [];

        if ($categoryId !== null) {
            $where[] = 'category_id = ?';
            $params[] = $categoryId;
        }

        if ($search !== null) {
            $where[] = '(name ILIKE ? OR description ILIKE ?)';
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        return $this->fetchAll(
            "SELECT * FROM v_dish_details {$whereClause} ORDER BY spin_count DESC, name ASC",
            $params
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM v_dish_details WHERE id = ?', [$id]);
    }

    public function create(array $data): array
    {
        $row = $this->fetchOne(
            'INSERT INTO dishes (name, description, category_id, image_url, created_by)
             VALUES (?, ?, ?, ?, ?) RETURNING id',
            [$data['name'], $data['description'] ?? null, $data['category_id'], $data['image_url'] ?? null, $data['created_by'] ?? null]
        );
        return $this->findById((int) $row['id']);
    }

    public function update(int $id, array $data): ?array
    {
        $this->execute(
            'UPDATE dishes SET name = ?, description = ?, category_id = ?, image_url = ?, is_active = ?
             WHERE id = ?',
            [$data['name'], $data['description'] ?? null, $data['category_id'], $data['image_url'] ?? null, $data['is_active'] ?? true, $id]
        );
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        return $this->execute('UPDATE dishes SET is_active = FALSE WHERE id = ?', [$id]) > 0;
    }

    public function getFavorites(int $userId): array
    {
        return $this->fetchAll(
            'SELECT vd.* FROM v_dish_details vd
             JOIN favorites f ON f.dish_id = vd.id
             WHERE f.user_id = ? ORDER BY f.created_at DESC',
            [$userId]
        );
    }

    public function addFavorite(int $userId, int $dishId): void
    {
        $this->execute(
            'INSERT INTO favorites (user_id, dish_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
            [$userId, $dishId]
        );
    }

    public function removeFavorite(int $userId, int $dishId): void
    {
        $this->execute(
            'DELETE FROM favorites WHERE user_id = ? AND dish_id = ?',
            [$userId, $dishId]
        );
    }

    public function isFavorite(int $userId, int $dishId): bool
    {
        $row = $this->fetchOne(
            'SELECT 1 FROM favorites WHERE user_id = ? AND dish_id = ?',
            [$userId, $dishId]
        );
        return $row !== null;
    }
}
