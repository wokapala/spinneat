'use strict';

Pages.register = function(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card">
                <div class="auth-card__brand">
                    <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--clr-primary);">refresh</span>
                    <h1 style="font-family:var(--font-headline);font-size:1.75rem;font-weight:800;letter-spacing:-.03em;color:var(--clr-on-bg);margin:0;">Spin & Eat</h1>
                </div>
                <p style="color:var(--clr-on-surface-var);font-size:.9375rem;margin-bottom:2rem;">Utwórz konto i zacznij losować swoje posiłki!</p>

                <form id="registerForm" novalidate>
                    <div class="form-group">
                        <label for="regName">Imię i nazwisko</label>
                        <input type="text" id="regName" name="name" placeholder="Jan Kowalski" autocomplete="name" />
                        <span class="field-error" id="nameErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="regEmail">E-mail</label>
                        <input type="email" id="regEmail" name="email" placeholder="jan@example.com" autocomplete="email" />
                        <span class="field-error" id="emailErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="regPass">Hasło <span style="color:var(--clr-on-surface-var);font-weight:400;">(min. 8 znaków)</span></label>
                        <input type="password" id="regPass" name="password" placeholder="••••••••" autocomplete="new-password" />
                        <span class="field-error" id="passwordErr"></span>
                    </div>
                    <button class="btn btn--primary btn--full btn--pill mt-md" type="submit" id="regBtn">
                        Utwórz konto <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>

                <p class="auth-card__switch">Masz już konto?
                    <a href="#" data-page="login" style="color:var(--clr-primary);font-weight:600;text-decoration:none;">Zaloguj się</a>
                </p>
            </div>
        </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', async e => {
        e.preventDefault();
        const name     = document.getElementById('regName').value.trim();
        const email    = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;
        const btn      = document.getElementById('regBtn');

        ['nameErr','emailErr','passwordErr'].forEach(id => document.getElementById(id).textContent = '');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:1.25rem;height:1.25rem;border-width:2px;margin:0 auto;"></div>';

        try {
            await API.auth.register({ name, email, password });
            const loginRes = await API.auth.login({ email, password });
            Auth.set(loginRes.data);
            Toast.show('Konto utworzone! Witaj!', 'success');
            App.navigate('home');
        } catch (err) {
            if (err.errors) {
                Object.entries(err.errors).forEach(([field, msg]) => {
                    const el = document.getElementById(field + 'Err');
                    if (el) el.textContent = msg;
                });
            } else {
                Toast.show(err.message, 'error');
            }
            btn.disabled = false;
            btn.innerHTML = 'Utwórz konto <span class="material-symbols-outlined">arrow_forward</span>';
        }
    });
};
