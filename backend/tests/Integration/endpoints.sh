#!/usr/bin/env bash
# Integration tests — run after `docker compose up`.
# Hits the same nginx the browser uses, so every layer (CSRF middleware,
# auth, role guards, controllers, PDO) gets exercised end to end.

set -euo pipefail

BASE="http://localhost:${NGINX_PORT:-80}/api"
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

# Fetch the CSRF token and stash it in a cookie jar so every later
# request reuses the same session.
JAR=$(mktemp)
TOKEN=$(curl -s -c "$JAR" -b "$JAR" "$BASE/auth/csrf" | sed -n 's/.*"token":"\([a-f0-9]*\)".*/\1/p')
[ -n "$TOKEN" ] || { echo "✗ Could not obtain CSRF token from $BASE/auth/csrf"; exit 1; }

POST() {
    curl -s -o /dev/null -w "%{http_code}" -X "$1" "$BASE$2" \
        -b "$JAR" -c "$JAR" \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $TOKEN" \
        ${3:+-d "$3"}
}
GET()  { curl -s -o /dev/null -w "%{http_code}" -b "$JAR" -c "$JAR" "$BASE$1"; }

EMAIL="it_$(date +%s)@example.com"
PASSWORD="TestPass123"

echo "=== Spin & Eat Integration Tests ==="
echo "Base URL: $BASE"
echo "Test email: $EMAIL"
echo ""

echo "--- Auth ---"
check "POST /auth/register (201)" 201 "$(POST POST /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"IT Tester\"}")"
check "POST /auth/register duplicate (422)" 422 "$(POST POST /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"IT Tester\"}")"
check "POST /auth/register weak password (422)" 422 "$(POST POST /auth/register "{\"email\":\"weak_$EMAIL\",\"password\":\"weakpass\",\"name\":\"Weak\"}")"

check "POST /auth/login (200)" 200 "$(POST POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
check "POST /auth/login wrong password (401)" 401 "$(POST POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"wrong-XYZ\"}")"

check "GET /auth/me authenticated (200)" 200 "$(GET /auth/me)"

echo ""
echo "--- CSRF guard ---"
NO_TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/dishes" \
    -b "$JAR" -H "Content-Type: application/json" -d '{}')
check "POST without X-CSRF-Token (403)" 403 "$NO_TOKEN_STATUS"

echo ""
echo "--- Public reads ---"
check "GET /categories (200)" 200 "$(GET /categories)"
check "GET /dishes (200)" 200 "$(GET /dishes)"
check "GET /dishes/99999 (404)" 404 "$(GET /dishes/99999)"

echo ""
echo "--- Spin ---"
check "POST /spin authenticated (200)" 200 "$(POST POST /spin '{}')"

# Logged-out session: nuke cookie jar so /spin lacks credentials
LOGGED_OUT=$(mktemp)
TOKEN_OUT=$(curl -s -c "$LOGGED_OUT" -b "$LOGGED_OUT" "$BASE/auth/csrf" | sed -n 's/.*"token":"\([a-f0-9]*\)".*/\1/p')
SPIN_401=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/spin" \
    -b "$LOGGED_OUT" -c "$LOGGED_OUT" -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $TOKEN_OUT" -d '{}')
check "POST /spin unauthenticated (401)" 401 "$SPIN_401"

echo ""
echo "--- Admin guard ---"
check "POST /categories as user (403)" 403 \
    "$(POST POST /categories '{"name":"Hack","icon":"🔥","color":"#000000"}')"

# Login as the seeded admin (seed.sql hash is for "Admin1234!")
ADMIN_JAR=$(mktemp)
ADMIN_TOKEN=$(curl -s -c "$ADMIN_JAR" -b "$ADMIN_JAR" "$BASE/auth/csrf" | sed -n 's/.*"token":"\([a-f0-9]*\)".*/\1/p')
ADMIN_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
    -b "$ADMIN_JAR" -c "$ADMIN_JAR" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $ADMIN_TOKEN" \
    -d '{"email":"admin@spinneat.local","password":"Admin1234!"}')
check "Admin login (200)" 200 "$ADMIN_LOGIN"

ADMIN_CREATE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/categories" \
    -b "$ADMIN_JAR" -c "$ADMIN_JAR" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $ADMIN_TOKEN" \
    -d "{\"name\":\"IT-$(date +%s)\",\"icon\":\"🧪\",\"color\":\"#ABC123\"}")
check "POST /categories as admin (201)" 201 "$ADMIN_CREATE"

check "GET /admin/users as admin (200)" 200 \
    "$(curl -s -o /dev/null -w '%{http_code}' -b "$ADMIN_JAR" "$BASE/admin/users")"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
