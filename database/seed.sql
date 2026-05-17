-- ============================================================
-- Spin & Eat – Seed Data
-- ============================================================

-- Admin user (password: Admin1234!)
INSERT INTO users (email, password, name, role) VALUES
('admin@spinneat.local', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHxL6vxAm', 'Administrator', 'admin'),
('jan@example.com',      '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHxL6vxAm', 'Jan Kowalski',    'user'),
('anna@example.com',     '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHxL6vxAm', 'Anna Nowak',      'user');

-- Categories
INSERT INTO categories (name, description, icon, color) VALUES
('Polska',    'Tradycyjna kuchnia polska',           '🥟', '#E63946'),
('Włoska',   'Pizza, pasta i inne włoskie klasyki', '🍕', '#F4A261'),
('Azjatycka','Sushi, ramen, stir-fry',               '🍜', '#2A9D8F'),
('Meksykańska','Tacos, burrito, guacamole',          '🌮', '#E9C46A'),
('Wegetariańska','Dania bez mięsa',                  '🥗', '#57CC99'),
('Fast Food', 'Burgery, fryty, pizza na wynos',      '🍔', '#FF6B6B');

-- Dishes
INSERT INTO dishes (name, description, category_id, created_by) VALUES
-- Polska
('Bigos',            'Kapusta kiszona z mięsem i grzybami',          1, 1),
('Żurek',            'Zupa na zakwasie żytnim z jajkiem i kiełbasą', 1, 1),
('Kotlet schabowy',  'Panierowany schab z ziemniakami',              1, 1),
('Pierogi ruskie',   'Pierogi z ziemniakiem, twarogiem i cebulą',    1, 1),
-- Włoska
('Spaghetti carbonara', 'Makaron z jajkiem, boczkiem i parmezanem', 2, 1),
('Margherita',          'Pizza z sosem pomidorowym i mozzarellą',    2, 1),
('Risotto grzybowe',    'Kremowe risotto z leśnymi grzybami',        2, 1),
-- Azjatycka
('Ramen tonkotsu',   'Zupa ramen na bulionie wieprzowym',            3, 1),
('Sushi nigiri',     'Ręcznie formowane nigiri z łososiem',          3, 1),
('Pad Thai',         'Smażony makaron ryżowy z krewetkami',          3, 1),
-- Meksykańska
('Tacos al pastor',  'Tacos z wieprzowiną i ananasem',               4, 1),
('Burrito bowl',     'Miska z ryżem, fasolą i kurczakiem',           4, 1),
-- Wegetariańska
('Curry z ciecierzycą','Aromatyczne curry z ciecierzycą i szpinakiem',5, 1),
('Falafel wrap',     'Falafel z hummusem i warzywami w pitce',       5, 1),
-- Fast Food
('Double Smash Burger','Podwójny burger z serem cheddar',            6, 1),
('Hot Dog NYC',      'Parówka z musztardą i cebulą',                 6, 1);

-- Recipes (1-to-1 with selected dishes)
INSERT INTO recipes (dish_id, instructions, prep_time, cook_time, servings, difficulty, source_url) VALUES
(4, 'Zagnieść ciasto z mąki i jajek. Ugotować ziemniaki z twarogiem. Uformować pierogi i ugotować w osolonej wodzie. Podsmażyć z cebulką.', 30, 20, 4, 'medium', NULL),
(5, 'Ugotować makaron al dente. Smażyć boczek. Wymieszać jajka z parmezanem. Połączyć wszystko poza ogniem.', 10, 15, 2, 'medium', NULL),
(6, 'Rozwałkować ciasto. Posmarować sosem pomidorowym. Dodać mozzarellę. Piec w 250°C przez 10-12 minut.', 20, 12, 2, 'easy', NULL),
(8, 'Gotować kości wieprzowe 8 godzin. Ugotować makaron ramen. Złożyć miskę: bulion, makaron, jajko, chashu.', 60, 480, 2, 'hard', NULL),
(13,'Podsmażyć cebulę z czosnkiem i imbirem. Dodać ciecierzycę, pomidory i przyprawy curry. Dusić 20 minut. Dodać szpinak.', 15, 25, 3, 'easy', NULL);

-- User lists
INSERT INTO user_lists (user_id, name, description, is_public) VALUES
(2, 'Moje ulubione', 'Dania które uwielbiam', TRUE),
(2, 'Na weekendy',   'Bardziej pracochłonne przepisy', FALSE),
(3, 'Wegetariańskie','Lista dań bez mięsa', TRUE);

-- List items (many-to-many)
INSERT INTO list_items (list_id, dish_id) VALUES
(1, 4), (1, 5), (1, 6), (1, 9),
(2, 8), (2, 1), (2, 3),
(3, 13), (3, 14);

-- Favorites (many-to-many)
INSERT INTO favorites (user_id, dish_id) VALUES
(2, 5), (2, 9), (2, 4), (2, 13),
(3, 13), (3, 14), (3, 6);

-- Spin history
INSERT INTO spin_history (user_id, dish_id, list_id, spun_at) VALUES
(2, 5,  1, NOW() - INTERVAL '7 days'),
(2, 9,  NULL, NOW() - INTERVAL '5 days'),
(2, 4,  1, NOW() - INTERVAL '3 days'),
(2, 13, NULL, NOW() - INTERVAL '1 day'),
(3, 13, 3, NOW() - INTERVAL '6 days'),
(3, 14, 3, NOW() - INTERVAL '4 days'),
(3, 6,  NULL, NOW() - INTERVAL '2 days');

-- Ratings
INSERT INTO ratings (user_id, dish_id, score, comment) VALUES
(2, 5,  5, 'Najlepsza carbonara jaką jadłem!'),
(2, 9,  4, 'Świeże i smaczne'),
(2, 4,  5, 'Jak u babci'),
(2, 13, 4, 'Bardzo aromatyczne'),
(3, 13, 5, 'Ulubione danie!'),
(3, 14, 4, 'Pyszny falafel'),
(3, 6,  5, 'Prosta i pyszna');
