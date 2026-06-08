'use strict';

Pages.lists = async function(container) {
    container.innerHTML = `
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">
            <div>
                <h1 style="font-family:var(--font-headline);font-size:2rem;font-weight:800;letter-spacing:-.03em;">Moje listy</h1>
                <p class="text-muted" style="font-size:.875rem;" id="listCount"></p>
            </div>
            <button class="btn btn--primary btn--pill btn--sm" id="newListBtn">
                <span class="material-symbols-outlined">add</span> Nowa
            </button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem;" id="listsContainer">
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
    const el = document.getElementById('listsContainer');
    if (!el) return;

    try {
        const res   = await API.lists.list();
        const items = res.data || [];

        const countEl = document.getElementById('listCount');
        if (countEl) countEl.textContent = `${items.length} list${items.length === 1 ? 'a' : 'y'}`;

        if (!items.length) {
            el.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Nie masz jeszcze żadnych list</p>
                    <button class="btn btn--primary btn--pill mt-md" id="emptyNewListBtn">
                        <span class="material-symbols-outlined">add</span> Utwórz pierwszą
                    </button>
                </div>
            `;
            document.getElementById('emptyNewListBtn')?.addEventListener('click', () =>
                document.getElementById('newListBtn')?.click()
            );
            return;
        }

        el.innerHTML = items.map(l => `
            <div class="list-item-card" data-id="${esc(l.id)}">
                <div class="list-item-card__icon">
                    <span class="material-symbols-outlined">format_list_bulleted</span>
                </div>
                <div class="list-item-card__body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
                        <h3 class="list-item-card__name">${esc(l.name)}</h3>
                        ${l.is_public ? `<span style="font-size:.625rem;font-weight:700;padding:.15rem .5rem;border-radius:var(--radius-full);background:var(--clr-secondary-container);color:var(--clr-on-secondary-container);flex-shrink:0;">Publiczna</span>` : ''}
                    </div>
                    <p class="list-item-card__meta">
                        <span class="material-symbols-outlined" style="font-size:.875rem;vertical-align:middle;">restaurant</span>
                        ${esc(l.dish_count || 0)} dań${l.description ? ` · ${esc(l.description)}` : ''}
                    </p>
                </div>
                <div style="display:flex;gap:.375rem;flex-shrink:0;">
                    <button class="btn btn--ghost btn--sm view-list-btn" data-id="${esc(l.id)}" title="Pokaż dania">
                        <span class="material-symbols-outlined">visibility</span>
                    </button>
                    <button class="btn btn--ghost btn--sm edit-list-btn" data-id="${esc(l.id)}" title="Edytuj">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn btn--ghost btn--sm del-list-btn" data-id="${esc(l.id)}" title="Usuń" style="color:#c0392b;">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        el.querySelectorAll('.view-list-btn').forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); _viewList(parseInt(btn.dataset.id)); })
        );
        el.querySelectorAll('.edit-list-btn').forEach(btn =>
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const res  = await API.lists.get(parseInt(btn.dataset.id)).catch(() => null);
                if (!res) return;
                _openListModal(res.data, async data => {
                    try {
                        await API.lists.update(parseInt(btn.dataset.id), data);
                        Toast.show('Lista zaktualizowana', 'success');
                        await _loadLists();
                    } catch (err) { Toast.show(err.message, 'error'); }
                });
            })
        );
        el.querySelectorAll('.del-list-btn').forEach(btn =>
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                if (!confirm('Usunąć listę?')) return;
                try {
                    await API.lists.delete(parseInt(btn.dataset.id));
                    Toast.show('Lista usunięta', 'info');
                    await _loadLists();
                } catch (err) { Toast.show(err.message, 'error'); }
            })
        );
        el.querySelectorAll('.list-item-card').forEach(card =>
            card.addEventListener('click', () => _viewList(parseInt(card.dataset.id)))
        );
    } catch (err) {
        el.innerHTML = `<p class="text-muted">Błąd: ${esc(err.message)}</p>`;
    }
}

async function _viewList(id) {
    const res  = await API.lists.get(id).catch(() => null);
    if (!res) { Toast.show('Nie znaleziono listy', 'error'); return; }
    const list = res.data;

    Modal.show(`
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem;">
            <div style="width:3rem;height:3rem;border-radius:var(--radius-md);background:var(--clr-primary-container);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span class="material-symbols-outlined" style="color:var(--clr-on-primary);">format_list_bulleted</span>
            </div>
            <div>
                <h2 style="font-family:var(--font-headline);font-size:1.25rem;font-weight:800;margin:0;">${esc(list.name)}</h2>
                ${list.description ? `<p style="color:var(--clr-on-surface-var);font-size:.875rem;margin:0;">${esc(list.description)}</p>` : ''}
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:.5rem;max-height:340px;overflow-y:auto;margin-bottom:1.25rem;" id="listDishRows">
            ${(list.dishes || []).length ? (list.dishes || []).map(d => `
                <div style="display:flex;align-items:center;gap:.75rem;padding:.625rem;background:var(--clr-surface-low);border-radius:var(--radius-md);">
                    <span style="font-size:1.5rem;">${esc(d.category_icon || '🍽️')}</span>
                    <div style="flex:1;min-width:0;">
                        <p style="font-weight:600;font-size:.9375rem;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(d.name)}</p>
                        <p style="color:var(--clr-on-surface-var);font-size:.75rem;margin:0;">${esc(d.category_name || '')}</p>
                    </div>
                    <button class="btn btn--ghost btn--sm remove-dish-btn" data-listid="${esc(id)}" data-dishid="${esc(d.id)}" style="color:#c0392b;flex-shrink:0;">
                        <span class="material-symbols-outlined" style="font-size:1.1rem;">close</span>
                    </button>
                </div>
            `).join('') : '<p style="color:var(--clr-on-surface-var);text-align:center;padding:1.5rem 0;">Lista jest pusta</p>'}
        </div>

        <button class="btn btn--secondary btn--full btn--pill" id="addDishToListBtn">
            <span class="material-symbols-outlined">add</span> Dodaj danie
        </button>
    `);

    document.querySelectorAll('.remove-dish-btn').forEach(btn =>
        btn.addEventListener('click', async () => {
            try {
                await API.lists.removeDish(parseInt(btn.dataset.listid), parseInt(btn.dataset.dishid));
                btn.closest('div[style]').remove();
                Toast.show('Danie usunięte z listy', 'info');
            } catch (err) { Toast.show(err.message, 'error'); }
        })
    );

    document.getElementById('addDishToListBtn')?.addEventListener('click', async () => {
        const dishRes = await API.dishes.list().catch(() => ({ data: [] }));
        const dishes  = dishRes.data || [];

        Modal.show(`
            <h2 style="font-family:var(--font-headline);font-size:1.25rem;font-weight:800;margin-bottom:1.25rem;">Dodaj danie do listy</h2>
            <div style="display:flex;flex-direction:column;gap:.5rem;max-height:400px;overflow-y:auto;">
                ${dishes.map(d => `
                    <div class="meal-card add-dish-row" data-dishid="${esc(d.id)}" style="cursor:pointer;">
                        <div class="meal-card__emoji">${esc(d.category_icon || '🍽️')}</div>
                        <div class="meal-card__body">
                            <h3 class="meal-card__name" style="font-size:.9375rem;">${esc(d.name)}</h3>
                            <p style="font-size:.75rem;color:var(--clr-on-surface-var);margin:0;">${esc(d.category_name || '')}</p>
                        </div>
                        <span class="material-symbols-outlined" style="color:var(--clr-outline-var);">add_circle</span>
                    </div>
                `).join('')}
            </div>
        `);

        document.querySelectorAll('.add-dish-row').forEach(row =>
            row.addEventListener('click', async () => {
                try {
                    await API.lists.addDish(id, parseInt(row.dataset.dishid));
                    Toast.show('Danie dodane!', 'success');
                    Modal.hide();
                } catch (err) { Toast.show(err.message, 'error'); }
            })
        );
    });
}

function _openListModal(list, onSave) {
    Modal.show(`
        <h2 style="font-family:var(--font-headline);font-size:1.25rem;font-weight:800;margin-bottom:1.5rem;">
            ${list ? 'Edytuj listę' : 'Nowa lista'}
        </h2>
        <form id="listForm">
            <div class="form-group">
                <label>Nazwa *</label>
                <input type="text" name="name" value="${esc(list?.name || '')}" required placeholder="np. Zdrowe obiady" maxlength="200" />
            </div>
            <div class="form-group">
                <label>Opis</label>
                <textarea name="description" rows="2" placeholder="Krótki opis (opcjonalnie)" maxlength="500">${esc(list?.description || '')}</textarea>
            </div>
            <label style="display:flex;align-items:center;gap:.625rem;padding:.75rem;background:var(--clr-surface-low);border-radius:var(--radius-md);cursor:pointer;margin-bottom:1.5rem;">
                <input type="checkbox" name="is_public" ${list?.is_public ? 'checked' : ''} style="width:1.125rem;height:1.125rem;accent-color:var(--clr-primary);" />
                <div>
                    <p style="font-weight:600;font-size:.9375rem;margin:0;">Publiczna lista</p>
                    <p style="font-size:.8125rem;color:var(--clr-on-surface-var);margin:0;">Widoczna dla innych użytkowników</p>
                </div>
            </label>
            <button class="btn btn--primary btn--full btn--pill" type="submit">Zapisz</button>
        </form>
    `);

    document.getElementById('listForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        Modal.hide();
        await onSave({
            name:        fd.get('name'),
            description: fd.get('description') || null,
            is_public:   fd.has('is_public'),
        });
    });
}
