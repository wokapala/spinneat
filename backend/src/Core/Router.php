<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Middleware\CsrfMiddleware;
use App\Exceptions\NotFoundException;

final class Router
{
    /** @var array<string, array<string, array{callable, string[]}>> */
    private array $routes = [];

    public function get(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    public function post(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    public function put(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    private function addRoute(string $method, string $path, callable $handler, array $middleware): void
    {
        $this->routes[$method][$path] = [$handler, $middleware];
    }

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        $path   = $request->getPath();

        // SPA and API share one origin, so no CORS headers are needed —
        // just acknowledge OPTIONS with the supported methods.
        if ($method === 'OPTIONS') {
            header('Allow: GET, POST, PUT, DELETE, OPTIONS');
            http_response_code(204);
            return;
        }

        foreach ($this->routes[$method] ?? [] as $routePath => [$handler, $middleware]) {
            $params = $this->matchRoute($routePath, $path);
            if ($params !== null) {
                // CSRF check runs first for state-changing requests so we
                // reject forged calls before any auth check inspects state.
                (new CsrfMiddleware())->handle($request);

                foreach ($middleware as $mw) {
                    $mwInstance = new $mw();
                    $mwInstance->handle($request);
                }
                $handler($request, ...$params);
                return;
            }
        }

        throw new NotFoundException("Route not found: {$method} {$path}");
    }

    private function matchRoute(string $routePath, string $requestPath): ?array
    {
        $pattern = preg_replace('/\{(\w+)\}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $requestPath, $matches)) {
            array_shift($matches);
            return $matches;
        }
        return null;
    }
}
