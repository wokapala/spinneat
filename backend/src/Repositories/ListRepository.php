<?php

declare(strict_types=1);

namespace App\Repositories;

final class ListRepository extends BaseRepository
{
    public function findByUser(int $userId): array
    {
        return $this->fetchAll(
            'SELECT ul.*, COUNT(li.dish_id) AS dish_count
             FROM user_lists ul
             LEFT JOIN list_items li ON li.list_id = ul.id
             WHERE ul.user_id = ?
             GROUP BY ul.id
             ORDER BY ul.created_at DESC',
            [$userId]
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM user_lists WHERE id = ?', [$id]);
    }

    public function findWithDishes(int $id): ?array
    {
        $list = $this->findById($id);
        if (!$list) return null;

        $list['dishes'] = $this->fetchAll(
            'SELECT vd.* FROM v_dish_details vd
             JOIN list_items li ON li.dish_id = vd.id
             WHERE li.list_id = ? ORDER BY li.added_at DESC',
            [$id]
        );
        return $list;
    }

    public function create(int $userId, array $data): array
    {
        return $this->fetchOne(
            'INSERT INTO user_lists (user_id, name, description, is_public)
             VALUES (?, ?, ?, ?) RETURNING *',
            [$userId, $data['name'], $data['description'] ?? null, (int) ($data['is_public'] ?? false)]
        );
    }

    public function update(int $id, array $data): ?array
    {
        $this->execute(
            'UPDATE user_lists SET name = ?, description = ?, is_public = ? WHERE id = ?',
            [$data['name'], $data['description'] ?? null, (int) ($data['is_public'] ?? false), $id]
        );
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM user_lists WHERE id = ?', [$id]) > 0;
    }

    public function addDish(int $listId, int $dishId): void
    {
        $this->execute(
            'INSERT INTO list_items (list_id, dish_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
            [$listId, $dishId]
        );
    }

    public function removeDish(int $listId, int $dishId): void
    {
        $this->execute(
            'DELETE FROM list_items WHERE list_id = ? AND dish_id = ?',
            [$listId, $dishId]
        );
    }

    public function belongsToUser(int $listId, int $userId): bool
    {
        $row = $this->fetchOne(
            'SELECT 1 FROM user_lists WHERE id = ? AND user_id = ?',
            [$listId, $userId]
        );
        return $row !== null;
    }
}
