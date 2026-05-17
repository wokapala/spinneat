'use strict';

const Pages = window.Pages || {};

Pages.home = async function(container) {
    // Hero
    if (!Auth.isLoggedIn()) {
        container.innerHTML = `
            <section class="hero">
                <h1 class="hero__title">Nie wiesz co jeść?<br/>Zakręć kołem! 🎡</h1>
                <p class="hero__sub">Spin & Eat losuje danie spośród setek przepisów. Koniec z codziennym dylematem – co na obiad?</p>
                <div class="hero__actions">
                    <button class="btn btn--primary btn--xl" data-page="register">Zacznij teraz</button>
                    <button class="btn btn--outline btn--xl" data-page="dishes">Przeglądaj dania</button>
                </div>
            </section>
            <section style="margin-top: 3rem;">
                <div class="grid grid--3" style="gap:1.5rem; max-width:700px; margin:0 auto;">
                    ${_featureCard('🎡', 'Losowanie', 'Zakręć kołem i odkryj dzisiejsze danie')}
                    ${_featureCard('📋', 'Własne listy', 'Twórz listy ulubionych dań')}
                    ${_featureCard('⭐', 'Oceny', 'Oceniaj co jadłeś i śledź historię')}
                </div>
            </section>
        `;
        return;
    }

    // Logged in – show the wheel
    container.innerHTML = `
        <div class="page-header">
            <h1>Dzień dobry, ${Auth.get().name}! 👋</h1>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:2rem; align-items:flex-start; justify-content:center;">
            <div class="wheel-wrapper">
                <p class="text-muted" style="font-size:.9rem; margin-bottom:.5rem;">Filtruj:</p>
                <div class="wheel-filters" id="wheelFilters">
                    <select id="spinCategory" class="search-bar" style="flex:none; padding:.5rem 1rem;">
                        <option value="">Wszystkie kategorie</option>
                    </select>
                    <select id="spinList" class="search-bar" style="flex:none; padding:.5rem 1rem;">
                        <option value="">Z całej bazy</option>
                    </select>
                </div>
                <div class="wheel-canvas-wrap">
                    <div class="wheel-pointer">▼</div>
                    <canvas id="wheelCanvas"></canvas>
                </div>
                <button class="btn btn--primary btn--xl" id="spinBtn">🎡 Losuj!</button>
            </div>
            <div id="spinResult" style="max-width:420px; width:100%; display:flex; flex-direction:column; gap:1rem;"></div>
        </div>
    `;

    await _loadFilters();
    _initWheel();
    _bindSpin();
};

function _featureCard(icon, title, desc) {
    return `
        <div class="card" style="text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:.75rem;">${icon}</div>
            <h3 style="margin-bottom:.4rem;">${title}</h3>
            <p class="text-muted" style="font-size:.875rem;">${desc}</p>
        </div>
    `;
}

async function _loadFilters() {
    const [catRes, listRes, dishRes] = await Promise.all([
        API.categories.list().catch(() => ({ data: [] })),
        API.lists.list().catch(() => ({ data: [] })),
        API.dishes.list().catch(() => ({ data: [] })),
    ]);

    const catSel  = document.getElementById('spinCategory');
    const listSel = document.getElementById('spinList');

    (catRes.data || []).forEach(c => {
        catSel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`);
    });

    (listRes.data || []).forEach(l => {
        listSel.insertAdjacentHTML('beforeend', `<option value="${l.id}">${l.name}</option>`);
    });

    // Initial wheel segments from all dishes
    _refreshWheel(dishRes.data || [], catRes.data || []);

    catSel.addEventListener('change',  () => _onFilterChange(catRes.data || []));
    listSel.addEventListener('change', () => _onFilterChange(catRes.data || []));
}

async function _onFilterChange(allCats) {
    const catId  = document.getElementById('spinCategory').value;
    const listId = document.getElementById('spinList').value;
    try {
        const params = {};
        if (catId) params.category_id = catId;
        const res = await API.dishes.list(params);
        _refreshWheel(res.data || [], allCats);
    } catch {}
}

function _refreshWheel(dishes, categories) {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    const segments = dishes.slice(0, 12).map(d => ({
        label: d.name,
        color: d.category_color || '#FF6B35',
        icon:  d.category_icon  || '🍽️',
        id:    d.id,
    }));
    Wheel.init(canvas, segments);
}

function _initWheel() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    Wheel.init(canvas, []);
}

function _bindSpin() {
    const btn = document.getElementById('spinBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const canvas = document.getElementById('wheelCanvas');
        if (canvas) canvas.classList.add('spinning');
        btn.disabled = true;

        const listId = document.getElementById('spinList')?.value || null;
        const catId  = document.getElementById('spinCategory')?.value || null;

        try {
            // Call API spin
            const res = await API.spin.spin({
                list_id:     listId ? parseInt(listId) : undefined,
                category_id: catId  ? parseInt(catId)  : undefined,
            });

            const dish = res.data?.dish;
            if (!dish) throw new Error('Brak wyniku');

            // Animate wheel
            Wheel.spin(() => {
                _showResult(dish, res.data?.history);
                if (canvas) canvas.classList.remove('spinning');
                btn.disabled = false;
            });
        } catch (err) {
            Toast.show(err.message || 'Błąd losowania', 'error');
            if (canvas) canvas.classList.remove('spinning');
            btn.disabled = false;
        }
    });
}

function _showResult(dish, history) {
    const container = document.getElementById('spinResult');
    if (!container) return;

    container.innerHTML = `
        <div class="result-card">
            <div class="result-card__emoji">${dish.category_icon || '🍽️'}</div>
            <h2 class="result-card__title">${dish.dish_name || dish.name}</h2>
            <p class="result-card__category">${dish.category || ''}</p>
            <div class="result-card__actions">
                <button class="btn btn--primary" onclick="App.navigate('dishes')">
                    📖 Przepis
                </button>
                <button class="btn btn--outline" id="rateSpinBtn">
                    ⭐ Oceń
                </button>
                <button class="btn btn--ghost" onclick="App.navigate('history')">
                    📜 Historia
                </button>
            </div>
        </div>
    `;

    const rateBtn = document.getElementById('rateSpinBtn');
    if (rateBtn) {
        rateBtn.addEventListener('click', () => _openRatingModal(dish.dish_id));
    }
}

function _openRatingModal(dishId) {
    Modal.show(`
        <h2 style="margin-bottom:1.5rem;">Oceń danie ⭐</h2>
        <form id="ratingForm">
            <div class="form-group">
                <label>Ocena</label>
                <div class="star-input">
                    ${[5,4,3,2,1].map(n => `
                        <input type="radio" name="score" id="star${n}" value="${n}" ${n===5?'checked':''}>
                        <label for="star${n}">★</label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Komentarz (opcjonalnie)</label>
                <textarea name="comment" rows="3" placeholder="Jak smakowało?"></textarea>
            </div>
            <button class="btn btn--primary btn--full" type="submit">Zapisz ocenę</button>
        </form>
    `);

    document.getElementById('ratingForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd    = new FormData(e.target);
        const score = parseInt(fd.get('score'));
        try {
            await API.ratings.save({ dish_id: dishId, score, comment: fd.get('comment') || null });
            Modal.hide();
            Toast.show('Ocena zapisana!', 'success');
        } catch (err) {
            Toast.show(err.message, 'error');
        }
    });
}
