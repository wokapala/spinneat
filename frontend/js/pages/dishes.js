'use strict';

Pages.dishes = async function(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>🍽️ Dania</h1>
            ${Auth.isLoggedIn() ? '<button class="btn btn--primary" id="addDishBtn">+ Dodaj danie</button>' : ''}
        </div>
        <div class="search-bar">
            <input type="text" id="dishSearch" placeholder="Szukaj dania…" />
            <select id="catFilter"><option value="">Wszystkie kategorie</option></select>
        </div>
        <div class="grid grid--auto" id="dishGrid">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    let allDishes = [], allCategories = [];

    try {
        const [dishRes, catRes] = await Promise.all([API.dishes.list(), API.categories.list()]);
        allDishes     = dishRes.data || [];
        allCategories = catRes.data  || [];

        allCategories.forEach(c => {
            document.getElementById('catFilter').insertAdjacentHTML(
                'beforeend', `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`
            );
        });

        _renderDishes(allDishes);
    } catch (err) {
        document.getElementById('dishGrid').innerHTML = `<p class="text-muted">Błąd ładowania: ${err.message}</p>`;
    }

    // Filter handlers
    let debounceT;
    document.getElementById('dishSearch').addEventListener('input', () => {
        clearTimeout(debounceT);
        debounceT = setTimeout(() => _applyFilters(allDishes), 300);
    });
    document.getElementById('catFilter').addEventListener('change', () => _applyFilters(allDishes));

    // Add dish
    document.getElementById('addDishBtn')?.addEventListener('click', () => {
        _openDishModal(null, allCategories, async (data) => {
            try {
                const res = await API.dishes.create(data);
                allDishes.unshift(res.data);
                _renderDishes(allDishes);
                Toast.show('Danie dodane!', 'success');
            } catch (err) {
                Toast.show(err.message, 'error');
            }
        });
    });

    function _applyFilters(dishes) {
        const search = document.getElementById('dishSearch').value.toLowerCase();
        const catId  = document.getElementById('catFilter').value;
        const filtered = dishes.filter(d =>
            (!search || d.name.toLowerCase().includes(search) || (d.description || '').toLowerCase().includes(search)) &&
            (!catId  || String(d.category_id) === catId)
        );
        _renderDishes(filtered);
    }
};

function _renderDishes(dishes) {
    const grid = document.getElementById('dishGrid');
    if (!dishes.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon">🍽️</div>
                <p>Brak dań</p>
            </div>
        `;
        return;
    }
    grid.innerHTML = dishes.map(d => _dishCard(d)).join('');

    // Favorite buttons
    grid.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!Auth.isLoggedIn()) { Toast.show('Zaloguj się, aby dodać do ulubionych', 'info'); return; }
            const id = parseInt(btn.dataset.id);
            const isFav = btn.dataset.fav === '1';
            try {
                if (isFav) {
                    await API.dishes.removeFavorite(id);
                    btn.dataset.fav = '0';
                    btn.textContent = '🤍';
                    Toast.show('Usunięto z ulubionych', 'info');
                } else {
                    await API.dishes.addFavorite(id);
                    btn.dataset.fav = '1';
                    btn.textContent = '❤️';
                    Toast.show('Dodano do ulubionych', 'success');
                }
            } catch (err) { Toast.show(err.message, 'error'); }
        });
    });
}

function _dishCard(d) {
    const stars = d.avg_rating > 0
        ? `<span class="stars">${'★'.repeat(Math.round(d.avg_rating))}${'☆'.repeat(5 - Math.round(d.avg_rating))}</span>`
        : '<span class="text-muted" style="font-size:.75rem;">Brak ocen</span>';

    return `
        <div class="dish-card">
            <div class="dish-card__img">${d.category_icon || '🍽️'}</div>
            <div class="dish-card__body">
                <p class="dish-card__name">${d.name}</p>
                <p class="dish-card__desc">${d.description || ''}</p>
                <div class="dish-card__meta">
                    <span class="badge" style="background:${d.category_color}22;color:${d.category_color}">
                        ${d.category_icon || ''} ${d.category_name}
                    </span>
                    ${stars}
                </div>
                <div class="dish-card__meta">
                    <span class="text-muted" style="font-size:.75rem;">🎡 ${d.spin_count} spinów</span>
                    ${d.difficulty ? `<span class="badge">${_diffLabel(d.difficulty)}</span>` : ''}
                </div>
            </div>
            <div class="dish-card__actions">
                <button class="btn btn--ghost btn--sm fav-btn" data-id="${d.id}" data-fav="0" title="Ulubione">🤍</button>
                ${Auth.isAdmin() ? `<button class="btn btn--danger btn--sm del-btn" data-id="${d.id}">🗑</button>` : ''}
            </div>
        </div>
    `;
}

function _diffLabel(d) {
    return { easy: '🟢 Łatwe', medium: '🟡 Średnie', hard: '🔴 Trudne' }[d] || d;
}

function _openDishModal(dish, categories, onSave) {
    Modal.show(`
        <h2 style="margin-bottom:1.5rem;">${dish ? 'Edytuj danie' : 'Nowe danie'}</h2>
        <form id="dishForm">
            <div class="form-group">
                <label>Nazwa *</label>
                <input type="text" name="name" value="${dish?.name || ''}" required />
            </div>
            <div class="form-group">
                <label>Opis</label>
                <textarea name="description" rows="3">${dish?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Kategoria *</label>
                <select name="category_id" required>
                    ${categories.map(c => `<option value="${c.id}" ${dish?.category_id == c.id ? 'selected' : ''}>${c.icon || ''} ${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>URL obrazka</label>
                <input type="url" name="image_url" value="${dish?.image_url || ''}" placeholder="https://…" />
            </div>
            <button class="btn btn--primary btn--full mt-md" type="submit">Zapisz</button>
        </form>
    `);

    document.getElementById('dishForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            name:        fd.get('name'),
            description: fd.get('description') || null,
            category_id: parseInt(fd.get('category_id')),
            image_url:   fd.get('image_url') || null,
        };
        Modal.hide();
        await onSave(data);
    });
}
