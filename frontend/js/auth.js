'use strict';

const Auth = (() => {
    let currentUser = null;

    function get()        { return currentUser; }
    function isLoggedIn() { return currentUser !== null; }
    function isAdmin()    { return currentUser?.role === 'admin'; }

    function set(user) {
        currentUser = user;
        _updateUI();
    }

    async function init() {
        try {
            const res  = await API.auth.me();
            currentUser = res.data;
        } catch {
            currentUser = null;
        }
        _updateUI();
    }

    async function logout() {
        try { await API.auth.logout(); } catch {}
        currentUser = null;
        _updateUI();
        App.navigate('home');
        Toast.show(t('toast.logged_out'), 'success');
    }

    function _updateUI() {
        const loggedIn = isLoggedIn();
        const admin    = isAdmin();

        document.querySelectorAll('.nav-auth-only').forEach(el =>
            el.classList.toggle('hidden', !loggedIn)
        );
        document.querySelectorAll('.nav-guest-only').forEach(el =>
            el.classList.toggle('hidden', loggedIn)
        );
        document.querySelectorAll('.nav-admin-only').forEach(el =>
            el.classList.toggle('hidden', !admin)
        );

        // Update meal count pill
        if (loggedIn) {
            _refreshMealCount();
        }
    }

    async function _refreshMealCount() {
        try {
            const res = await API.dishes.list();
            const label = document.getElementById('mealCountLabel');
            if (label) label.textContent = `${(res.data || []).length} ${t('topbar.meals_saved')}`;
        } catch {}
    }

    return { get, set, isLoggedIn, isAdmin, init, logout };
})();
