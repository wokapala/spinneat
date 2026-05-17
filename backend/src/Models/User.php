<?php

declare(strict_types=1);

namespace App\Models;

final class User
{
    public function __construct(
        public readonly int    $id,
        public readonly string $email,
        public readonly string $password,
        public readonly string $name,
        public readonly string $role,
        public readonly ?string $avatarUrl,
        public readonly string $createdAt,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id:        (int) $data['id'],
            email:     $data['email'],
            password:  $data['password'],
            name:      $data['name'],
            role:      $data['role'],
            avatarUrl: $data['avatar_url'] ?? null,
            createdAt: $data['created_at'],
        );
    }

    public function toPublicArray(): array
    {
        return [
            'id'         => $this->id,
            'email'      => $this->email,
            'name'       => $this->name,
            'role'       => $this->role,
            'avatar_url' => $this->avatarUrl,
            'created_at' => $this->createdAt,
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
