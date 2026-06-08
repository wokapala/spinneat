<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\ListRepository;

final class ListController extends BaseController
{
    public function __construct(
        private readonly ListRepository $lists = new ListRepository()
    ) {}

    public function index(Request $request): void
    {
        Response::success($this->lists->findByUser($this->currentUserId()));
    }

    public function show(Request $request, string $id): void
    {
        $this->assertOwner((int) $id);
        $list = $this->lists->findWithDishes((int) $id);
        if (!$list) throw new NotFoundException('List not found');
        Response::success($list);
    }

    public function store(Request $request): void
    {
        $data = $this->validate($request->getBody(), ['name' => 'required|min:2|max:200']);
        $list = $this->lists->create($this->currentUserId(), $data);
        Response::success($list, 'List created', 201);
    }

    public function update(Request $request, string $id): void
    {
        $this->assertOwner((int) $id);
        $data = $this->validate($request->getBody(), ['name' => 'required|min:2|max:200']);
        Response::success($this->lists->update((int) $id, $data));
    }

    public function destroy(Request $request, string $id): void
    {
        $this->assertOwner((int) $id);
        $this->lists->delete((int) $id);
        Response::success(null, 'List deleted');
    }

    public function addDish(Request $request, string $id): void
    {
        $this->assertOwner((int) $id);
        $data = $this->validate($request->getBody(), ['dish_id' => 'required|int']);
        $this->lists->addDish((int) $id, (int) $data['dish_id']);
        Response::success(null, 'Dish added to list');
    }

    public function removeDish(Request $request, string $id, string $dishId): void
    {
        $this->assertOwner((int) $id);
        $this->lists->removeDish((int) $id, (int) $dishId);
        Response::success(null, 'Dish removed from list');
    }

    private function assertOwner(int $listId): void
    {
        $list = $this->lists->findById($listId);
        if (!$list) throw new NotFoundException('List not found');
        if ((int) $list['user_id'] !== $this->currentUserId() && $this->currentUserRole() !== 'admin') {
            throw new ForbiddenException('You do not own this list');
        }
    }
}
