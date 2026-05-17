<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;

final class UserRepository extends BaseRepository
{
    public function findById(int $id): ?User
    {
        $row = $this->fetchOne('SELECT * FROM users WHERE id = ?', [$id]);
        return $row ? User::fromArray($row) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $row = $this->fetchOne('SELECT * FROM users WHERE email = ?', [$email]);
        return $row ? User::fromArray($row) : null;
    }

    public function create(string $email, string $passwordHash, string $name, string $role = 'user'): User
    {
        $row = $this->fetchOne(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?) RETURNING *',
            [$email, $passwordHash, $name, $role]
        );
        return User::fromArray($row);
    }

    public function updateRole(int $id, string $role): bool
    {
        return $this->execute(
            'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
            [$role, $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM users WHERE id = ?', [$id]) > 0;
    }

    /** @return array<int, array> */
    public function getAll(): array
    {
        return $this->fetchAll(
            'SELECT id, email, name, role, created_at, total_spins, total_favorites, total_ratings, last_spin_at FROM v_user_stats ORDER BY created_at DESC'
        );
    }
}
