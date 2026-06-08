-- ============================================================
-- Spin & Eat – Full Database Dump (schema + sample data)
-- PostgreSQL 16
-- ============================================================
-- Usage:
--   psql -U spinneat -d spinneat -f spinneat_full.sql
-- or via docker:
--   docker compose exec -T db psql -U spinneat -d spinneat < spinneat_full.sql
-- ============================================================

BEGIN;

-- ============================================================
-- SCHEMA
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM types
CREATE TYPE user_role AS ENUM ('guest', 'user', 'admin');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

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

CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(10),
    color       VARCHAR(7) DEFAULT '#FF6B6B'
);

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

-- 1-to-1 with dishes
CREATE TABLE recipes (
    id           SERIAL PRIMARY KEY,
    dish_id      INT          NOT NULL UNIQUE REFERENCES dishes(id) ON DELETE CASCADE,
    instructions TEXT         NOT NULL,
    prep_time    INT,
    cook_time    INT,
    servings     INT,
    difficulty   difficulty_level NOT NULL DEFAULT 'medium',
    source_url   VARCHAR(500)
);

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

CREATE TABLE spin_history (
    id         SERIAL PRIMARY KEY,
    user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id    INT         NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    list_id    INT         REFERENCES user_lists(id) ON DELETE SET NULL,
    spun_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ratings (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id    INT          NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    score      SMALLINT     NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment    TEXT,
    rated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, dish_id)
);

-- Denormalized counters, maintained by triggers
CREATE TABLE dish_stats (
    dish_id    INT PRIMARY KEY REFERENCES dishes(id) ON DELETE CASCADE,
    spin_count INT NOT NULL DEFAULT 0,
    avg_rating NUMERIC(3,2) DEFAULT NULL
);

-- ------------------------------------------------------------
-- VIEWS
-- ------------------------------------------------------------

CREATE VIEW v_dish_details AS
SELECT
    d.id, d.name, d.description, d.image_url, d.is_active, d.created_at,
    c.id   AS category_id,  c.name AS category_name,
    c.icon AS category_icon, c.color AS category_color,
    r.instructions, r.prep_time, r.cook_time, r.servings, r.difficulty, r.source_url,
    COALESCE(ds.spin_count, 0) AS spin_count,
    COALESCE(ds.avg_rating, 0) AS avg_rating,
    u.name AS created_by_name
FROM dishes d
JOIN categories c     ON d.category_id = c.id
LEFT JOIN recipes r   ON r.dish_id = d.id
LEFT JOIN dish_stats ds ON ds.dish_id = d.id
LEFT JOIN users u     ON u.id = d.created_by;

CREATE VIEW v_user_stats AS
SELECT
    u.id, u.name, u.email, u.role, u.created_at,
    COUNT(DISTINCT sh.id)     AS total_spins,
    COUNT(DISTINCT f.dish_id) AS total_favorites,
    COUNT(DISTINCT rat.id)    AS total_ratings,
    MAX(sh.spun_at)           AS last_spin_at
FROM users u
LEFT JOIN spin_history sh ON sh.user_id = u.id
LEFT JOIN favorites f     ON f.user_id = u.id
LEFT JOIN ratings rat     ON rat.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, u.created_at;

-- ------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_random_dish(p_list_id INT DEFAULT NULL)
RETURNS TABLE(
    dish_id        INT,
    dish_name      VARCHAR,
    category       VARCHAR,
    category_icon  VARCHAR,
    category_color VARCHAR
)
LANGUAGE plpgsql AS $$
BEGIN
    IF p_list_id IS NOT NULL THEN
        RETURN QUERY
            SELECT d.id, d.name, c.name, c.icon, c.color
            FROM dishes d
            JOIN categories c ON c.id = d.category_id
            JOIN list_items li ON li.dish_id = d.id
            WHERE li.list_id = p_list_id AND d.is_active = TRUE
            ORDER BY RANDOM() LIMIT 1;
    ELSE
        RETURN QUERY
            SELECT d.id, d.name, c.name, c.icon, c.color
            FROM dishes d
            JOIN categories c ON c.id = d.category_id
            WHERE d.is_active = TRUE
            ORDER BY RANDOM() LIMIT 1;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_update_spin_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
FOR EACH ROW EXECUTE FUNCTION trg_update_spin_count();

CREATE OR REPLACE FUNCTION trg_update_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_dish_id INT;
BEGIN
    v_dish_id := COALESCE(NEW.dish_id, OLD.dish_id);
    INSERT INTO dish_stats (dish_id, avg_rating)
    VALUES (v_dish_id, (SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE dish_id = v_dish_id))
    ON CONFLICT (dish_id) DO UPDATE
        SET avg_rating = (SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE dish_id = v_dish_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER after_rating_change
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW EXECUTE FUNCTION trg_update_avg_rating();

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
CREATE INDEX idx_dishes_category        ON dishes(category_id);
CREATE INDEX idx_dishes_active          ON dishes(is_active);
CREATE INDEX idx_spin_history_user      ON spin_history(user_id);
CREATE INDEX idx_spin_history_dish      ON spin_history(dish_id);
CREATE INDEX idx_spin_history_spun_at   ON spin_history(spun_at DESC);
CREATE INDEX idx_ratings_dish           ON ratings(dish_id);
CREATE INDEX idx_list_items_list        ON list_items(list_id);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Default password for sample users: Admin1234!
INSERT INTO users (email, password, name, role) VALUES
('admin@spinneat.local', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHxL6vxAm', 'Administrator', 'admin'),
('jan@example.com',      '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHxL6vxAm', 'Jan Kowalski',  'user'),
('anna@example.com',     '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHxL6vxAm', 'Anna Nowak',    'user');

INSERT INTO categories (name, description, icon, color) VALUES
('Polska',        'Tradycyjna kuchnia polska',           '🥟', '#E63946'),
('Włoska',        'Pizza, pasta i inne włoskie klasyki', '🍕', '#F4A261'),
('Azjatycka',     'Sushi, ramen, stir-fry',              '🍜', '#2A9D8F'),
('Meksykańska',   'Tacos, burrito, guacamole',           '🌮', '#E9C46A'),
('Wegetariańska', 'Dania bez mięsa',                     '🥗', '#57CC99'),
('Fast Food',     'Burgery, fryty, pizza na wynos',      '🍔', '#FF6B6B');

INSERT INTO dishes (name, description, category_id, created_by) VALUES
('Bigos',               'Kapusta kiszona z mięsem i grzybami',           1, 1),
('Żurek',               'Zupa na zakwasie żytnim z jajkiem i kiełbasą',  1, 1),
('Kotlet schabowy',     'Panierowany schab z ziemniakami',               1, 1),
('Pierogi ruskie',      'Pierogi z ziemniakiem, twarogiem i cebulą',     1, 1),
('Spaghetti carbonara', 'Makaron z jajkiem, boczkiem i parmezanem',      2, 1),
('Margherita',          'Pizza z sosem pomidorowym i mozzarellą',        2, 1),
('Risotto grzybowe',    'Kremowe risotto z leśnymi grzybami',            2, 1),
('Ramen tonkotsu',      'Zupa ramen na bulionie wieprzowym',             3, 1),
('Sushi nigiri',        'Ręcznie formowane nigiri z łososiem',           3, 1),
('Pad Thai',            'Smażony makaron ryżowy z krewetkami',           3, 1),
('Tacos al pastor',     'Tacos z wieprzowiną i ananasem',                4, 1),
('Burrito bowl',        'Miska z ryżem, fasolą i kurczakiem',            4, 1),
('Curry z ciecierzycą', 'Aromatyczne curry z ciecierzycą i szpinakiem',  5, 1),
('Falafel wrap',        'Falafel z hummusem i warzywami w pitce',        5, 1),
('Double Smash Burger', 'Podwójny burger z serem cheddar',               6, 1),
('Hot Dog NYC',         'Parówka z musztardą i cebulą',                  6, 1);

INSERT INTO recipes (dish_id, instructions, prep_time, cook_time, servings, difficulty, source_url) VALUES
(4,  'Zagnieść ciasto z mąki i jajek. Ugotować ziemniaki z twarogiem. Uformować pierogi i ugotować w osolonej wodzie. Podsmażyć z cebulką.', 30, 20, 4, 'medium', NULL),
(5,  'Ugotować makaron al dente. Smażyć boczek. Wymieszać jajka z parmezanem. Połączyć wszystko poza ogniem.', 10, 15, 2, 'medium', NULL),
(6,  'Rozwałkować ciasto. Posmarować sosem pomidorowym. Dodać mozzarellę. Piec w 250°C przez 10-12 minut.', 20, 12, 2, 'easy', NULL),
(8,  'Gotować kości wieprzowe 8 godzin. Ugotować makaron ramen. Złożyć miskę: bulion, makaron, jajko, chashu.', 60, 480, 2, 'hard', NULL),
(13, 'Podsmażyć cebulę z czosnkiem i imbirem. Dodać ciecierzycę, pomidory i przyprawy curry. Dusić 20 minut. Dodać szpinak.', 15, 25, 3, 'easy', NULL);

INSERT INTO user_lists (user_id, name, description, is_public) VALUES
(2, 'Moje ulubione',    'Dania które uwielbiam',           TRUE),
(2, 'Na weekendy',      'Bardziej pracochłonne przepisy',  FALSE),
(3, 'Wegetariańskie',   'Lista dań bez mięsa',             TRUE);

INSERT INTO list_items (list_id, dish_id) VALUES
(1, 4), (1, 5), (1, 6), (1, 9),
(2, 8), (2, 1), (2, 3),
(3, 13), (3, 14);

INSERT INTO favorites (user_id, dish_id) VALUES
(2, 5), (2, 9), (2, 4), (2, 13),
(3, 13), (3, 14), (3, 6);

INSERT INTO spin_history (user_id, dish_id, list_id, spun_at) VALUES
(2, 5,  1,    NOW() - INTERVAL '7 days'),
(2, 9,  NULL, NOW() - INTERVAL '5 days'),
(2, 4,  1,    NOW() - INTERVAL '3 days'),
(2, 13, NULL, NOW() - INTERVAL '1 day'),
(3, 13, 3,    NOW() - INTERVAL '6 days'),
(3, 14, 3,    NOW() - INTERVAL '4 days'),
(3, 6,  NULL, NOW() - INTERVAL '2 days');

INSERT INTO ratings (user_id, dish_id, score, comment) VALUES
(2, 5,  5, 'Najlepsza carbonara jaką jadłem!'),
(2, 9,  4, 'Świeże i smaczne'),
(2, 4,  5, 'Jak u babci'),
(2, 13, 4, 'Bardzo aromatyczne'),
(3, 13, 5, 'Ulubione danie!'),
(3, 14, 4, 'Pyszny falafel'),
(3, 6,  5, 'Prosta i pyszna');

COMMIT;
