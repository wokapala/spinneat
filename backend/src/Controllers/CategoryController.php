<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ConflictException;
use App\Exceptions\NotFoundException;
use App\Repositories\CategoryRepository;
use PDOException;

final class CategoryController extends BaseController
{
    public function __construct(
        private readonly CategoryRepository $categories = new CategoryRepository()
    ) {}

    public function index(Request $request): void
    {
        Response::success($this->categories->findAll());
    }

    private const RULES = [
        'name'        => 'required|min:2|max:100',
        'description' => 'max:500',
        'icon'        => 'max:10',
        'color'       => 'max:7',
    ];

    public function store(Request $request): void
    {
        $data = $this->validate($request->getBody(), self::RULES);
        $cat  = $this->categories->create($data);
        Response::success($cat, 'Category created', 201);
    }

    public function update(Request $request, string $id): void
    {
        if (!$this->categories->findById((int) $id)) throw new NotFoundException('Category not found');
        $data = $this->validate($request->getBody(), self::RULES);
        Response::success($this->categories->update((int) $id, $data));
    }

    public function destroy(Request $request, string $id): void
    {
        if (!$this->categories->findById((int) $id)) throw new NotFoundException('Category not found');

        try {
            $this->categories->delete((int) $id);
        } catch (PDOException $e) {
            // 23503 = foreign_key_violation: dishes.category_id is ON DELETE
            // RESTRICT, so a category still in use must not disappear.
            if (($e->errorInfo[0] ?? '') === '23503') {
                throw new ConflictException('Cannot delete a category that still has dishes');
            }
            throw $e;
        }

        Response::success(null, 'Category deleted');
    }
}
