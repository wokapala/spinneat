<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Exceptions\ForbiddenException;
use App\Exceptions\NotFoundException;
use App\Repositories\DishRepository;
use App\Repositories\RatingRepository;

final class RatingController extends BaseController
{
    public function __construct(
        private readonly RatingRepository $ratings = new RatingRepository(),
        private readonly DishRepository $dishes = new DishRepository(),
    ) {}

    public function store(Request $request): void
    {
        $data = $this->validate($request->getBody(), [
            'dish_id' => 'required|int',
            'score'   => 'required|int',
            'comment' => 'max:1000',
        ]);

        $score = (int) $data['score'];
        if ($score < 1 || $score > 5) {
            Response::error('Score must be between 1 and 5', 422);
            return;
        }

        if (!$this->dishes->findById((int) $data['dish_id'])) {
            throw new NotFoundException('Dish not found');
        }

        $rating = $this->ratings->upsert(
            $this->currentUserId(),
            (int) $data['dish_id'],
            $score,
            $data['comment'] ?? null
        );

        Response::success($rating, 'Rating saved', 201);
    }

    public function update(Request $request, string $id): void
    {
        $existing = $this->ratings->findById((int) $id);
        if (!$existing) throw new NotFoundException('Rating not found');
        if ((int) $existing['user_id'] !== $this->currentUserId()) throw new ForbiddenException();

        $data  = $this->validate($request->getBody(), [
            'score'   => 'required|int',
            'comment' => 'max:1000',
        ]);
        $score = (int) $data['score'];
        if ($score < 1 || $score > 5) {
            Response::error('Score must be between 1 and 5', 422);
            return;
        }

        $rating = $this->ratings->upsert(
            $this->currentUserId(),
            (int) $existing['dish_id'],
            $score,
            $data['comment'] ?? null
        );

        Response::success($rating);
    }
}
