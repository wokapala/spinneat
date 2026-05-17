'use strict';

Pages.admin = async function(container) {
    container.innerHTML = `
        <div style="margin-bottom:1.5rem;">
            <h1 style="font-family:var(--font-headline);font-size:2rem;font-weight:800;letter-spacing:-.03em;">Panel admina</h1>
            <p class="text-muted" style="font-size:.875rem;">Zarządzaj użytkownikami i kategoriami</p>
        </div>
        <div class="chips-scroll" id="adminTabs" style="margin-bottom:1.25rem;">
            <button class="chip active" data-tab="users">
                <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">group</span> Użytkownicy
            </button>
            <button class="chip" data-tab="categories">
                <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">category</span> Kategorie
            </button>
        </div>
        <div id="adminContent">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    document.getElementById('adminTabs').addEventListener('click', e => {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        document.querySelectorAll('#adminTabs .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        btn.dataset.tab === 'users' ? _loadUsers() : _loadCategories();
    });

    _loadUsers();
};

async function _loadUsers() {
    const el = document.getElementById('adminContent');
    el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
        const res   = await API.admin.users();
        const users = res.data || [];

        el.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:.625rem;">
                ${users.map(u => `
                    <div class="admin-user-row">
                        <div class="admin-user-row__avatar">
                            ${_initials(u.name)}
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
                                <p style="font-weight:600;font-size:.9375rem;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}</p>
                                <span class="admin-role-badge admin-role-badge--${u.role}">${u.role}</span>
                            </div>
                            <p style="color:var(--clr-on-surface-var);font-size:.8125rem;margin:0;">${u.email}</p>
                            <p style="color:var(--clr-on-surface-var);font-size:.75rem;margin:.1rem 0 0;">
                                <span class="material-symbols-outlined" style="font-size:.875rem;vertical-align:middle;">autorenew</span> ${u.total_spins || 0} spinów
                                &nbsp;·&nbsp;
                                <span class="material-symbols-outlined" style="font-size:.875rem;vertical-align:middle;">favorite</span> ${u.total_favorites || 0} ulubionych
                            </p>
                        </div>
                        <div style="display:flex;gap:.375rem;flex-shrink:0;">
                            <button class="btn btn--secondary btn--sm role-btn" data-id="${u.id}" data-role="${u.role}" title="${u.role === 'admin' ? 'Degraduj do user' : 'Nadaj uprawnienia admin'}">
                                <span class="material-symbols-outlined" style="font-size:1rem;">${u.role === 'admin' ? 'arrow_downward' : 'arrow_upward'}</span>
                            </button>
                            <button class="btn btn--ghost btn--sm del-user-btn" data-id="${u.id}" title="Usuń użytkownika" style="color:#c0392b;">
                                <span class="material-symbols-outlined" style="font-size:1rem;">delete</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        el.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newRole = btn.dataset.role === 'admin' ? 'user' : 'admin';
                try {
                    await API.admin.updateUser(parseInt(btn.dataset.id), { role: newRole });
                    Toast.show('Rola zmieniona', 'success');
                    _loadUsers();
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });

        el.querySelectorAll('.del-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Na pewno usunąć użytkownika? Tej operacji nie można cofnąć.')) return;
                try {
                    await API.admin.deleteUser(parseInt(btn.dataset.id));
                    Toast.show('Użytkownik usunięty', 'info');
                    _loadUsers();
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });
    } catch (err) {
        el.innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
}

async function _loadCategories() {
    const el = document.getElementById('adminContent');
    el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
        const res  = await API.categories.list();
        const cats = res.data || [];

        el.innerHTML = `
            <div style="margin-bottom:1rem;">
                <button class="btn btn--primary btn--pill btn--sm" id="addCatBtn">
                    <span class="material-symbols-outlined">add</span> Dodaj kategorię
                </button>
            </div>
            <div style="display:flex;flex-direction:column;gap:.625rem;">
                ${cats.map(c => `
                    <div style="display:flex;align-items:center;gap:.875rem;padding:.875rem 1rem;background:var(--clr-surface-lowest);border-radius:var(--radius-md);box-shadow:var(--shadow-card);">
                        <div style="width:2.75rem;height:2.75rem;border-radius:var(--radius-md);background:var(--clr-surface-low);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">
                            ${c.icon || '📁'}
                        </div>
                        <div style="flex:1;min-width:0;">
                            <p style="font-weight:600;font-size:.9375rem;margin:0;">${c.name}</p>
                            ${c.description ? `<p style="color:var(--clr-on-surface-var);font-size:.8125rem;margin:0;">${c.description}</p>` : ''}
                        </div>
                        ${c.color ? `<div style="width:1.25rem;height:1.25rem;border-radius:50%;background:${c.color};flex-shrink:0;"></div>` : ''}
                        <button class="btn btn--ghost btn--sm del-cat-btn" data-id="${c.id}" style="color:#c0392b;flex-shrink:0;">
                            <span class="material-symbols-outlined" style="font-size:1rem;">delete</span>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('addCatBtn').addEventListener('click', () => {
            Modal.show(`
                <h2 style="font-family:var(--font-headline);font-size:1.25rem;font-weight:800;margin-bottom:1.5rem;">Nowa kategoria</h2>
                <form id="catForm">
                    <div class="form-group"><label>Nazwa *</label><input type="text" name="name" required placeholder="np. Makarony" /></div>
                    <div class="form-group"><label>Ikona (emoji)</label><input type="text" name="icon" placeholder="🍕" maxlength="4" /></div>
                    <div class="form-group"><label>Kolor akcentu</label>
                        <div style="display:flex;align-items:center;gap:.75rem;">
                            <input type="color" name="color" value="#ff7949" style="width:3rem;height:2.5rem;border:none;background:none;cursor:pointer;padding:0;" />
                            <span style="font-size:.875rem;color:var(--clr-on-surface-var);">Wybierz kolor kategorii</span>
                        </div>
                    </div>
                    <div class="form-group"><label>Opis</label><textarea name="description" rows="2" placeholder="Krótki opis (opcjonalnie)"></textarea></div>
                    <button class="btn btn--primary btn--full btn--pill mt-md" type="submit">Dodaj kategorię</button>
                </form>
            `);
            document.getElementById('catForm').addEventListener('submit', async e => {
                e.preventDefault();
                const fd = new FormData(e.target);
                try {
                    await API.categories.create({
                        name:        fd.get('name'),
                        icon:        fd.get('icon') || null,
                        color:       fd.get('color'),
                        description: fd.get('description') || null,
                    });
                    Modal.hide();
                    Toast.show('Kategoria dodana!', 'success');
                    _loadCategories();
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });

        el.querySelectorAll('.del-cat-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Usunąć kategorię? Powiązane dania stracą kategorię.')) return;
                try {
                    await API.categories.delete(parseInt(btn.dataset.id));
                    Toast.show('Kategoria usunięta', 'info');
                    _loadCategories();
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });
    } catch (err) {
        el.innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
}

function _initials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
