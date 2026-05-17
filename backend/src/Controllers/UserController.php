<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\UserRepository;

final class UserController extends BaseController
{
    public function __construct(
        private readonly UserRepository $users = new UserRepository()
    ) {}

    public function index(Request $request): void
    {
        Response::success($this->users->getAll());
    }

    public function update(Request $request, string $id): void
    {
        if (!$this->users->findById((int) $id)) throw new NotFoundException('User not found');

        $role = $request->input('role');
        if (!in_array($role, ['user', 'admin'], true)) {
            Response::error('Invalid role', 422);
            return;
        }

        // Prevent self-demotion
        if ((int) $id === $this->currentUserId() && $role !== 'admin') {
            throw new ForbiddenException('Cannot change your own role');
        }

        $this->users->updateRole((int) $id, $role);
        Response::success(null, 'User updated');
    }

    public function destroy(Request $request, string $id): void
    {
        if ((int) $id === $this->currentUserId()) {
            throw new ForbiddenException('Cannot delete your own account');
        }
        if (!$this->users->findById((int) $id)) throw new NotFoundException('User not found');
        $this->users->delete((int) $id);
        Response::success(null, 'User deleted');
    }
}
