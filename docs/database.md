# Database — Spin & Eat

PostgreSQL 16. Schema: [`database/schema.sql`](../database/schema.sql) · Seed: [`database/seed.sql`](../database/seed.sql) · Full export: [`database/exports/spinneat_full.sql`](../database/exports/spinneat_full.sql)

## ERD

![ERD](erd.png)

Source: [`erd.mmd`](erd.mmd) (Mermaid)

## Tables

| Table | Purpose |
|---|---|
| `users` | accounts with role (`guest` / `user` / `admin`) |
| `categories` | cuisine groups (Polska, Włoska…) |
| `dishes` | core entity — a dish belongs to one category |
| `recipes` | preparation details — **1:1** with `dishes` |
| `user_lists` | user-defined spin lists |
| `list_items` | **N:M** between `user_lists` and `dishes` |
| `favorites` | **N:M** between `users` and `dishes` |
| `spin_history` | every spin event with optional list reference |
| `ratings` | 1–5 star score + optional comment per (user, dish) |
| `dish_stats` | denormalised counters (`spin_count`, `avg_rating`), maintained by triggers — **1:1** with `dishes` |

All tables are in **3NF** — no transitive dependencies, no repeating groups, no calculated fields stored on the wrong entity.

## Relations covered (all three types required)

- **1:1** — `dishes` ↔ `recipes` (via `UNIQUE` FK), `dishes` ↔ `dish_stats` (via PK = FK).
- **1:N** — `categories` → `dishes`, `users` → `dishes` (`created_by`), `users` → `user_lists`, `users` → `spin_history`, `users` → `ratings`, `dishes` → `spin_history`, `dishes` → `ratings`.
- **N:M** — `users` ↔ `dishes` via `favorites`, `user_lists` ↔ `dishes` via `list_items`.

## Foreign-key actions

| FK | Action | Reason |
|---|---|---|
| `dishes.category_id` → `categories.id` | `ON DELETE RESTRICT` | a category cannot be removed while dishes use it |
| `dishes.created_by` → `users.id` | `ON DELETE SET NULL` | dish survives author removal |
| `recipes.dish_id` → `dishes.id` | `ON DELETE CASCADE` | recipe makes no sense without its dish |
| `dish_stats.dish_id` → `dishes.id` | `ON DELETE CASCADE` | stats follow the dish |
| `list_items.list_id` / `dish_id` | `ON DELETE CASCADE` | remove join row when either side is gone |
| `favorites.user_id` / `dish_id` | `ON DELETE CASCADE` | clean up favourites |
| `spin_history.user_id` / `dish_id` | `ON DELETE CASCADE` | history dies with the row |
| `spin_history.list_id` | `ON DELETE SET NULL` | preserve history if a list is deleted |
| `ratings.user_id` / `dish_id` | `ON DELETE CASCADE` | ratings die with the user or dish |

## Views (≥ 2 required)

### `v_dish_details`
Join across `dishes ⋈ categories ⋈ recipes ⋈ dish_stats ⋈ users`. Used by the API anywhere a dish is shown so the front end gets category info, recipe metadata, spin count and average rating in one row.

### `v_user_stats`
Aggregate of `users ⋈ spin_history ⋈ favorites ⋈ ratings` — used by the admin user list (total spins / favourites / ratings, last spin time).

## Functions (≥ 1 required)

### `get_random_dish(p_list_id INT DEFAULT NULL)`
Returns a random active dish — scoped to `list_items` of `p_list_id` if provided, otherwise the whole dish catalogue. Called by `SpinRepository`.

### `trg_update_spin_count()` / `trg_update_avg_rating()`
Trigger procedures backing the two triggers below — maintain `dish_stats` so the front end never has to recalculate counters.

## Triggers (≥ 1 required)

### `after_spin_insert` — `AFTER INSERT ON spin_history`
Upserts `dish_stats.spin_count` so every spin bumps the counter atomically.

### `after_rating_change` — `AFTER INSERT OR UPDATE OR DELETE ON ratings`
Recomputes `dish_stats.avg_rating` for the affected dish whenever the rating set changes.

## Transactions

Multi-step writes are wrapped via `Database::beginTransaction()` / `commit()` / `rollback()`. Example: `App\Services\SpinService::spin()` reads a random dish, inserts a `spin_history` row (which fires the counter trigger) and only commits if both succeed. The default isolation level is **READ COMMITTED** (PostgreSQL default) — sufficient because each transaction touches at most one user's data and concurrent spins on the same dish converge through the upsert in the trigger. Higher isolation (`REPEATABLE READ`) can be set per-transaction where needed.

## Normal forms

- **1NF** — atomic values; no arrays / CSV columns.
- **2NF** — every non-key attribute depends on the full primary key (composite keys in `list_items` / `favorites` only carry the timestamp).
- **3NF** — no transitive dependencies; e.g. category metadata lives in `categories`, not duplicated on `dishes`; recipe metadata lives in `recipes`, not on `dishes`.

No redundancy → no update / delete anomalies. The only denormalised data is `dish_stats`, which is **explicitly** a materialised counter, refreshed by triggers, and not the source of truth.

## Export

A single self-contained SQL dump (schema + sample data, wrapped in a transaction) is available at [`database/exports/spinneat_full.sql`](../database/exports/spinneat_full.sql). Load via:

```bash
docker compose exec -T db psql -U spinneat -d spinneat < database/exports/spinneat_full.sql
```
