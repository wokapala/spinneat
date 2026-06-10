-- ============================================================
-- Spin & Eat – Database Schema
-- PostgreSQL 16 | All 3NF | Views, Trigger, Function, Transactions
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM types
-- ============================================================
CREATE TYPE user_role AS ENUM ('guest', 'user', 'admin');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- ============================================================
-- TABLES
-- ============================================================

-- Users
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    role        user_role    NOT NULL DEFAULT 'user',
    avatar_url  VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Categories (cuisine types)
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(10),            -- emoji icon
    color       VARCHAR(7) DEFAULT '#FF6B6B'  -- hex color for wheel slice
);

-- Dishes
CREATE TABLE dishes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT          NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    image_url   VARCHAR(500),
    created_by  INT          REFERENCES users(id) ON DELETE SET NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Recipes (1-to-1 with dishes)
CREATE TABLE recipes (
    id           SERIAL PRIMARY KEY,
    dish_id      INT          NOT NULL UNIQUE REFERENCES dishes(id) ON DELETE CASCADE,
    instructions TEXT         NOT NULL,
    prep_time    INT,                    -- minutes
    cook_time    INT,                    -- minutes
    servings     INT,
    difficulty   difficulty_level NOT NULL DEFAULT 'medium',
    source_url   VARCHAR(500)
);

-- User custom spin lists
CREATE TABLE user_lists (
    id          SERIAL PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    is_public   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Many-to-many: user_lists <-> dishes
CREATE TABLE list_items (
    list_id  INT NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
    dish_id  INT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (list_id, dish_id)
);

-- Many-to-many: users <-> dishes (favorites)
CREATE TABLE favorites (
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id    INT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, dish_id)
);

-- Spin history
CREATE TABLE spin_history (
    id         SERIAL PRIMARY KEY,
    user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id    INT         NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    list_id    INT         REFERENCES user_lists(id) ON DELETE SET NULL,
    spun_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ratings (user rates a dish after eating)
CREATE TABLE ratings (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id    INT          NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    score      SMALLINT     NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment    TEXT,
    rated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, dish_id)  -- one rating per dish per user
);

-- Dish spin counter (denormalized counter, maintained by trigger)
CREATE TABLE dish_stats (
    dish_id    INT PRIMARY KEY REFERENCES dishes(id) ON DELETE CASCADE,
    spin_count INT NOT NULL DEFAULT 0,
    avg_rating NUMERIC(3,2) DEFAULT NULL
);

-- ============================================================
-- VIEWS
-- ============================================================

-- View 1: full dish details with category, avg rating, spin count
CREATE VIEW v_dish_details AS
SELECT
    d.id,
    d.name,
    d.description,
    d.image_url,
    d.is_active,
    d.created_by,
    d.created_at,
    c.id          AS category_id,
    c.name        AS category_name,
    c.icon        AS category_icon,
    c.color       AS category_color,
    r.instructions,
    r.prep_time,
    r.cook_time,
    r.servings,
    r.difficulty,
    r.source_url,
    COALESCE(ds.spin_count, 0)  AS spin_count,
    COALESCE(ds.avg_rating, 0)  AS avg_rating,
    u.name                       AS created_by_name
FROM dishes d
JOIN categories c     ON d.category_id = c.id
LEFT JOIN recipes r   ON r.dish_id = d.id
LEFT JOIN dish_stats ds ON ds.dish_id = d.id
LEFT JOIN users u     ON u.id = d.created_by;

-- View 2: user activity summary
CREATE VIEW v_user_stats AS
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.created_at,
    COUNT(DISTINCT sh.id)  AS total_spins,
    COUNT(DISTINCT f.dish_id) AS total_favorites,
    COUNT(DISTINCT rat.id) AS total_ratings,
    MAX(sh.spun_at)        AS last_spin_at
FROM users u
LEFT JOIN spin_history sh ON sh.user_id = u.id
LEFT JOIN favorites f     ON f.user_id = u.id
LEFT JOIN ratings rat     ON rat.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, u.created_at;

-- ============================================================
-- FUNCTION: get random dish from list or all active dishes
-- ============================================================
CREATE OR REPLACE FUNCTION get_random_dish(p_list_id INT DEFAULT NULL)
RETURNS TABLE(
    dish_id     INT,
    dish_name   VARCHAR,
    category    VARCHAR,
    category_icon VARCHAR,
    category_color VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_list_id IS NOT NULL THEN
        RETURN QUERY
            SELECT d.id, d.name, c.name, c.icon, c.color
            FROM dishes d
            JOIN categories c ON c.id = d.category_id
            JOIN list_items li ON li.dish_id = d.id
            WHERE li.list_id = p_list_id AND d.is_active = TRUE
            ORDER BY RANDOM()
            LIMIT 1;
    ELSE
        RETURN QUERY
            SELECT d.id, d.name, c.name, c.icon, c.color
            FROM dishes d
            JOIN categories c ON c.id = d.category_id
            WHERE d.is_active = TRUE
            ORDER BY RANDOM()
            LIMIT 1;
    END IF;
END;
$$;

-- ============================================================
-- TRIGGER: update dish_stats on spin_history insert
-- ============================================================
CREATE OR REPLACE FUNCTION trg_update_spin_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO dish_stats (dish_id, spin_count)
    VALUES (NEW.dish_id, 1)
    ON CONFLICT (dish_id) DO UPDATE
        SET spin_count = dish_stats.spin_count + 1;
    RETURN NEW;
END;
$$;

CREATE TRIGGER after_spin_insert
AFTER INSERT ON spin_history
FOR EACH ROW
EXECUTE FUNCTION trg_update_spin_count();

-- TRIGGER: update avg_rating in dish_stats on rating insert/update/delete
CREATE OR REPLACE FUNCTION trg_update_avg_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_dish_id INT;
BEGIN
    v_dish_id := COALESCE(NEW.dish_id, OLD.dish_id);

    INSERT INTO dish_stats (dish_id, avg_rating)
    VALUES (
        v_dish_id,
        (SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE dish_id = v_dish_id)
    )
    ON CONFLICT (dish_id) DO UPDATE
        SET avg_rating = (
            SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE dish_id = v_dish_id
        );
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER after_rating_change
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION trg_update_avg_rating();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_dishes_active ON dishes(is_active);
CREATE INDEX idx_spin_history_user ON spin_history(user_id);
CREATE INDEX idx_spin_history_dish ON spin_history(dish_id);
CREATE INDEX idx_spin_history_spun_at ON spin_history(spun_at DESC);
CREATE INDEX idx_ratings_dish ON ratings(dish_id);
CREATE INDEX idx_list_items_list ON list_items(list_id);
