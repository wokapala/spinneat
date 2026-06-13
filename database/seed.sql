-- ============================================================
-- Spin & Eat – Seed Data
-- ============================================================

-- All seed users share the password: Admin1234!
-- (bcrypt cost 12 — verified with password_verify)
INSERT INTO users (email, password, name, role) VALUES
('admin@spinneat.local', '$2y$12$ulFz5Lj8yFPCvxdTs/NPHeuhmwLZ1yE2c3NehbaADi8zZ8emNNyqe', 'Administrator', 'admin'),
('jan@example.com',      '$2y$12$ulFz5Lj8yFPCvxdTs/NPHeuhmwLZ1yE2c3NehbaADi8zZ8emNNyqe', 'Jan Kowalski',    'user'),
('anna@example.com',     '$2y$12$ulFz5Lj8yFPCvxdTs/NPHeuhmwLZ1yE2c3NehbaADi8zZ8emNNyqe', 'Anna Nowak',      'user');

-- Categories
INSERT INTO categories (name, description, icon, color) VALUES
('Polska',       'Tradycyjna kuchnia polska',           '🥟', '#E63946'),
('Włoska',       'Pizza, pasta i inne włoskie klasyki', '🍕', '#F4A261'),
('Azjatycka',    'Sushi, ramen, stir-fry',              '🍜', '#2A9D8F'),
('Meksykańska',  'Tacos, burrito, guacamole',           '🌮', '#E9C46A'),
('Wegetariańska','Dania bez mięsa',                     '🥗', '#57CC99'),
('Fast Food',    'Burgery, fryty, pizza na wynos',      '🍔', '#FF6B6B');

-- Dishes
INSERT INTO dishes (name, description, category_id, created_by) VALUES
-- Polska (1–5)
('Bigos',             'Kapusta kiszona z mięsem, grzybami i przyprawami',     1, 1),
('Żurek',             'Zupa na zakwasie żytnim z jajkiem i białą kiełbasą',   1, 1),
('Kotlet schabowy',   'Panierowany schab z ziemniakami i surówką',            1, 1),
('Pierogi ruskie',    'Pierogi z ziemniakiem, twarogiem i podsmażaną cebulą', 1, 2),
('Gołąbki',           'Mięso z ryżem zawinięte w liście kapusty w sosie pomidorowym', 1, 2),
-- Włoska (6–10)
('Spaghetti carbonara','Makaron z jajkiem, boczkiem guanciale i parmezanem', 2, 1),
('Margherita',         'Pizza z sosem pomidorowym San Marzano i mozzarellą', 2, 1),
('Risotto grzybowe',   'Kremowe risotto z leśnymi grzybami i parmezanem',    2, 3),
('Lasagne bolognese',  'Warstwy makaronu z ragù bolognese i beszamelem',     2, 1),
('Tiramisu',           'Klasyczny włoski deser z mascarpone i espresso',     2, 3),
-- Azjatycka (11–15)
('Ramen tonkotsu',    'Zupa ramen na 12-godzinnym bulionie wieprzowym',      3, 1),
('Sushi nigiri',      'Ręcznie formowane nigiri z łososiem i tuńczykiem',    3, 3),
('Pad Thai',          'Smażony makaron ryżowy z krewetkami i orzeszkami',    3, 2),
('Gyoza',             'Japońskie pierożki z mięsem i warzywami, smażone',    3, 2),
('Bibimbap',          'Koreańska miska z ryżem, warzywami i jajkiem',        3, 3),
-- Meksykańska (16–19)
('Tacos al pastor',   'Tacos z wolno pieczonym wieprzem i ananasem',         4, 1),
('Burrito bowl',      'Miska z ryżem, czarną fasolą, guacamole i kurczakiem',4, 2),
('Quesadilla',        'Tortilla z serem, kurczakiem i warzywami',            4, 2),
('Nachos supreme',    'Nachosy z serem, jalapeño, guacamole i śmietaną',     4, 3),
-- Wegetariańska (20–23)
('Curry z ciecierzycą','Aromatyczne curry z ciecierzycą, szpinakiem i kokosem', 5, 1),
('Falafel wrap',      'Falafel z hummusem i warzywami w chlebku pita',       5, 3),
('Buddha bowl',       'Miska z quinoa, awokado, batatem i tahini',           5, 2),
('Shakshuka',         'Jajka duszone w pikantnym sosie pomidorowym z papryką',5, 1),
-- Fast Food (24–27)
('Double Smash Burger','Podwójny burger wołowy z serem cheddar i sosem',     6, 1),
('Hot Dog NYC',        'Parówka z musztardą, ketchupem i smażoną cebulą',    6, 2),
('Crispy Chicken Wrap','Chrupiący kurczak z coleslaw w tortilli',            6, 2),
('BBQ Loaded Fries',   'Frytki z pulled pork, serem cheddar i BBQ',         6, 3);

-- Recipes (dla wszystkich dań)
INSERT INTO recipes (dish_id, instructions, prep_time, cook_time, servings, difficulty) VALUES
(1,  'Ugotować mięso (wieprzowina, wołowina). Osobno dusić kiszoną kapustę z cebulą i grzybami. Połączyć wszystko, dodać przyprawy (pieprz, ziele angielskie, liść laurowy). Dusić razem minimum 1 godzinę. Najlepszy następnego dnia.', 30, 90, 6, 'medium'),
(2,  'Przygotować zakwas żytni lub użyć gotowego. Ugotować wywar z białej kiełbasy i warzyw. Dodać zakwas do wywaru, doprawić majerankiem i czosnkiem. Podawać z jajkiem na twardo i kiełbasą.', 15, 30, 4, 'easy'),
(3,  'Rozbić schab, natrzeć solą i pieprzem. Obtoczyć kolejno w mące, roztrzepanym jajku i bułce tartej. Smażyć na rozgrzanym oleju po 4 minuty z każdej strony na złoty kolor. Podawać z ziemniakami i surówką.', 15, 20, 2, 'easy'),
(4,  'Zagnieść ciasto z mąki, jajka i szczypty soli. Odstawić na 30 minut. Ugotować ziemniaki, utłuc z twarogiem i smażoną cebulą. Wałkować ciasto cienko, wycinać kółka, nadziewać i sklejać. Gotować w osolonej wodzie 3-4 minuty po wypłynięciu. Podsmażyć z cebulką na maśle.', 45, 25, 4, 'medium'),
(5,  'Zblanszować liście kapusty. Wymieszać mięso mielone z ugotowanym ryżem, cebulą i przyprawami. Zawijać farsz w liście. Ułożyć w garnku, zalać sosem pomidorowym z bulionem. Dusić pod przykryciem 90 minut.', 30, 90, 5, 'medium'),
(6,  'Ugotować makaron al dente. Usmażyć pokrojony boczek bez tłuszczu. Wymieszać żółtka z tartym parmezanem i pieprzem. Odcedzić makaron, zachowując szklankę wody. Połączyć makaron z boczkiem poza ogniem, dodać masę jajeczną, rozrzedzić wodą z makaronu. Nie podgrzewać — jajka zetną się od ciepła makaronu.', 10, 15, 2, 'medium'),
(7,  'Przygotować ciasto drożdżowe lub użyć gotowego. Wymieszać passatę z oliwą, solą i oregano. Posmarować ciasto, dodać pokrojoną mozzarellę. Piec w 250°C (najwyższa temperatura piekarnika) przez 10-12 minut. Podawać z listkami świeżej bazylii.', 20, 12, 2, 'easy'),
(8,  'Podsmażyć cebulę i czosnek na maśle. Dodać ryż arborio, mieszać 2 minuty. Wlać białe wino. Stopniowo dodawać gorący bulion chochelkami, mieszając cały czas przez 18 minut. Dodać podsmażone grzyby, parmezan i masło. Odstawić na 2 minuty przed podaniem.', 15, 25, 3, 'medium'),
(9,  'Przygotować ragù: dusić mięso mielone z warzywami i passatą 2 godziny. Zrobić beszamel. Układać warstwy: makaron, ragù, beszamel. Powtórzyć 3 razy. Posypać parmezanem. Piec w 180°C przez 40 minut.', 40, 160, 6, 'hard'),
(10, 'Zaparzyć mocne espresso, ostudzić. Ubić mascarpone z żółtkami i cukrem. Ubić śmietanę, połączyć z masą. Maczać biszkopty w espresso, układać warstwami z kremem. Posypać kakao. Chłodzić minimum 4 godziny.', 30, 0, 6, 'medium'),
(11, 'Gotować kości wieprzowe z imbirem i cebulą przez 12 godzin. Przygotować chashu (boczek zwijany). Ugotować makaron ramen. Składać miskę: gorący bulion, makaron, jajko marynowane w soji, chashu, nori, szczypior.', 60, 720, 2, 'hard'),
(12, 'Ugotować ryż do sushi z octem ryżowym i cukrem. Pokroić ryby w plastry. Uformować podłużne kulki z ryżu, nałożyć rybę. Podawać z wasabi, sosem sojowym i imbirem marynowanym.', 30, 20, 2, 'medium'),
(13, 'Namoczyć makaron ryżowy. Rozgrzać wok mocno, smażyć krewetki. Dodać makaron, sos pad thai (tamaryndowiec, sos rybny, cukier). Wbić jajka, wymieszać. Dodać kiełki sojowe i szczypiorek. Podawać z orzeszkami i limonką.', 15, 15, 2, 'medium'),
(14, 'Wymieszać mięso mielone z kapustą, czosnkiem, imbirem i sosem sojowym. Złożyć ciasto gyoza, nałożyć farsz, zacisnąć brzegi. Smażyć na oleju 2 minuty, dolać wody, przykryć, parować 3 minuty. Podawać z sosem ponzu.', 30, 10, 3, 'medium'),
(15, 'Ugotować ryż. Osobno podsmażyć marchew, szpinak, cukinię i grzyby shiitake z sojowym. Ułożyć warzywa na ryżu, dodać jajko sadzone i gochujang. Wymieszać przed jedzeniem.', 20, 20, 1, 'easy'),
(16, 'Marynować wieprzowinę w achiote, cytrusach i przyprawach przez noc. Piec powoli 3-4 godziny lub smażyć w plasterki. Podawać w tortillach z cebulą, kolendrą i kawałkiem ananasa.', 20, 240, 4, 'hard'),
(17, 'Ugotować ryż z czosnkiem i limonką. Ugotować czarną fasolę z kuminem. Grillować kurczaka z przyprawami tex-mex. Podawać w misce warstwami z guacamole, śmietaną i salsą.', 20, 30, 2, 'easy'),
(18, 'Rozgrzać patelnię. Położyć tortillę, posypać serem, dodać kurczaka i warzywa. Przykryć drugą tortillą. Smażyć 2-3 minuty z każdej strony. Kroić w trójkąty, podawać z guacamole.', 10, 10, 2, 'easy'),
(19, 'Rozłożyć nachosy na blasze. Posypać serem cheddar, jalapeño. Zapiec w 200°C przez 8 minut. Dodać guacamole, śmietanę, salsę. Podawać natychmiast.', 10, 8, 3, 'easy'),
(20, 'Podsmażyć cebulę, czosnek i imbir. Dodać przyprawy curry, kurkumę, garam masala. Wrzucić odsączoną ciecierzycę i pomidory z puszki. Dusić 20 minut. Dodać mleko kokosowe i szpinak, dusić 5 minut. Podawać z ryżem basmati.', 15, 30, 3, 'easy'),
(21, 'Zrobić falafel: zblendować ciecierzycę z pietruszką, cebulą, kuminem. Formować kulki, smażyć w głębokim oleju. Zrobić hummus. Otworzyć pitę, włożyć falafel, hummus, sałatę, pomidor, ogórek i sos tahini.', 25, 15, 2, 'medium'),
(22, 'Ugotować quinoa. Upiec batata w kostkach (20 min, 200°C). Pokroić awokado. Ułożyć wszystko w misce z liśćmi szpinaku. Polać sosem tahini z limonką i czosnkiem. Posypać sezamem.', 15, 20, 1, 'easy'),
(23, 'Podsmażyć cebulę i czosnek, dodać paprykę i pomidory z puszki. Doprawić kuminem, papryką słodką i ostrą. Dusić 10 minut. Zrobić zagłębienia, wbić jajka. Przykryć, gotować 5-8 minut. Podawać z chlebem pita.', 10, 20, 2, 'easy'),
(24, 'Uformować dwa cienkie kotlety z 150g mięsa każdy. Rozgrzać żeliwną patelnię do maksimum. Rozbić kotlety łopatką (smash). Smażyć 2 minuty, odwrócić, nałożyć ser. Złożyć burger z sałatą, pomidorem, ogórkiem i sosem.', 10, 8, 1, 'easy'),
(25, 'Ugotować parówkę. Podgrzać bułkę hot-dog. Nałożyć parówkę, dodać żółtą musztardę, ketchup i smażoną cebulę. Opcjonalnie: relish ogórkowy i kapusta kiszona.', 5, 10, 1, 'easy'),
(26, 'Panierować filety kurczaka w maślance i przyprawach, smażyć na głębokim oleju. Zrobić coleslaw z kapusty, marchewki i majonezu. Podgrzać tortillę, nałożyć kurczaka, coleslaw i ostry sos.', 20, 15, 2, 'medium'),
(27, 'Usmażyć lub upiec frytki. Przygotować pulled pork (wieprzowina pieczona 6h z BBQ). Ułożyć frytki, polać sosem serowym cheddar, nałożyć pulled pork, polać BBQ, dodać jalapeño i szczypiorek.', 20, 360, 2, 'hard');

-- User lists
INSERT INTO user_lists (user_id, name, description, is_public) VALUES
(2, 'Moje ulubione',      'Dania które uwielbiam — najlepsze hity',     TRUE),
(2, 'Na weekendy',        'Bardziej pracochłonne przepisy na wolny czas', FALSE),
(2, 'Szybkie obiady',     'Gotowe w mniej niż 30 minut',                 TRUE),
(3, 'Wegetariańskie',     'Lista dań bez mięsa',                         TRUE),
(3, 'Kuchnia azjatycka',  'Najlepsze dania z Azji',                      TRUE),
(3, 'Comfort food',       'Na złe dni — jedzenie które leczy',           FALSE);

-- List items (many-to-many)
INSERT INTO list_items (list_id, dish_id) VALUES
-- Jan: Moje ulubione
(1, 4), (1, 6), (1, 7), (1, 11), (1, 20),
-- Jan: Na weekendy
(2, 9), (2, 11), (2, 16), (2, 27),
-- Jan: Szybkie obiady
(3, 3), (3, 7), (3, 13), (3, 18), (3, 22), (3, 23),
-- Anna: Wegetariańskie
(4, 20), (4, 21), (4, 22), (4, 23), (4, 8), (4, 10),
-- Anna: Kuchnia azjatycka
(5, 11), (5, 12), (5, 13), (5, 14), (5, 15),
-- Anna: Comfort food
(6, 1), (6, 4), (6, 6), (6, 9), (6, 24);

-- Favorites
INSERT INTO favorites (user_id, dish_id) VALUES
(2, 4), (2, 6), (2, 7), (2, 11), (2, 13), (2, 20), (2, 24),
(3, 7), (3, 12), (3, 20), (3, 21), (3, 22), (3, 15), (3, 10);

-- Spin history (ostatnie 2 tygodnie)
INSERT INTO spin_history (user_id, dish_id, list_id, spun_at) VALUES
(2, 6,  1, NOW() - INTERVAL '13 days'),
(2, 11, NULL, NOW() - INTERVAL '12 days'),
(2, 4,  1, NOW() - INTERVAL '11 days'),
(2, 13, 3, NOW() - INTERVAL '10 days'),
(2, 7,  NULL, NOW() - INTERVAL '9 days'),
(2, 20, 1, NOW() - INTERVAL '8 days'),
(2, 24, NULL, NOW() - INTERVAL '7 days'),
(2, 4,  NULL, NOW() - INTERVAL '6 days'),
(2, 11, 2, NOW() - INTERVAL '5 days'),
(2, 6,  3, NOW() - INTERVAL '4 days'),
(2, 13, NULL, NOW() - INTERVAL '3 days'),
(2, 22, 3, NOW() - INTERVAL '2 days'),
(2, 7,  1, NOW() - INTERVAL '1 day'),
(3, 20, 4, NOW() - INTERVAL '13 days'),
(3, 15, 5, NOW() - INTERVAL '11 days'),
(3, 22, 4, NOW() - INTERVAL '10 days'),
(3, 12, 5, NOW() - INTERVAL '8 days'),
(3, 7,  6, NOW() - INTERVAL '7 days'),
(3, 21, 4, NOW() - INTERVAL '6 days'),
(3, 10, 4, NOW() - INTERVAL '5 days'),
(3, 14, 5, NOW() - INTERVAL '4 days'),
(3, 4,  6, NOW() - INTERVAL '3 days'),
(3, 11, 5, NOW() - INTERVAL '2 days'),
(3, 20, NULL, NOW() - INTERVAL '1 day');

-- Ratings
INSERT INTO ratings (user_id, dish_id, score, comment) VALUES
(2, 4,  5, 'Jak u babci — najlepsze pierogi na świecie!'),
(2, 6,  5, 'Najlepsza carbonara jaką jadłem, nie do pobicia'),
(2, 7,  4, 'Prosta, ale idealna. Ciasto cienkie i chrupiące'),
(2, 11, 5, 'Bulion gotowany całą noc — robi różnicę'),
(2, 13, 4, 'Szybkie i smaczne, idealne na szybki obiad'),
(2, 20, 5, 'Curry które uzależnia. Mleko kokosowe to klucz'),
(2, 22, 4, 'Zdrowe i sycące, polecam sos tahini'),
(2, 24, 5, 'Smash burger lepszy niż z restauracji!'),
(2, 1,  3, 'Dobry ale musiał się dusić dłużej'),
(2, 3,  4, 'Klasyk. Chrupiąca panierka, soczyste mięso'),
(3, 7,  5, 'Prosta i pyszna, robię co tydzień'),
(3, 10, 5, 'Najlepszy tiramisu jaki jadłam — obowiązkowy!'),
(3, 12, 4, 'Świeże i delikatne, dobry jakościowo łosoś'),
(3, 14, 5, 'Gyoza z restauracji sushi — pyszne!'),
(3, 15, 4, 'Kolorowe i zdrowe, sos gochujang konieczny'),
(3, 20, 5, 'Ulubione danie! Zawsze wychodzi perfekcyjnie'),
(3, 21, 4, 'Pyszny falafel, hummus domowy robi robotę'),
(3, 22, 5, 'Buddha bowl to mój nowy ulubiony lunch'),
(3, 4,  4, 'Klasyczne polskie pierogi, zawsze dobre'),
(3, 9,  5, 'Lasagne wymaga czasu ale warto każdej minuty');
