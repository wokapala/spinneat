'use strict';

/*
 * Minimal i18n module.
 * Language is stored in localStorage under 'lang' ('pl' or 'en').
 * t(key)          — translate a key, returns the key itself as fallback
 * t(key, {a:'x'}) — simple {a} placeholder substitution
 * I18n.setLang(l) — persist new language and reload the page
 * I18n.getLang()  — return active language code
 */
const I18n = (() => {
    const getLang = () => localStorage.getItem('lang') || 'pl';

    const t = (key, vars = {}) => {
        const locale = getLang() === 'en' ? window._LOCALE_EN : window._LOCALE_PL;
        let str = (locale && locale[key] !== undefined) ? locale[key] : key;
        Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, String(v));
        });
        return str;
    };

    const setLang = lang => {
        localStorage.setItem('lang', lang);
        location.reload();
    };

    return { getLang, t, setLang };
})();

window.I18n = I18n;
window.t = I18n.t;
