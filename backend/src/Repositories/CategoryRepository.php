<?php

declare(strict_types=1);

namespace App\Repositories;

class CategoryRepository extends BaseRepository
{
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM categories ORDER BY name ASC');
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM categories WHERE id = ?', [$id]);
    }

    public function create(array $data): array
    {
        return $this->fetchOne(
            'INSERT INTO categories (name, description, icon, color) VALUES (?, ?, ?, ?) RETURNING *',
            [$data['name'], $data['description'] ?? null, $data['icon'] ?? null, $data['color'] ?? '#FF6B6B']
        );
    }

    public function update(int $id, array $data): ?array
    {
        $this->execute(
            'UPDATE categories SET name = ?, description = ?, icon = ?, color = ? WHERE id = ?',
            [$data['name'], $data['description'] ?? null, $data['icon'] ?? null, $data['color'] ?? '#FF6B6B', $id]
        );
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM categories WHERE id = ?', [$id]) > 0;
    }
}
