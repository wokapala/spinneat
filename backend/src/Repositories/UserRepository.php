<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;

final class UserRepository extends BaseRepository
{
    public function findById(int $id): ?User
    {
        $row = $this->fetchOne('SELECT * FROM users WHERE id = $1', [$id]);
        return $row ? User::fromArray($row) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $row = $this->fetchOne('SELECT * FROM users WHERE email = $1', [$email]);
        return $row ? User::fromArray($row) : null;
    }

    public function create(string $email, string $passwordHash, string $name, string $role = 'user'): User
    {
        $row = $this->fetchOne(
            'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [$email, $passwordHash, $name, $role]
        );
        return User::fromArray($row);
    }

    public function updateRole(int $id, string $role): bool
    {
        return $this->execute(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
            [$role, $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM users WHERE id = $1', [$id]) > 0;
    }

    /** @return array<int, array> */
    public function getAll(): array
    {
        return $this->fetchAll(
            'SELECT id, email, name, role, avatar_url, created_at FROM v_user_stats ORDER BY created_at DESC'
        );
    }
}
