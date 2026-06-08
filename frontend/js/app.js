'use strict';

/* ── ESCAPE (XSS guard) ──
 * Every dynamic value injected into innerHTML must go through esc()
 * so server data and user input can't break out of the template and
 * inject <script> tags or event handlers.
 */
const esc = (() => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return v => (v === null || v === undefined ? '' : String(v).replace(/[&<>"']/g, c => map[c]));
})();
window.esc = esc;

/* ── SHARED UTILS ──
 * Anything called from more than one page lives here so we don't end
 * up with three slightly different copies of the same helper.
 */
const Utils = {
    initials: name => (name || '?').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2),
    difficultyLabel: d => ({ easy: 'Łatwe', medium: 'Średnie', hard: 'Trudne' }[d] || d),
    formatDate: iso => new Date(iso).toLocaleDateString('pl-PL', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
};
window.Utils = Utils;

/* ── TOAST ── */
const Toast = (() => {
    function show(msg, type = 'info', duration = 3500) {
        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.textContent = msg;
        document.getElementById('toastContainer').appendChild(el);
        setTimeout(() => el.remove(), duration);
    }
    return { show };
})();

/* ── MODAL ── */
const Modal = (() => {
    const modal   = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    document.getElementById('modalClose').addEventListener('click', hide);
    document.getElementById('modalOverlay').addEventListener('click', hide);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });

    function show(html) {
        content.innerHTML = html;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    function hide() {
        modal.classList.add('hidden');
        content.innerHTML = '';
        document.body.style.overflow = '';
    }
    return { show, hide };
})();

/* ── SPA ROUTER ── */
const App = (() => {
    const authRequired  = ['history', 'lists', 'favorites', 'profile'];
    const adminRequired = ['admin'];
    const pages = {
        home:      Pages.home,
        login:     Pages.login,
        register:  Pages.register,
        dishes:    Pages.dishes,
        history:   Pages.history,
        lists:     Pages.lists,
        favorites: Pages.favorites,
        profile:   Pages.profile,
        admin:     Pages.admin,
    };

    function navigate(page, params = {}) {
        if (authRequired.includes(page) && !Auth.isLoggedIn()) {
            Toast.show('Zaloguj się, aby uzyskać dostęp', 'error');
            navigate('login');
            return;
        }
        if (adminRequired.includes(page) && !Auth.isAdmin()) {
            Toast.show('Brak uprawnień', 'error');
            return;
        }
        const fn = pages[page];
        if (!fn) return;

        _setActiveNav(page);
        const app = document.getElementById('app');
        app.innerHTML = '';
        fn(app, params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function _setActiveNav(page) {
        document.querySelectorAll('.bottom-nav__item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
            // swap icon fill on active
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.style.fontVariationSettings = btn.dataset.page === page
                    ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
            }
        });
    }

    async function init() {
        // Delegate all [data-page] clicks
        document.addEventListener('click', e => {
            const link = e.target.closest('[data-page]');
            if (link) { e.preventDefault(); navigate(link.dataset.page); }
        });

        await Auth.init();
        navigate('home');
    }

    return { navigate, init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
