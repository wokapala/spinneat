'use strict';

Pages.profile = async function(container) {
    const user = Auth.get();
    if (!user) { App.navigate('login'); return; }

    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                <span style="font-size:2.5rem;line-height:1;">${esc(_initials(user.name))}</span>
            </div>
            <h2 class="profile-name">${esc(user.name)}</h2>
            <p class="profile-email">${esc(user.email)}</p>
            ${user.role === 'admin' ? `
                <span style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:700;padding:.25rem .875rem;border-radius:var(--radius-full);background:var(--clr-primary-container);color:var(--clr-on-primary);margin-top:.5rem;">
                    <span class="material-symbols-outlined" style="font-size:.9rem;">shield</span> Admin
                </span>
            ` : ''}
        </div>

        <div id="profileStats" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
            <div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>
        </div>

        <div style="display:flex;flex-direction:column;gap:.75rem;">
            ${user.role === 'admin' ? `
                <button class="profile-action-btn" data-page="admin">
                    <span class="material-symbols-outlined profile-action-btn__icon" style="color:var(--clr-primary);">admin_panel_settings</span>
                    <span class="profile-action-btn__label">Panel administratora</span>
                    <span class="material-symbols-outlined" style="color:var(--clr-outline-var);">chevron_right</span>
                </button>
            ` : ''}
            <button class="profile-action-btn" data-page="favorites">
                <span class="material-symbols-outlined profile-action-btn__icon" style="color:#e05252;">favorite</span>
                <span class="profile-action-btn__label">Moje ulubione</span>
                <span class="material-symbols-outlined" style="color:var(--clr-outline-var);">chevron_right</span>
            </button>
            <button class="profile-action-btn" data-page="lists">
                <span class="material-symbols-outlined profile-action-btn__icon" style="color:#6c9de8;">format_list_bulleted</span>
                <span class="profile-action-btn__label">Moje listy</span>
                <span class="material-symbols-outlined" style="color:var(--clr-outline-var);">chevron_right</span>
            </button>
            <button class="profile-action-btn" data-page="history">
                <span class="material-symbols-outlined profile-action-btn__icon" style="color:#f0a04b;">history</span>
                <span class="profile-action-btn__label">Historia spinów</span>
                <span class="material-symbols-outlined" style="color:var(--clr-outline-var);">chevron_right</span>
            </button>

            <div style="height:1px;background:var(--clr-surface-container);margin:.25rem 0;"></div>

            <button class="profile-action-btn" id="logoutBtn" style="color:#c0392b;">
                <span class="material-symbols-outlined profile-action-btn__icon" style="color:#c0392b;">logout</span>
                <span class="profile-action-btn__label" style="color:#c0392b;">Wyloguj się</span>
            </button>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

    try {
        const res  = await API.spin.history(1);
        const total = res.data?.total || 0;
        const favRes = await API.dishes.favorites().catch(() => ({ data: [] }));
        const favCount = (favRes.data || []).length;

        document.getElementById('profileStats').innerHTML = `
            <div class="stat-tile">
                <span class="material-symbols-outlined stat-tile__icon">autorenew</span>
                <span class="stat-tile__value">${esc(total)}</span>
                <span class="stat-tile__label">Spinów</span>
            </div>
            <div class="stat-tile">
                <span class="material-symbols-outlined stat-tile__icon">favorite</span>
                <span class="stat-tile__value">${esc(favCount)}</span>
                <span class="stat-tile__label">Ulubionych</span>
            </div>
        `;
    } catch {
        document.getElementById('profileStats').innerHTML = '';
    }
};

function _initials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
