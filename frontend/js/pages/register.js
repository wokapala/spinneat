'use strict';

Pages.register = function(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-box">
                <h2 class="auth-box__title">🎡 Utwórz konto</h2>
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
                        <label for="regPass">Hasło <span class="text-muted">(min. 8 znaków)</span></label>
                        <input type="password" id="regPass" name="password" placeholder="••••••••" autocomplete="new-password" />
                        <span class="field-error" id="passErr"></span>
                    </div>
                    <button class="btn btn--primary btn--full mt-md" type="submit" id="regBtn">Zarejestruj się</button>
                </form>
                <p class="auth-box__link mt-md">Masz konto? <a href="#" data-page="login">Zaloguj się</a></p>
            </div>
        </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', async e => {
        e.preventDefault();
        const name     = document.getElementById('regName').value.trim();
        const email    = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;
        const btn      = document.getElementById('regBtn');

        // Clear errors
        ['nameErr','emailErr','passErr'].forEach(id => document.getElementById(id).textContent = '');

        btn.disabled = true;
        btn.textContent = 'Rejestracja…';

        try {
            await API.auth.register({ name, email, password });
            // Auto-login
            const loginRes = await API.auth.login({ email, password });
            Auth.set(loginRes.data);
            Toast.show('Konto utworzone! Witaj 🎉', 'success');
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
        } finally {
            btn.disabled = false;
            btn.textContent = 'Zarejestruj się';
        }
    });
};
