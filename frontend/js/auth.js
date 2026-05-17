'use strict';

const Auth = (() => {
    let currentUser = null;

    function get()       { return currentUser; }
    function isLoggedIn(){ return currentUser !== null; }
    function isAdmin()   { return currentUser?.role === 'admin'; }

    function set(user) {
        currentUser = user;
        _updateNav();
    }

    async function init() {
        try {
            const res = await API.auth.me();
            currentUser = res.data;
        } catch {
            currentUser = null;
        }
        _updateNav();
    }

    async function logout() {
        try { await API.auth.logout(); } catch {}
        currentUser = null;
        _updateNav();
        App.navigate('home');
        Toast.show('Wylogowano pomyślnie', 'success');
    }

    function _updateNav() {
        const authEls  = document.querySelectorAll('.nav-auth-only');
        const guestEls = document.querySelectorAll('.nav-guest-only');
        const adminEls = document.querySelectorAll('.nav-admin-only');

        const loggedIn = isLoggedIn();
        const admin    = isAdmin();

        authEls.forEach(el  => el.classList.toggle('hidden', !loggedIn));
        guestEls.forEach(el => el.classList.toggle('hidden', loggedIn));
        adminEls.forEach(el => el.classList.toggle('hidden', !admin));
    }

    return { get, set, isLoggedIn, isAdmin, init, logout };
})();
