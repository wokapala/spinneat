'use strict';

Pages.login = function(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card">
                <div class="auth-card__brand">
                    <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--clr-primary);">refresh</span>
                    <h1 style="font-family:var(--font-headline);font-size:1.75rem;font-weight:800;letter-spacing:-.03em;color:var(--clr-on-bg);margin:0;">Spin & Eat</h1>
                </div>
                <p style="color:var(--clr-on-surface-var);font-size:.9375rem;margin-bottom:2rem;">${esc(t('login.subtitle'))}</p>

                <form id="loginForm" novalidate>
                    <div class="form-group">
                        <label for="loginEmail">${esc(t('form.email'))}</label>
                        <input type="email" id="loginEmail" name="email" placeholder="${esc(t('form.email_placeholder'))}" autocomplete="email" maxlength="255" required />
                        <span class="field-error" id="emailErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="loginPass">${esc(t('form.password'))}</label>
                        <input type="password" id="loginPass" name="password" placeholder="${esc(t('form.password_placeholder'))}" autocomplete="current-password" maxlength="200" required />
                        <span class="field-error" id="passErr"></span>
                    </div>
                    <button class="btn btn--primary btn--full btn--pill mt-md" type="submit" id="loginBtn">
                        ${esc(t('login.button'))} <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>

                <p class="auth-card__switch">${esc(t('login.no_account'))}
                    <a href="#" data-page="register" style="color:var(--clr-primary);font-weight:600;text-decoration:none;">${esc(t('login.register_link'))}</a>
                </p>
            </div>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;
        const btn      = document.getElementById('loginBtn');

        document.getElementById('emailErr').textContent = '';
        document.getElementById('passErr').textContent  = '';

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:1.25rem;height:1.25rem;border-width:2px;margin:0 auto;"></div>';

        try {
            const res = await API.auth.login({ email, password });
            Auth.set(res.data);
            Toast.show(t('toast.welcome', { name: res.data.name }), 'success');
            App.navigate('home');
        } catch (err) {
            if (err.status === 401) {
                document.getElementById('passErr').textContent = t('login.invalid_credentials');
            } else {
                Toast.show(err.message, 'error');
            }
            btn.disabled = false;
            btn.innerHTML = `${esc(t('login.button'))} <span class="material-symbols-outlined">arrow_forward</span>`;
        }
    });
};
