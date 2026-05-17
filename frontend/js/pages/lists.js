'use strict';

Pages.lists = async function(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>📋 Moje listy</h1>
            <button class="btn btn--primary" id="newListBtn">+ Nowa lista</button>
        </div>
        <div class="grid grid--auto" id="listsGrid">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    await _loadLists();

    document.getElementById('newListBtn').addEventListener('click', () => {
        _openListModal(null, async data => {
            try {
                await API.lists.create(data);
                Toast.show('Lista utworzona!', 'success');
                await _loadLists();
            } catch (err) { Toast.show(err.message, 'error'); }
        });
    });
};

async function _loadLists() {
    const grid = document.getElementById('listsGrid');
    if (!grid) return;

    try {
        const res   = await API.lists.list();
        const items = res.data || [];

        if (!items.length) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-icon">📋</div>
                    <p>Brak list. Utwórz pierwszą!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(l => `
            <div class="list-card">
                <div class="list-card__header">
                    <span class="list-card__name">${l.name}</span>
                    <span class="badge">${l.dish_count || 0} dań</span>
                </div>
                <p class="list-card__count text-muted">${l.description || ''}</p>
                ${l.is_public ? '<span class="badge" style="width:fit-content">🌐 Publiczna</span>' : ''}
                <div class="list-card__actions">
                    <button class="btn btn--outline btn--sm view-list-btn" data-id="${l.id}">👁 Pokaż</button>
                    <button class="btn btn--ghost btn--sm edit-list-btn" data-id="${l.id}" data-name="${l.name}" data-desc="${l.description || ''}" data-public="${l.is_public}">✏️ Edytuj</button>
                    <button class="btn btn--danger btn--sm del-list-btn" data-id="${l.id}">🗑</button>
                    <button class="btn btn--secondary btn--sm spin-list-btn" data-id="${l.id}">🎡 Losuj</button>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.view-list-btn').forEach(btn =>
            btn.addEventListener('click', () => _viewList(parseInt(btn.dataset.id)))
        );
        grid.querySelectorAll('.edit-list-btn').forEach(btn =>
            btn.addEventListener('click', () => {
                _openListModal(
                    { id: btn.dataset.id, name: btn.dataset.name, description: btn.dataset.desc, is_public: btn.dataset.public === 'true' },
                    async (data) => {
                        try {
                            await API.lists.update(btn.dataset.id, data);
                            Toast.show('Lista zaktualizowana', 'success');
                            await _loadLists();
                        } catch (err) { Toast.show(err.message, 'error'); }
                    }
                );
            })
        );
        grid.querySelectorAll('.del-list-btn').forEach(btn =>
            btn.addEventListener('click', async () => {
                if (!confirm('Usunąć listę?')) return;
                try {
                    await API.lists.delete(btn.dataset.id);
                    Toast.show('Lista usunięta', 'info');
                    await _loadLists();
                } catch (err) { Toast.show(err.message, 'error'); }
            })
        );
        grid.querySelectorAll('.spin-list-btn').forEach(btn =>
            btn.addEventListener('click', () => App.navigate('home'))
        );
    } catch (err) {
        grid.innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
}

async function _viewList(id) {
    const res  = await API.lists.get(id).catch(() => null);
    if (!res) { Toast.show('Nie znaleziono listy', 'error'); return; }
    const list = res.data;

    Modal.show(`
        <h2 style="margin-bottom:1rem;">${list.name}</h2>
        <p class="text-muted" style="margin-bottom:1rem;">${list.description || ''}</p>
        <div style="display:flex;flex-direction:column;gap:.5rem;max-height:340px;overflow-y:auto;">
            ${(list.dishes || []).map(d => `
                <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem;background:var(--color-bg-card2);border-radius:.5rem;">
                    <span style="font-size:1.4rem">${d.category_icon || '🍽️'}</span>
                    <div>
                        <p style="font-weight:600">${d.name}</p>
                        <p class="text-muted" style="font-size:.8rem">${d.category_name}</p>
                    </div>
                    <button class="btn btn--ghost btn--sm" style="margin-left:auto" data-listid="${id}" data-dishid="${d.id}">✕</button>
                </div>
            `).join('') || '<p class="text-muted">Lista jest pusta</p>'}
        </div>
        <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn btn--outline btn--sm" id="addDishToListBtn">+ Dodaj danie</button>
        </div>
    `);

    document.querySelectorAll('[data-listid]').forEach(btn =>
        btn.addEventListener('click', async () => {
            try {
                await API.lists.removeDish(btn.dataset.listid, btn.dataset.dishid);
                Toast.show('Danie usunięte z listy', 'info');
                _viewList(id);
            } catch (err) { Toast.show(err.message, 'error'); }
        })
    );

    document.getElementById('addDishToListBtn')?.addEventListener('click', async () => {
        const dishRes = await API.dishes.list().catch(() => ({ data: [] }));
        const dishes  = dishRes.data || [];
        const dishId  = prompt(`ID dania do dodania (dostępne: ${dishes.slice(0,5).map(d=>d.id+':'+d.name).join(', ')}…)`);
        if (!dishId) return;
        try {
            await API.lists.addDish(id, parseInt(dishId));
            Toast.show('Dodano!', 'success');
            _viewList(id);
        } catch (err) { Toast.show(err.message, 'error'); }
    });
}

function _openListModal(list, onSave) {
    Modal.show(`
        <h2 style="margin-bottom:1.5rem;">${list ? 'Edytuj listę' : 'Nowa lista'}</h2>
        <form id="listForm">
            <div class="form-group">
                <label>Nazwa *</label>
                <input type="text" name="name" value="${list?.name || ''}" required />
            </div>
            <div class="form-group">
                <label>Opis</label>
                <textarea name="description" rows="2">${list?.description || ''}</textarea>
            </div>
            <div class="form-group" style="flex-direction:row;align-items:center;gap:.75rem;">
                <input type="checkbox" name="is_public" id="listPublic" ${list?.is_public ? 'checked' : ''} />
                <label for="listPublic">Publiczna lista</label>
            </div>
            <button class="btn btn--primary btn--full mt-md" type="submit">Zapisz</button>
        </form>
    `);

    document.getElementById('listForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        Modal.hide();
        await onSave({
            name:       fd.get('name'),
            description: fd.get('description') || null,
            is_public:  fd.has('is_public'),
        });
    });
}
