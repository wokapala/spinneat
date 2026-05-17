'use strict';

/* ── TOAST ── */
const Toast = (() => {
    function show(msg, type = 'info', duration = 3500) {
        const container = document.getElementById('toastContainer');
        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => el.remove(), duration);
    }
    return { show };
})();

/* ── MODAL ── */
const Modal = (() => {
    const modal   = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    const close   = document.getElementById('modalClose');
    const overlay = document.getElementById('modalOverlay');

    close.addEventListener('click',   hide);
    overlay.addEventListener('click', hide);
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

/* ── ROUTER / SPA ── */
const App = (() => {
    const pages = {
        home:      Pages.home,
        login:     Pages.login,
        register:  Pages.register,
        dishes:    Pages.dishes,
        history:   Pages.history,
        lists:     Pages.lists,
        favorites: Pages.favorites,
        admin:     Pages.admin,
    };

    let currentPage = null;

    function navigate(page, params = {}) {
        const fn = pages[page];
        if (!fn) return;

        // Guard: auth-only pages
        const authRequired = ['history', 'lists', 'favorites'];
        const adminRequired = ['admin'];

        if (authRequired.includes(page) && !Auth.isLoggedIn()) {
            Toast.show('Zaloguj się, aby uzyskać dostęp', 'error');
            navigate('login');
            return;
        }

        if (adminRequired.includes(page) && !Auth.isAdmin()) {
            Toast.show('Brak uprawnień', 'error');
            return;
        }

        currentPage = page;
        _setActiveNavLink(page);
        const app = document.getElementById('app');
        app.innerHTML = '';
        fn(app, params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function _setActiveNavLink(page) {
        document.querySelectorAll('.nav-link').forEach(a => {
            a.classList.toggle('active', a.dataset.page === page);
        });
    }

    async function init() {
        // Nav clicks
        document.addEventListener('click', e => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                navigate(link.dataset.page);
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

        // Mobile nav toggle
        document.getElementById('navToggle').addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('open');
        });

        await Auth.init();
        navigate('home');
    }

    return { navigate, init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
