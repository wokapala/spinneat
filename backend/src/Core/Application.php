<?php

declare(strict_types=1);

namespace App\Core;

use App\Controllers\AuthController;
use App\Controllers\DishController;
use App\Controllers\CategoryController;
use App\Controllers\SpinController;
use App\Controllers\UserController;
use App\Controllers\ListController;
use App\Controllers\RatingController;
use App\Core\Middleware\AuthMiddleware;
use App\Core\Middleware\AdminMiddleware;
use App\Core\Middleware\CsrfMiddleware;
use App\Exceptions\AppException;
use App\Exceptions\ValidationException;
use Throwable;

final class Application
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    private function registerRoutes(): void
    {
        $auth  = AuthController::class;
        $dish  = DishController::class;
        $cat   = CategoryController::class;
        $spin  = SpinController::class;
        $user  = UserController::class;
        $list  = ListController::class;
        $rate  = RatingController::class;

        // Auth
        $this->router->get('/api/auth/csrf',      [new $auth(), 'csrf']);
        $this->router->post('/api/auth/register', [new $auth(), 'register']);
        $this->router->post('/api/auth/login',    [new $auth(), 'login']);
        $this->router->post('/api/auth/logout',   [new $auth(), 'logout'], [AuthMiddleware::class]);
        $this->router->get('/api/auth/me',        [new $auth(), 'me'],     [AuthMiddleware::class]);

        // Categories (public read, admin write)
        $this->router->get('/api/categories',          [new $cat(), 'index']);
        $this->router->post('/api/categories',         [new $cat(), 'store'],   [AuthMiddleware::class, AdminMiddleware::class]);
        $this->router->put('/api/categories/{id}',     [new $cat(), 'update'],  [AuthMiddleware::class, AdminMiddleware::class]);
        $this->router->delete('/api/categories/{id}',  [new $cat(), 'destroy'], [AuthMiddleware::class, AdminMiddleware::class]);

        // Dishes (public read, auth write — controller enforces owner-or-admin on mutate)
        $this->router->get('/api/dishes',          [new $dish(), 'index']);
        $this->router->get('/api/dishes/{id}',     [new $dish(), 'show']);
        $this->router->post('/api/dishes',         [new $dish(), 'store'],   [AuthMiddleware::class]);
        $this->router->put('/api/dishes/{id}',     [new $dish(), 'update'],  [AuthMiddleware::class]);
        $this->router->delete('/api/dishes/{id}',  [new $dish(), 'destroy'], [AuthMiddleware::class]);

        // Spin
        $this->router->post('/api/spin',           [new $spin(), 'spin'],   [AuthMiddleware::class]);
        $this->router->get('/api/spin/history',    [new $spin(), 'history'],[AuthMiddleware::class]);

        // User lists
        $this->router->get('/api/lists',              [new $list(), 'index'],      [AuthMiddleware::class]);
        $this->router->post('/api/lists',             [new $list(), 'store'],      [AuthMiddleware::class]);
        $this->router->get('/api/lists/{id}',         [new $list(), 'show'],       [AuthMiddleware::class]);
        $this->router->put('/api/lists/{id}',         [new $list(), 'update'],     [AuthMiddleware::class]);
        $this->router->delete('/api/lists/{id}',      [new $list(), 'destroy'],    [AuthMiddleware::class]);
        $this->router->post('/api/lists/{id}/dishes', [new $list(), 'addDish'],    [AuthMiddleware::class]);
        $this->router->delete('/api/lists/{id}/dishes/{dishId}', [new $list(), 'removeDish'], [AuthMiddleware::class]);

        // Favorites
        $this->router->get('/api/favorites',           [new $dish(), 'favorites'],    [AuthMiddleware::class]);
        $this->router->post('/api/favorites/{id}',     [new $dish(), 'addFavorite'],  [AuthMiddleware::class]);
        $this->router->delete('/api/favorites/{id}',   [new $dish(), 'removeFavorite'],[AuthMiddleware::class]);

        // Ratings
        $this->router->post('/api/ratings',        [new $rate(), 'store'],  [AuthMiddleware::class]);
        $this->router->put('/api/ratings/{id}',    [new $rate(), 'update'], [AuthMiddleware::class]);

        // Admin – users
        $this->router->get('/api/admin/users',         [new $user(), 'index'],   [AuthMiddleware::class, AdminMiddleware::class]);
        $this->router->put('/api/admin/users/{id}',    [new $user(), 'update'],  [AuthMiddleware::class, AdminMiddleware::class]);
        $this->router->delete('/api/admin/users/{id}', [new $user(), 'destroy'], [AuthMiddleware::class, AdminMiddleware::class]);
    }

    public function run(): void
    {
        // The SPA is served from the same origin as the API, so no CORS
        // headers are needed. A wildcard Access-Control-Allow-Origin would
        // also be invalid here because requests carry session cookies.
        header('Content-Type: application/json; charset=utf-8');

        try {
            $request = new Request();
            $this->router->dispatch($request);
        } catch (ValidationException $e) {
            // Preserve the per-field error map so the client can show
            // inline validation messages instead of a single toast.
            Response::error($e->getMessage(), $e->getCode(), $e->getErrors());
        } catch (AppException $e) {
            Response::error($e->getMessage(), $e->getCode());
        } catch (Throwable $e) {
            // Never leak internal error details outside development.
            error_log('[unhandled] ' . $e->getMessage());
            $message = (getenv('APP_ENV') === 'development')
                ? $e->getMessage()
                : 'Internal Server Error';
            Response::error($message, 500);
        }
    }
}
