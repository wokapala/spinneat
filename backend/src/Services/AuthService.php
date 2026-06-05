<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\UnauthorizedException;
use App\Exceptions\ValidationException;
use App\Models\User;
use App\Repositories\UserRepository;

final class AuthService
{
    public function __construct(
        private readonly UserRepository $users = new UserRepository()
    ) {}

    private const MAX_EMAIL_LEN    = 255;
    private const MAX_NAME_LEN     = 100;
    private const MAX_PASSWORD_LEN = 200;
    private const MIN_PASSWORD_LEN = 8;

    private const LOGIN_FAILURE_WINDOW   = 900;   // 15 min
    private const LOGIN_FAILURE_THRESHOLD = 5;

    public function register(array $data): User
    {
        $errors = [];

        $email = is_string($data['email'] ?? null) ? trim($data['email']) : '';
        $name  = is_string($data['name']  ?? null) ? trim($data['name'])  : '';
        $pwd   = is_string($data['password'] ?? null) ? $data['password'] : '';

        if (!$email || strlen($email) > self::MAX_EMAIL_LEN || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required';
        }

        if (!$pwd || strlen($pwd) < self::MIN_PASSWORD_LEN || strlen($pwd) > self::MAX_PASSWORD_LEN) {
            $errors['password'] = 'Password must be 8–200 characters';
        } elseif (!preg_match('/[A-Za-z]/', $pwd) || !preg_match('/\d/', $pwd)) {
            $errors['password'] = 'Password must contain at least one letter and one digit';
        }

        if (!$name || strlen($name) < 2 || strlen($name) > self::MAX_NAME_LEN) {
            $errors['name'] = 'Name must be 2–100 characters';
        }

        if ($errors) {
            throw new ValidationException($errors);
        }

        if ($this->users->findByEmail($email)) {
            // Generic message — same wording would be used in a "reset"
            // flow so attackers can't enumerate registered addresses.
            throw new ValidationException(['email' => 'This email cannot be used for registration']);
        }

        return $this->users->create(
            $email,
            password_hash($pwd, PASSWORD_BCRYPT, ['cost' => 12]),
            $name
        );
    }

    public function login(string $email, string $password): User
    {
        $email = trim($email);

        if (strlen($email) > self::MAX_EMAIL_LEN || strlen($password) > self::MAX_PASSWORD_LEN) {
            throw new ValidationException(['email' => 'Invalid input length']);
        }

        $this->enforceLoginThrottle($email);

        $user = $this->users->findByEmail($email);

        if (!$user || !password_verify($password, $user->password)) {
            $this->recordLoginFailure($email);
            error_log(sprintf(
                '[auth] failed login for %s from %s',
                $email,
                $_SERVER['REMOTE_ADDR'] ?? '?'
            ));
            throw new UnauthorizedException('Invalid email or password');
        }

        // Reset throttle once the user proves they know the password
        unset($_SESSION['login_failures']);

        // Defeat session fixation: issue a fresh ID once authenticated
        session_regenerate_id(true);

        $_SESSION['user_id']   = $user->id;
        $_SESSION['user_role'] = $user->role;
        $_SESSION['logged_at'] = time();

        return $user;
    }

    public function logout(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'domain'   => $params['domain'],
                'secure'   => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }

        session_destroy();
    }

    public function currentUser(): ?User
    {
        if (empty($_SESSION['user_id'])) {
            return null;
        }
        return $this->users->findById((int) $_SESSION['user_id']);
    }

    /**
     * Block obvious brute-force attempts. Counter is keyed by the email
     * being attempted so a flood against one account can't lock out
     * everyone else sharing the session pool.
     */
    private function enforceLoginThrottle(string $email): void
    {
        $bucket = $_SESSION['login_failures'][$email] ?? null;
        if (!$bucket) {
            return;
        }

        // Reset stale buckets so a successful login long after the
        // initial failure doesn't get rejected.
        if (time() - $bucket['first_at'] > self::LOGIN_FAILURE_WINDOW) {
            unset($_SESSION['login_failures'][$email]);
            return;
        }

        if ($bucket['count'] >= self::LOGIN_FAILURE_THRESHOLD) {
            $retryIn = self::LOGIN_FAILURE_WINDOW - (time() - $bucket['first_at']);
            throw new UnauthorizedException(sprintf(
                'Too many failed attempts. Try again in %d seconds.',
                max(1, $retryIn)
            ));
        }
    }

    private function recordLoginFailure(string $email): void
    {
        $bucket = $_SESSION['login_failures'][$email] ?? ['count' => 0, 'first_at' => time()];
        $bucket['count']++;
        $_SESSION['login_failures'][$email] = $bucket;
    }
}
