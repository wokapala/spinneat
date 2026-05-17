'use strict';

Pages.admin = async function(container) {
    container.innerHTML = `
        <div class="page-header"><h1>⚙️ Panel administratora</h1></div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
            <button class="btn btn--primary" id="tabUsers" onclick="_adminTab('users')">Użytkownicy</button>
            <button class="btn btn--outline" id="tabCats" onclick="_adminTab('categories')">Kategorie</button>
        </div>
        <div id="adminContent">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    window._adminTab = function(tab) {
        document.getElementById('tabUsers').className = `btn ${tab==='users'?'btn--primary':'btn--outline'}`;
        document.getElementById('tabCats').className  = `btn ${tab==='categories'?'btn--primary':'btn--outline'}`;
        tab === 'users' ? _loadUsers() : _loadCategories();
    };

    _loadUsers();
};

async function _loadUsers() {
    const el = document.getElementById('adminContent');
    el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
        const res   = await API.admin.users();
        const users = res.data || [];

        el.innerHTML = `
            <div class="table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Imię</th><th>E-mail</th><th>Rola</th>
                            <th>Spiny</th><th>Ulubione</th><th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${u.id}</td>
                                <td>${u.name}</td>
                                <td>${u.email}</td>
                                <td>
                                    <span class="badge" style="background:${u.role==='admin'?'#FF6B3533':'#57CC9933'};color:${u.role==='admin'?'#FF6B35':'#57CC99'}">
                                        ${u.role}
                                    </span>
                                </td>
                                <td>${u.total_spins || 0}</td>
                                <td>${u.total_favorites || 0}</td>
                                <td>
                                    <div style="display:flex;gap:.4rem;">
                                        <button class="btn btn--outline btn--sm role-btn"
                                            data-id="${u.id}" data-role="${u.role}">
                                            ${u.role === 'admin' ? '👤 Degraduj' : '⬆️ Admin'}
                                        </button>
                                        <button class="btn btn--danger btn--sm del-user-btn" data-id="${u.id}">🗑</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        el.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newRole = btn.dataset.role === 'admin' ? 'user' : 'admin';
                try {
                    await API.admin.updateUser(btn.dataset.id, { role: newRole });
                    Toast.show('Rola zmieniona', 'success');
                    _loadUsers();
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });

        el.querySelectorAll('.del-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Usunąć użytkownika?')) return;
                try {
                    await API.admin.deleteUser(btn.dataset.id);
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
                <button class="btn btn--primary btn--sm" id="addCatBtn">+ Dodaj kategorię</button>
            </div>
            <div class="table-wrap">
                <table class="admin-table">
                    <thead><tr><th>ID</th><th>Ikona</th><th>Nazwa</th><th>Kolor</th><th>Akcje</th></tr></thead>
                    <tbody>
                        ${cats.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td style="font-size:1.4rem">${c.icon || ''}</td>
                                <td>${c.name}</td>
                                <td><span style="display:inline-block;width:22px;height:22px;border-radius:4px;background:${c.color}"></span> ${c.color}</td>
                                <td>
                                    <button class="btn btn--danger btn--sm del-cat-btn" data-id="${c.id}">🗑</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('addCatBtn').addEventListener('click', () => {
            Modal.show(`
                <h2 style="margin-bottom:1.5rem;">Nowa kategoria</h2>
                <form id="catForm">
                    <div class="form-group"><label>Nazwa *</label><input type="text" name="name" required /></div>
                    <div class="form-group"><label>Ikona (emoji)</label><input type="text" name="icon" placeholder="🍕" /></div>
                    <div class="form-group"><label>Kolor (hex)</label><input type="color" name="color" value="#FF6B35" /></div>
                    <div class="form-group"><label>Opis</label><textarea name="description" rows="2"></textarea></div>
                    <button class="btn btn--primary btn--full mt-md" type="submit">Dodaj</button>
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
                if (!confirm('Usunąć kategorię?')) return;
                try {
                    await API.categories.delete(btn.dataset.id);
                    Toast.show('Kategoria usunięta', 'info');
                    _loadCategories();
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });
    } catch (err) {
        el.innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
}
