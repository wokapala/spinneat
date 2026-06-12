'use strict';

const Pages = window.Pages || {};

Pages.home = async function(container) {
    if (!Auth.isLoggedIn()) {
        _renderHeroGuest(container);
        return;
    }
    _renderSpinPage(container);
};

/* ── GUEST HERO ── */
function _renderHeroGuest(container) {
    container.innerHTML = `
        <section style="text-align:center; padding: 3rem 0 2rem;">
            <h1 style="font-family:var(--font-headline);font-size:clamp(2rem,8vw,3rem);font-weight:800;letter-spacing:-.03em;line-height:1.1;color:var(--clr-on-bg);margin-bottom:.75rem;">
                ${esc(t('home.hero_title'))}
            </h1>
            <p style="color:var(--clr-on-surface-var);font-size:1.0625rem;margin-bottom:2.5rem;max-width:360px;margin-left:auto;margin-right:auto;">
                ${esc(t('home.hero_subtitle'))}
            </p>
            <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn--primary btn--xl btn--pill" data-page="register">${esc(t('home.start_now'))}</button>
                <button class="btn btn--secondary btn--xl btn--pill" data-page="dishes">${esc(t('home.browse'))}</button>
            </div>
        </section>

        <section style="margin-top:3rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
            ${_featureCell('auto_awesome', t('home.feature_spin_title'),    t('home.feature_spin_sub'),    'primary')}
            ${_featureCell('format_list_bulleted', t('home.feature_lists_title'),  t('home.feature_lists_sub'),  'surface')}
            ${_featureCell('star', t('home.feature_ratings_title'), t('home.feature_ratings_sub'), 'surface')}
        </section>
    `;
}

function _featureCell(icon, title, sub, type) {
    return `
        <div class="bento-cell bento-cell--${type}">
            <span class="material-symbols-outlined bento-cell__icon">${icon}</span>
            <div>
                <p class="bento-cell__title">${esc(title)}</p>
                <p class="bento-cell__sub">${esc(sub)}</p>
            </div>
        </div>
    `;
}

/* ── LOGGED IN: SPIN PAGE ── */
async function _renderSpinPage(container) {
    container.innerHTML = `
        <section class="wheel-section">
            <div class="wheel-ambient"></div>
            <div class="carousel-wrap" id="carouselWrap">
                <div class="carousel-pointer" aria-hidden="true"></div>
                <div class="carousel-viewport" id="carouselViewport">
                    <div class="carousel-strip"></div>
                </div>
                <div class="carousel-fade carousel-fade--left"></div>
                <div class="carousel-fade carousel-fade--right"></div>
            </div>
            <div class="wheel-filters" id="wheelFilters">
                <select id="spinCategory" style="padding:.4rem .9rem;background:var(--clr-surface-lowest);border:none;border-radius:var(--radius-full);font-family:var(--font-body);font-size:.8125rem;color:var(--clr-on-surface);cursor:pointer;outline:none;box-shadow:var(--shadow-card);">
                    <option value="">${esc(t('spin.all_categories'))}</option>
                </select>
                <select id="spinList" style="padding:.4rem .9rem;background:var(--clr-surface-lowest);border:none;border-radius:var(--radius-full);font-family:var(--font-body);font-size:.8125rem;color:var(--clr-on-surface);cursor:pointer;outline:none;box-shadow:var(--shadow-card);">
                    <option value="">${esc(t('spin.all_dishes'))}</option>
                </select>
            </div>
            <button class="wheel-spin-btn" id="spinBtn" disabled>
                ${esc(t('spin.button'))} <span class="material-symbols-outlined">autorenew</span>
            </button>
        </section>
        <div id="spinResult"></div>

        <section style="margin-top:2.5rem;">
            <div class="section-header">
                <h2>${esc(t('home.chefs_picks'))}</h2>
                <button class="section-header__action" data-page="dishes">${esc(t('home.view_all'))}</button>
            </div>
            <div id="homeCards" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>
            </div>
        </section>
    `;

    await _loadHomeData();
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = false;
    spinBtn.addEventListener('click', _onSpin);
}

async function _loadHomeData() {
    try {
        const [dishRes, catRes, listRes] = await Promise.all([
            API.dishes.list(),
            API.categories.list(),
            API.lists.list().catch(() => ({ data: [] })),
        ]);

        const dishes = dishRes.data || [];
        const cats   = catRes.data  || [];
        const lists  = listRes.data || [];

        // Populate selects
        const catSel  = document.getElementById('spinCategory');
        const listSel = document.getElementById('spinList');
        cats.forEach(c  => catSel?.insertAdjacentHTML('beforeend',  `<option value="${esc(c.id)}">${esc(c.icon || '')} ${esc(c.name)}</option>`));
        lists.forEach(l => listSel?.insertAdjacentHTML('beforeend', `<option value="${esc(l.id)}">${esc(l.name)}</option>`));

        // Init carousel
        const viewport = document.getElementById('carouselViewport');
        if (viewport) Wheel.init(viewport, dishes.slice(0, 24).map(d => ({ ...d, label: d.name })));

        // Update wheel when filters change
        const catSel2  = document.getElementById('spinCategory');
        const listSel2 = document.getElementById('spinList');
        catSel2?.addEventListener('change',  () => _updateWheel());
        listSel2?.addEventListener('change', () => _updateWheel());

        // Feature cards
        _renderHomeCards(dishes.slice(0, 4));
    } catch (err) {
        document.getElementById('homeCards').innerHTML = `<p class="text-muted">${esc(t('error.prefix'))}${esc(err.message)}</p>`;
    }
}

async function _updateWheel() {
    const catId  = document.getElementById('spinCategory')?.value || null;
    const listId = document.getElementById('spinList')?.value   || null;

    try {
        let dishes = [];
        if (listId) {
            const res = await API.lists.get(parseInt(listId));
            dishes = res.data?.dishes || [];
        } else {
            const params = catId ? { category_id: parseInt(catId) } : {};
            const res = await API.dishes.list(params);
            dishes = res.data || [];
        }
        Wheel.setSegments(dishes.slice(0, 24).map(d => ({ ...d, label: d.name })));
    } catch {
        Toast.show(t('error.carousel_update'), 'error');
    }
}

function _renderHomeCards(dishes) {
    const container = document.getElementById('homeCards');
    if (!container || !dishes.length) return;

    const [first, ...rest] = dishes;
    container.innerHTML = `
        <!-- big feature card -->
        <div class="feature-card" style="grid-column:1/-1">
            <div class="feature-card__img-wrap">
                <div class="feature-card__img">${esc(first.category_icon || '🍽️')}</div>
                <div class="feature-card__tag">${esc(t('home.trending'))}</div>
            </div>
            <div class="feature-card__body">
                <div class="feature-card__header">
                    <h4 class="feature-card__name">${esc(first.name)}</h4>
                    <button style="background:none;border:none;cursor:pointer;color:var(--clr-outline-var);" class="fav-btn" data-id="${esc(first.id)}">
                        <span class="material-symbols-outlined">favorite</span>
                    </button>
                </div>
                <div class="feature-card__meta">
                    ${first.prep_time ? `<div class="feature-card__meta-item"><span class="material-symbols-outlined">schedule</span> ${esc(first.prep_time)} min</div>` : ''}
                    ${first.difficulty ? `<div class="feature-card__meta-item"><span class="material-symbols-outlined">local_fire_department</span> ${esc(_diffLabel(first.difficulty))}</div>` : ''}
                </div>
            </div>
        </div>
        <!-- small cards -->
        ${rest.slice(0,2).map(d => `
            <div class="small-card">
                <div class="small-card__img">${esc(d.category_icon || '🍽️')}</div>
                <div class="small-card__body">
                    <p class="small-card__name">${esc(d.name)}</p>
                    <div class="small-card__footer">
                        <span class="small-card__label small-card__label--quick">${esc(d.category_name || '')}</span>
                        <span class="material-symbols-outlined" style="color:var(--clr-outline-var);font-size:1.1rem;">add_circle</span>
                    </div>
                </div>
            </div>
        `).join('')}
    `;

    // Fav buttons
    container.querySelectorAll('.fav-btn').forEach(btn =>
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            if (!Auth.isLoggedIn()) { Toast.show(t('nav.login'), 'info'); return; }
            try {
                await API.dishes.addFavorite(parseInt(btn.dataset.id));
                btn.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24";
                btn.style.color = 'var(--clr-primary)';
                Toast.show(t('toast.added_to_favorites'), 'success');
            } catch (err) { Toast.show(err.message, 'error'); }
        })
    );
}

async function _onSpin() {
    const btn    = document.getElementById('spinBtn');
    const listId = document.getElementById('spinList')?.value   || null;
    const catId  = document.getElementById('spinCategory')?.value || null;

    btn.disabled = true;

    const prevResult = document.getElementById('spinResult');
    if (prevResult) prevResult.innerHTML = '';

    try {
        const res  = await API.spin.spin({
            list_id:     listId ? parseInt(listId) : undefined,
            category_id: catId  ? parseInt(catId)  : undefined,
        });
        const dish = res.data?.dish;
        if (!dish) throw new Error(t('error.no_dishes'));

        const targetId = Wheel.ensureSegment(dish);

        const started = Wheel.spin(() => {
            btn.disabled = false;
            _showResult(dish);
        }, targetId);

        if (!started) btn.disabled = false;
    } catch (err) {
        Toast.show(err.message || t('error.spin_failed'), 'error');
        btn.disabled = false;
    }
}

function _showResult(dish) {
    const el = document.getElementById('spinResult');
    if (!el) return;

    el.innerHTML = `
        <div class="result-card" style="position:relative;">
            <div class="result-ambient"></div>
            <div class="confetti-piece" style="top:10%;left:12%;transform:rotate(15deg)"></div>
            <div class="confetti-piece" style="top:20%;right:10%;background:#a63300;transform:rotate(-25deg)"></div>

            <div class="result-card__badge">
                <span>${esc(dish.category_icon || '🍽️')}</span>
                <span class="material-symbols-outlined">auto_awesome</span>
            </div>
            <p class="result-card__label">${esc(t('spin.result_label'))}</p>
            <h2 class="result-card__title">${esc(dish.dish_name || dish.name)}</h2>

            <div class="result-card__actions">
                <button class="btn btn--primary btn--full" id="eatBtn">
                    ${esc(t('spin.eat_button'))} <span class="material-symbols-outlined">check_circle</span>
                </button>
                <button class="btn btn--secondary btn--full" id="spinAgainBtn">
                    ${esc(t('spin.again_button'))}
                </button>
            </div>
            <button class="result-card__footer" id="rateResultBtn">
                <span class="material-symbols-outlined">history</span> ${esc(t('spin.rate_button'))}
            </button>
        </div>
    `;

    document.getElementById('spinAgainBtn').addEventListener('click', () => {
        el.innerHTML = '';
        const target = document.querySelector('.carousel-wrap');
        if (!target) { _onSpin(); return; }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        let spun = false;
        const go = () => {
            if (spun) return;
            spun = true;
            window.removeEventListener('scrollend', go);
            _onSpin();
        };
        window.addEventListener('scrollend', go, { once: true });
        setTimeout(go, 800);
    });
    document.getElementById('eatBtn').addEventListener('click', e => {
        e.currentTarget.disabled = true;
        Toast.show(t('toast.bon_appetit'), 'success');
        el.innerHTML = '';
        const target = document.querySelector('.carousel-wrap');
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('rateResultBtn').addEventListener('click', () => {
        _openRatingModal(dish.dish_id ?? dish.id);
    });

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function _openRatingModal(dishId) {
    Modal.show(`
        <h2 style="font-family:var(--font-headline);font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;">${esc(t('modal.rate_title'))}</h2>
        <form id="ratingForm">
            <div class="form-group">
                <label>${esc(t('modal.rating_label'))}</label>
                <div class="star-input">
                    ${[5,4,3,2,1].map(n => `
                        <input type="radio" name="score" id="star${n}" value="${n}" ${n===5?'checked':''}>
                        <label for="star${n}">★</label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>${esc(t('modal.comment_optional'))}</label>
                <textarea name="comment" rows="3" placeholder="${esc(t('modal.comment_placeholder'))}" maxlength="1000"></textarea>
            </div>
            <button class="btn btn--primary btn--full mt-md" type="submit">${esc(t('modal.save_rating'))}</button>
        </form>
    `);
    document.getElementById('ratingForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await API.ratings.save({ dish_id: dishId, score: parseInt(fd.get('score')), comment: fd.get('comment') || null });
            Modal.hide();
            Toast.show(t('toast.rating_saved'), 'success');
        } catch (err) { Toast.show(err.message, 'error'); }
    });
}

function _diffLabel(d) { return Utils.difficultyLabel(d); }
