# Spin & Eat – Pamięć sesji Claude

> Aktualizacja: 2026-05-17

## Projekt
Aplikacja webowa "Spin & Eat" — kolo fortuny losujące posiłki.
Projekt uczelniany Wojciecha Kapały.

**Repo:** `wokapala/spinneat` na GitHub  
**Branch roboczy:** `claude/university-web-app-keIj6`

---

## Stack technologiczny
- **Backend:** PHP 8.3 OOP, PSR-4 (Composer), brak frameworka
- **Baza danych:** PostgreSQL 16, PDO, zapytania parametryczne
- **Frontend:** Vanilla JS SPA, Fetch API, Canvas 2D (kolo)
- **Serwer:** Nginx + PHP-FPM (Docker)
- **Testy:** PHPUnit 11 (unit), bash curl (integracyjne)
- **Kontenery:** Docker Compose (nginx + php + postgres)

---

## Architektura backendu
```
backend/src/
  Core/
    Application.php      # rejestruje trasy, globalny handler wyjątków
    Database.php         # Singleton PDO
    Request.php          # metoda, ścieżka, JSON body, query params
    Response.php         # static json/success/error/notFound/unauthorized/forbidden
    Router.php           # regex routing z {param} → ([^/]+)
    Middleware/
      AuthMiddleware.php   # sprawdza $_SESSION['user_id']
      AdminMiddleware.php  # sprawdza $_SESSION['user_role'] === 'admin'
  Exceptions/
    AppException.php (abstract)
    NotFoundException, ForbiddenException, UnauthorizedException, ValidationException
  Models/
    User.php, Dish.php   # readonly constructor properties, fromArray(), toArray()
  Repositories/
    BaseRepository.php
    UserRepository, DishRepository, CategoryRepository
    SpinRepository, ListRepository, RatingRepository
  Services/
    AuthService.php      # register (password_hash), login (password_verify + session), logout
    SpinService.php      # spin() z transakcją BEGIN/COMMIT/ROLLBACK
  Controllers/
    BaseController.php
    AuthController, DishController, CategoryController
    SpinController, ListController, RatingController, UserController
```

---

## Baza danych (schema.sql)

### Tabele
- `users` — role ENUM('guest','user','admin')
- `categories` — ikona, kolor, opis
- `dishes` — soft delete (is_active), category_id
- `recipes` — 1:1 z dishes (składniki, instrukcje, czas, trudność)
- `user_lists` + `list_items` — N:M listy użytkownika
- `favorites` — N:M user ↔ dish
- `spin_history` — historia losowań
- `ratings` — 1 ocena per user per dish (ON CONFLICT DO UPDATE)
- `dish_stats` — spin_count, avg_rating (aktualizowane triggerami)

### Widoki
- `v_dish_details` — JOIN dishes+categories+recipes+dish_stats+users
- `v_user_stats` — agregaty z users+spin_history+favorites+ratings

### Funkcja PL/pgSQL
- `get_random_dish(p_list_id INT DEFAULT NULL)` — losuje danie

### Triggery
- `after_spin_insert` → `trg_update_spin_count()` — aktualizuje dish_stats.spin_count
- `after_rating_change` → `trg_update_avg_rating()` — aktualizuje dish_stats.avg_rating

---

## API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/dishes
POST   /api/dishes            [auth]
GET    /api/dishes/{id}
PUT    /api/dishes/{id}       [auth]
DELETE /api/dishes/{id}       [admin]
GET    /api/dishes/favorites  [auth]
POST   /api/dishes/{id}/favorite    [auth]
DELETE /api/dishes/{id}/favorite    [auth]

GET    /api/categories
POST   /api/categories        [admin]
PUT    /api/categories/{id}   [admin]
DELETE /api/categories/{id}   [admin]

POST   /api/spin              [auth]
GET    /api/spin/history      [auth]

GET    /api/lists             [auth]
POST   /api/lists             [auth]
GET    /api/lists/{id}        [auth]
PUT    /api/lists/{id}        [auth]
DELETE /api/lists/{id}        [auth]
POST   /api/lists/{id}/dishes [auth]
DELETE /api/lists/{id}/dishes/{dishId} [auth]

POST   /api/ratings           [auth]

GET    /api/admin/users       [admin]
PUT    /api/admin/users/{id}  [admin]
DELETE /api/admin/users/{id}  [admin]
```

---

## Frontend – Design System (Stitch)

### Kolory
```css
--clr-primary: #a63300
--clr-primary-container: #ff7949
--clr-on-primary: #ffefeb
--clr-bg: #fcf5f1
--clr-surface-lowest: #ffffff
--clr-surface-low: #f6efeb
--clr-surface-container: #eee7e2
--clr-on-bg: #312e2c
--clr-on-surface-var: #5f5b58
--clr-outline-var: #b2aca9
--gradient-signature: linear-gradient(135deg, #a63300 0%, #ff7949 100%)
```

### Typografia
- Headlines: **Plus Jakarta Sans** (Google Fonts)
- Body: **Be Vietnam Pro** (Google Fonts)

### Ikony
- Material Symbols Outlined (Google Fonts)

### Layout
- Sticky topbar (cream bg)
- Floating pill bottom-nav (`rgba(255,121,73,.82)` + backdrop-filter blur)
- SPA: `<main id="app">` — Pages.xxx(container)

---

## Frontend – Pliki JS

### Strony (`frontend/js/pages/`)
| Plik | Status | Opis |
|------|--------|------|
| `home.js` | ✅ | Guest hero (bento) + spin page (wheel + result card) |
| `dishes.js` | ✅ | My Meals — search, chips, meal-card list, FAB add |
| `history.js` | ✅ | Stats banner (gradient) + history items + pagination |
| `login.js` | ✅ | Auth-card layout, spinner feedback |
| `register.js` | ✅ | Auth-card layout, spinner feedback |
| `profile.js` | ✅ | Avatar initials, stat tiles, action menu, logout |
| `favorites.js` | ✅ | Meal-card style z unfav button |
| `lists.js` | ✅ | List-item-card, modals view/add-dish |
| `admin.js` | ✅ | User rows z role badges, kategorie z color swatches |

### Inne JS
- `api.js` — Fetch wrapper dla wszystkich endpointów
- `auth.js` — Singleton, _updateUI(), nav-auth-only/nav-guest-only/nav-admin-only
- `wheel.js` — Canvas 2D, easeOut spin, warm palette
- `app.js` — Router SPA, [data-page] delegacja, active bottom-nav

---

## Testy

### Unit (PHPUnit)
- `AuthServiceTest.php` — 3 testy: za krótkie hasło, niepoprawny email, duplikat emaila
- `SpinServiceTest.php` — brak dań → NotFoundException

### Integracyjne
- `backend/tests/Integration/endpoints.sh` — 12 curl testów

---

## Domyślne konta (seed.sql)
| Rola | Email | Hasło |
|------|-------|-------|
| admin | admin@example.com | password |
| user | user@example.com | password |

---

## Uruchomienie
```bash
git pull origin claude/university-web-app-keIj6
cd backend && composer install && cd ..
docker compose up --build
# → http://localhost
```

---

## TODO (pozostałe zadania projektowe)
- [ ] README.md (opis projektu, instrukcja uruchomienia, wymagania)
- [ ] Diagram ERD (PNG/SVG)
- [ ] Diagram architektury
- [ ] Scenariusze testowe (dokument)
- [ ] Checklist wymagań uczelni
- [ ] Screenshoty (web + mobile) do dokumentacji
