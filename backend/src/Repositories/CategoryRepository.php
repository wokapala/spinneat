<?php

declare(strict_types=1);

namespace App\Repositories;

final class CategoryRepository extends BaseRepository
{
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM categories ORDER BY name ASC');
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM categories WHERE id = $1', [$id]);
    }

    public function create(array $data): array
    {
        return $this->fetchOne(
            'INSERT INTO categories (name, description, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [$data['name'], $data['description'] ?? null, $data['icon'] ?? null, $data['color'] ?? '#FF6B6B']
        );
    }

    public function update(int $id, array $data): ?array
    {
        $this->execute(
            'UPDATE categories SET name = $1, description = $2, icon = $3, color = $4 WHERE id = $5',
            [$data['name'], $data['description'] ?? null, $data['icon'] ?? null, $data['color'] ?? '#FF6B6B', $id]
        );
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM categories WHERE id = $1', [$id]) > 0;
    }
}
