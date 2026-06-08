'use strict';

const API = (() => {
    const BASE = '/api';
    const UNSAFE = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

    let csrfToken = null;
    let csrfPromise = null;

    async function getCsrfToken() {
        if (csrfToken) return csrfToken;
        if (!csrfPromise) {
            csrfPromise = fetch(BASE + '/auth/csrf', { credentials: 'same-origin' })
                .then(r => r.json())
                .then(d => { csrfToken = d.data?.token; return csrfToken; })
                .catch(() => null);
        }
        return csrfPromise;
    }

    async function request(method, path, body = null, _retried = false) {
        const headers = { 'Content-Type': 'application/json' };
        if (UNSAFE.has(method)) {
            const token = await getCsrfToken();
            if (token) headers['X-CSRF-Token'] = token;
        }

        const opts = { method, headers, credentials: 'same-origin' };
        if (body !== null) opts.body = JSON.stringify(body);

        const res = await fetch(BASE + path, opts);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            // The session (and its CSRF token) is reset on logout, so the
            // first state-changing call afterwards carries a stale token.
            // Drop the cache and retry once transparently before surfacing
            // the error, so re-login right after logout just works.
            if (res.status === 403 && /csrf/i.test(data.message || '')) {
                csrfToken = null; csrfPromise = null;
                if (!_retried && UNSAFE.has(method)) {
                    return request(method, path, body, true);
                }
            }
            const err = new Error(data.message || `HTTP ${res.status}`);
            err.status = res.status;
            err.errors = data.errors;
            throw err;
        }
        return data;
    }

    return {
        get:    (path)         => request('GET',    path),
        post:   (path, body)   => request('POST',   path, body),
        put:    (path, body)   => request('PUT',    path, body),
        delete: (path)         => request('DELETE', path),

        // Auth
        auth: {
            register: (data) => request('POST', '/auth/register', data),
            login:    (data) => request('POST', '/auth/login', data),
            logout:   ()     => request('POST', '/auth/logout'),
            me:       ()     => request('GET',  '/auth/me'),
        },

        // Categories
        categories: {
            list:    ()         => request('GET',    '/categories'),
            create:  (data)     => request('POST',   '/categories', data),
            update:  (id, data) => request('PUT',    `/categories/${id}`, data),
            delete:  (id)       => request('DELETE', `/categories/${id}`),
        },

        // Dishes
        dishes: {
            list:          (params = {}) => {
                const qs = new URLSearchParams(
                    Object.fromEntries(Object.entries(params).filter(([,v]) => v != null))
                ).toString();
                return request('GET', `/dishes${qs ? '?' + qs : ''}`);
            },
            get:           (id)          => request('GET',    `/dishes/${id}`),
            create:        (data)        => request('POST',   '/dishes', data),
            update:        (id, data)    => request('PUT',    `/dishes/${id}`, data),
            delete:        (id)          => request('DELETE', `/dishes/${id}`),
            favorites:     ()            => request('GET',    '/favorites'),
            addFavorite:   (id)          => request('POST',   `/favorites/${id}`),
            removeFavorite:(id)          => request('DELETE', `/favorites/${id}`),
        },

        // Spin
        spin: {
            spin:    (opts = {}) => request('POST', '/spin', opts),
            history: (page = 1)  => request('GET',  `/spin/history?page=${page}`),
        },

        // Lists
        lists: {
            list:       ()          => request('GET',    '/lists'),
            get:        (id)        => request('GET',    `/lists/${id}`),
            create:     (data)      => request('POST',   '/lists', data),
            update:     (id, data)  => request('PUT',    `/lists/${id}`, data),
            delete:     (id)        => request('DELETE', `/lists/${id}`),
            addDish:    (id, dishId)=> request('POST',   `/lists/${id}/dishes`, { dish_id: dishId }),
            removeDish: (id, dishId)=> request('DELETE', `/lists/${id}/dishes/${dishId}`),
        },

        // Ratings
        ratings: {
            save:   (data)     => request('POST', '/ratings', data),
            update: (id, data) => request('PUT',  `/ratings/${id}`, data),
        },

        // Admin
        admin: {
            users:      ()         => request('GET',    '/admin/users'),
            updateUser: (id, data) => request('PUT',    `/admin/users/${id}`, data),
            deleteUser: (id)       => request('DELETE', `/admin/users/${id}`),
        },
    };
})();
