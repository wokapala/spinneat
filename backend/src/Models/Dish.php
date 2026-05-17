<?php

declare(strict_types=1);

namespace App\Models;

final class Dish
{
    public function __construct(
        public readonly int     $id,
        public readonly string  $name,
        public readonly ?string $description,
        public readonly int     $categoryId,
        public readonly ?string $imageUrl,
        public readonly ?int    $createdBy,
        public readonly bool    $isActive,
        public readonly string  $createdAt,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id:          (int) $data['id'],
            name:        $data['name'],
            description: $data['description'] ?? null,
            categoryId:  (int) $data['category_id'],
            imageUrl:    $data['image_url'] ?? null,
            createdBy:   isset($data['created_by']) ? (int) $data['created_by'] : null,
            isActive:    (bool) $data['is_active'],
            createdAt:   $data['created_at'],
        );
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'category_id' => $this->categoryId,
            'image_url'   => $this->imageUrl,
            'created_by'  => $this->createdBy,
            'is_active'   => $this->isActive,
            'created_at'  => $this->createdAt,
        ];
    }
}
