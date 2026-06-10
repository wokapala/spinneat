<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\ListRepository;
use App\Services\SpinService;

final class SpinController extends BaseController
{
    public function __construct(
        private readonly SpinService    $spinService = new SpinService(),
        private readonly ListRepository $lists       = new ListRepository()
    ) {}

    public function spin(Request $request): void
    {
        $listId     = $request->input('list_id') ? (int) $request->input('list_id') : null;
        $categoryId = $request->input('category_id') ? (int) $request->input('category_id') : null;

        if ($listId !== null) {
            $list = $this->lists->findById($listId);
            if (!$list) {
                throw new NotFoundException('List not found');
            }
            $ownedByUser = (int) $list['user_id'] === $this->currentUserId();
            $isPublic    = (bool) $list['is_public'];
            if (!$ownedByUser && !$isPublic) {
                throw new ForbiddenException('Access denied to this list');
            }
        }

        $result = $this->spinService->spin($this->currentUserId(), $listId, $categoryId);
        Response::success($result);
    }

    public function history(Request $request): void
    {
        $page   = max(1, (int) ($request->query('page') ?? 1));
        $result = $this->spinService->getHistory($this->currentUserId(), $page);
        Response::success($result);
    }
}
