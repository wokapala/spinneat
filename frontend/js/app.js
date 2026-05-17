'use strict';

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
