<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\NotFoundException;
use App\Repositories\CategoryRepository;

final class CategoryController extends BaseController
{
    public function __construct(
        private readonly CategoryRepository $categories = new CategoryRepository()
    ) {}

    public function index(Request $request): void
    {
        Response::success($this->categories->findAll());
    }

    public function store(Request $request): void
    {
        $data = $this->validate($request->getBody(), ['name' => 'required|min:2']);
        $cat  = $this->categories->create($data);
        Response::success($cat, 'Category created', 201);
    }

    public function update(Request $request, string $id): void
    {
        if (!$this->categories->findById((int) $id)) throw new NotFoundException('Category not found');
        $data = $this->validate($request->getBody(), ['name' => 'required|min:2']);
        Response::success($this->categories->update((int) $id, $data));
    }

    public function destroy(Request $request, string $id): void
    {
        if (!$this->categories->findById((int) $id)) throw new NotFoundException('Category not found');
        $this->categories->delete((int) $id);
        Response::success(null, 'Category deleted');
    }
}
