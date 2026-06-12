'use strict';

let _dishesOnRated = null;

Pages.dishes = async function(container) {
    container.innerHTML = `
        <div style="margin-bottom:1.5rem;">
            <h1 style="font-family:var(--font-headline);font-size:2rem;font-weight:800;letter-spacing:-.03em;">${esc(t('dishes.title'))}</h1>
            <p class="text-muted" style="font-size:.875rem;" id="dishCount"></p>
        </div>
        <div class="search-wrap">
            <span class="material-symbols-outlined">search</span>
            <input class="search-input" id="dishSearch" type="text" placeholder="${esc(t('dishes.search_placeholder'))}" />
        </div>
        <div class="chips-scroll" id="catChips">
            <button class="chip active" data-cat="">${esc(t('dishes.all_chip'))}</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem;margin-top:1.25rem;" id="dishList">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    let allDishes = [], allCats = [];

    try {
        const [dishRes, catRes] = await Promise.all([API.dishes.list(), API.categories.list()]);
        allDishes = dishRes.data || [];
        allCats   = catRes.data  || [];

        document.getElementById('dishCount').textContent = `${allDishes.length} ${t('dishes.count_suffix')}`;

        // Category chips
        const chips = document.getElementById('catChips');
        allCats.forEach(c => chips.insertAdjacentHTML('beforeend',
            `<button class="chip" data-cat="${esc(c.id)}">${esc(c.icon || '')} ${esc(c.name)}</button>`
        ));

        _dishesOnRated = async () => {
            const fresh = await API.dishes.list().catch(() => null);
            if (!fresh) return;
            allDishes = fresh.data || [];
            document.getElementById('dishCount').textContent = `${allDishes.length} ${t('dishes.count_suffix')}`;
            _filter(allDishes);
        };

        _renderList(allDishes);
    } catch (err) {
        document.getElementById('dishList').innerHTML = `<p class="text-muted">${esc(t('error.prefix'))}${esc(err.message)}</p>`;
    }

    // Search
    let debounce;
    document.getElementById('dishSearch').addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => _filter(allDishes), 280);
    });

    // Chips
    document.getElementById('catChips').addEventListener('click', e => {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        document.querySelectorAll('#catChips .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        _filter(allDishes);
    });

    // FAB add dish (logged in)
    if (Auth.isLoggedIn()) {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = '<span class="material-symbols-outlined">add</span>';
        fab.addEventListener('click', () => _openDishModal(allCats, async data => {
            try {
                const res = await API.dishes.create(data);
                allDishes.unshift(res.data);
                document.getElementById('dishCount').textContent = `${allDishes.length} ${t('dishes.count_suffix')}`;
                _renderList(allDishes);
                Toast.show(t('toast.dish_added'), 'success');
            } catch (err) { Toast.show(err.message, 'error'); }
        }));
        container.appendChild(fab);
    }
};

function _filter(dishes) {
    const search = document.getElementById('dishSearch').value.toLowerCase();
    const catId  = document.querySelector('#catChips .chip.active')?.dataset.cat || '';
    const filtered = dishes.filter(d =>
        (!search || d.name.toLowerCase().includes(search) || (d.description || '').toLowerCase().includes(search)) &&
        (!catId  || String(d.category_id) === catId)
    );
    _renderList(filtered);
}

function _renderList(dishes) {
    const list = document.getElementById('dishList');
    if (!dishes.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <p>${esc(t('dishes.empty'))}</p>
            </div>`;
        return;
    }
    list.innerHTML = dishes.map(d => `
        <div class="meal-card" data-id="${esc(d.id)}">
            <div class="meal-card__emoji">${esc(d.category_icon || '🍽️')}</div>
            <div class="meal-card__body">
                <div class="meal-card__header">
                    <h3 class="meal-card__name">${esc(d.name)}</h3>
                    <span class="meal-card__tag">${esc(d.category_name || '')}</span>
                </div>
                <div class="meal-card__meta">
                    ${d.prep_time ? `<div class="meal-card__meta-item"><span class="material-symbols-outlined">schedule</span>${esc(d.prep_time)} min</div>` : ''}
                    ${d.difficulty ? `<div class="meal-card__meta-item"><span class="material-symbols-outlined">local_fire_department</span>${esc(_diff(d.difficulty))}</div>` : ''}
                    ${d.spin_count > 0 ? `<div class="meal-card__meta-item"><span class="material-symbols-outlined">autorenew</span>${esc(d.spin_count)}</div>` : ''}
                    ${parseFloat(d.avg_rating) > 0 ? `<div class="meal-card__meta-item"><span class="material-symbols-outlined" style="color:#f59e0b;">star</span>${esc(parseFloat(d.avg_rating).toFixed(1))}</div>` : ''}
                </div>
            </div>
            <span class="material-symbols-outlined meal-card__chevron">chevron_right</span>
        </div>
    `).join('');

    list.querySelectorAll('.meal-card').forEach(card => {
        card.addEventListener('click', () => _openDishDetail(parseInt(card.dataset.id), _dishesOnRated));
    });
}

async function _openDishDetail(id, onRated = null) {
    const res  = await API.dishes.get(id).catch(() => null);
    if (!res) { Toast.show(t('error.dish_not_found'), 'error'); return; }
    const d = res.data;

    Modal.show(`
        <div style="text-align:center;margin-bottom:1.5rem;font-size:4rem;">${esc(d.category_icon || '🍽️')}</div>
        <h2 style="font-family:var(--font-headline);font-size:1.75rem;font-weight:800;margin-bottom:.5rem;">${esc(d.name)}</h2>
        <p style="color:var(--clr-on-surface-var);margin-bottom:1.25rem;">${esc(d.description || '')}</p>
        ${d.instructions ? `
            <h3 style="font-family:var(--font-headline);font-weight:700;margin-bottom:.75rem;">${esc(t('dishes.recipe'))}</h3>
            <p style="font-size:.9rem;line-height:1.7;color:var(--clr-on-surface-var);white-space:pre-wrap;">${esc(d.instructions)}</p>
        ` : ''}
        <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap;">
            ${Auth.isLoggedIn() ? `<button class="btn btn--primary btn--full fav-modal-btn" data-id="${esc(d.id)}">${esc(t('dishes.add_favorite'))}</button>` : ''}
            ${Auth.isLoggedIn() ? `<button class="btn btn--secondary btn--full rate-modal-btn" data-id="${esc(d.id)}">${esc(t('dishes.rate'))}</button>` : ''}
            ${Auth.isAdmin() ? `<button class="btn btn--danger btn--sm del-modal-btn" data-id="${esc(d.id)}">${esc(t('dishes.delete'))}</button>` : ''}
        </div>
    `);

    document.querySelector('.fav-modal-btn')?.addEventListener('click', async e => {
        const id = parseInt(e.currentTarget.dataset.id);
        try { await API.dishes.addFavorite(id); Modal.hide(); Toast.show(t('toast.added_to_favorites_modal'), 'success'); } catch (err) { Toast.show(err.message, 'error'); }
    });
    document.querySelector('.rate-modal-btn')?.addEventListener('click', e => {
        const id = parseInt(e.currentTarget.dataset.id);
        Modal.show(`
            <h2 style="font-family:var(--font-headline);font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;">${esc(t('modal.rate_title_short'))}</h2>
            <form id="rateModalForm">
                <div class="form-group"><label>${esc(t('modal.rating_label'))}</label>
                    <div class="star-input">
                        ${[5,4,3,2,1].map(n=>`<input type="radio" name="score" id="ms${n}" value="${n}" ${n===5?'checked':''}><label for="ms${n}">★</label>`).join('')}
                    </div>
                </div>
                <div class="form-group"><label>${esc(t('modal.comment_label'))}</label><textarea name="comment" rows="3" maxlength="1000"></textarea></div>
                <button class="btn btn--primary btn--full mt-md" type="submit">${esc(t('modal.save'))}</button>
            </form>
        `);
        document.getElementById('rateModalForm').addEventListener('submit', async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await API.ratings.save({ dish_id: id, score: parseInt(fd.get('score')), comment: fd.get('comment') || null });
                Modal.hide();
                Toast.show(t('toast.rating_saved'), 'success');
                if (onRated) await onRated();
            } catch (err) { Toast.show(err.message, 'error'); }
        });
    });
    document.querySelector('.del-modal-btn')?.addEventListener('click', async e => {
        if (!confirm(t('confirm.delete_dish'))) return;
        try { await API.dishes.delete(parseInt(e.currentTarget.dataset.id)); Modal.hide(); Toast.show(t('toast.deleted'), 'info'); } catch (err) { Toast.show(err.message, 'error'); }
    });
}

function _openDishModal(categories, onSave) {
    Modal.show(`
        <h2 style="font-family:var(--font-headline);font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;">${esc(t('dishes.new_dish'))}</h2>
        <form id="dishForm">
            <div class="form-group"><label>${esc(t('form.name_required'))}</label><input type="text" name="name" required maxlength="200" /></div>
            <div class="form-group"><label>${esc(t('form.description'))}</label><textarea name="description" rows="2" maxlength="2000"></textarea></div>
            <div class="form-group"><label>${esc(t('form.category_required'))}</label>
                <select name="category_id" required>
                    ${categories.map(c=>`<option value="${esc(c.id)}">${esc(c.icon||'')} ${esc(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>${esc(t('form.image_url'))}</label><input type="url" name="image_url" placeholder="${esc(t('form.image_url_placeholder'))}" maxlength="500" /></div>
            <button class="btn btn--primary btn--full mt-md" type="submit">${esc(t('dishes.add_dish_button'))}</button>
        </form>
    `);
    document.getElementById('dishForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        Modal.hide();
        await onSave({ name: fd.get('name'), description: fd.get('description') || null, category_id: parseInt(fd.get('category_id')), image_url: fd.get('image_url') || null });
    });
}

function _diff(d) { return { easy: t('diff.easy'), medium: t('diff.medium'), hard: t('diff.hard') }[d] || d; }
