#!/usr/bin/env bash
# Integration tests – run after docker-compose up

set -euo pipefail

BASE="http://localhost:80/api"
PASS=0
FAIL=0

check() {
    local label=$1 expected=$2 actual=$3
    if [ "$actual" -eq "$expected" ]; then
        echo "  ✓ $label"
        ((PASS++))
    else
        echo "  ✗ $label (expected $expected, got $actual)"
        ((FAIL++))
    fi
}

echo "=== Spin & Eat Integration Tests ==="
echo ""

# 1. Register new user
echo "--- Auth ---"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"it_test@example.com","password":"TestPass123","name":"IT Tester"}')
check "POST /auth/register (201)" 201 "$STATUS"

# 2. Register duplicate → 422
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"it_test@example.com","password":"TestPass123","name":"IT Tester"}')
check "POST /auth/register duplicate (422)" 422 "$STATUS"

# 3. Login
COOKIE_JAR=$(mktemp)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
    -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d '{"email":"it_test@example.com","password":"TestPass123"}')
check "POST /auth/login (200)" 200 "$STATUS"

# 4. Get /me
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/auth/me")
check "GET /auth/me authenticated (200)" 200 "$STATUS"

# 5. Get /me without session → 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me")
check "GET /auth/me unauthenticated (401)" 401 "$STATUS"

echo ""
echo "--- Public endpoints ---"

# 6. List categories (public)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/categories")
check "GET /categories (200)" 200 "$STATUS"

# 7. List dishes (public)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/dishes")
check "GET /dishes (200)" 200 "$STATUS"

# 8. Dish not found
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/dishes/99999")
check "GET /dishes/99999 (404)" 404 "$STATUS"

echo ""
echo "--- Spin ---"

# 9. Spin as logged user
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/spin" \
    -H "Content-Type: application/json" -d '{}')
check "POST /spin (200)" 200 "$STATUS"

# 10. Spin without auth → 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/spin" \
    -H "Content-Type: application/json" -d '{}')
check "POST /spin unauthenticated (401)" 401 "$STATUS"

echo ""
echo "--- Admin guard ---"

# 11. POST /categories as regular user → 403
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/categories" \
    -H "Content-Type: application/json" \
    -d '{"name":"Hack","icon":"🔥","color":"#000"}')
check "POST /categories as user (403)" 403 "$STATUS"

# 12. Admin login
ADMIN_JAR=$(mktemp)
curl -s -o /dev/null -X POST "$BASE/auth/login" \
    -c "$ADMIN_JAR" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@spinneat.local","password":"password"}' > /dev/null

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$ADMIN_JAR" -X POST "$BASE/categories" \
    -H "Content-Type: application/json" \
    -d '{"name":"TestCat","icon":"🧪","color":"#ABC123"}')
check "POST /categories as admin (201)" 201 "$STATUS"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
