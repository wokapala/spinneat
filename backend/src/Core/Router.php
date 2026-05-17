<?php

declare(strict_types=1);

namespace App\Core;

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

        // Handle OPTIONS preflight
        if ($method === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            http_response_code(204);
            return;
        }

        foreach ($this->routes[$method] ?? [] as $routePath => [$handler, $middleware]) {
            $params = $this->matchRoute($routePath, $path);
            if ($params !== null) {
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
