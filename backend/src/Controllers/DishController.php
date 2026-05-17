<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\DishRepository;

final class DishController extends BaseController
{
    public function __construct(
        private readonly DishRepository $dishes = new DishRepository()
    ) {}

    public function index(Request $request): void
    {
        $categoryId = $request->query('category_id') ? (int) $request->query('category_id') : null;
        $search     = $request->query('search');

        $items = $this->dishes->findAll($categoryId, $search ?: null);
        Response::success($items);
    }

    public function show(Request $request, string $id): void
    {
        $dish = $this->dishes->findById((int) $id);
        if (!$dish) throw new NotFoundException('Dish not found');
        Response::success($dish);
    }

    public function store(Request $request): void
    {
        $data = $this->validate($request->getBody(), [
            'name'        => 'required|min:2',
            'category_id' => 'required|int',
        ]);
        $data['created_by'] = $this->currentUserId();

        $dish = $this->dishes->create($data);
        Response::success($dish, 'Dish created', 201);
    }

    public function update(Request $request, string $id): void
    {
        $dish = $this->dishes->findById((int) $id);
        if (!$dish) throw new NotFoundException('Dish not found');

        $data = $this->validate($request->getBody(), [
            'name'        => 'required|min:2',
            'category_id' => 'required|int',
        ]);

        $updated = $this->dishes->update((int) $id, $data);
        Response::success($updated);
    }

    public function destroy(Request $request, string $id): void
    {
        $dish = $this->dishes->findById((int) $id);
        if (!$dish) throw new NotFoundException('Dish not found');

        $this->dishes->delete((int) $id);
        Response::success(null, 'Dish removed');
    }

    public function favorites(Request $request): void
    {
        $items = $this->dishes->getFavorites($this->currentUserId());
        Response::success($items);
    }

    public function addFavorite(Request $request, string $id): void
    {
        $dish = $this->dishes->findById((int) $id);
        if (!$dish) throw new NotFoundException('Dish not found');

        $this->dishes->addFavorite($this->currentUserId(), (int) $id);
        Response::success(null, 'Added to favorites');
    }

    public function removeFavorite(Request $request, string $id): void
    {
        $this->dishes->removeFavorite($this->currentUserId(), (int) $id);
        Response::success(null, 'Removed from favorites');
    }
}
