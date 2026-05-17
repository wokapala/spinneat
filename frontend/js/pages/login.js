'use strict';

Pages.login = function(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-box">
                <h2 class="auth-box__title">🎡 Zaloguj się</h2>
                <form id="loginForm" novalidate>
                    <div class="form-group">
                        <label for="loginEmail">E-mail</label>
                        <input type="email" id="loginEmail" name="email" placeholder="jan@example.com" autocomplete="email" />
                        <span class="field-error" id="emailErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="loginPass">Hasło</label>
                        <input type="password" id="loginPass" name="password" placeholder="••••••••" autocomplete="current-password" />
                        <span class="field-error" id="passErr"></span>
                    </div>
                    <button class="btn btn--primary btn--full mt-md" type="submit" id="loginBtn">Zaloguj się</button>
                </form>
                <p class="auth-box__link mt-md">Nie masz konta? <a href="#" data-page="register">Zarejestruj się</a></p>
            </div>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;
        const btn      = document.getElementById('loginBtn');

        // Clear errors
        document.getElementById('emailErr').textContent = '';
        document.getElementById('passErr').textContent  = '';

        btn.disabled = true;
        btn.textContent = 'Logowanie…';

        try {
            const res = await API.auth.login({ email, password });
            Auth.set(res.data);
            Toast.show(`Witaj, ${res.data.name}!`, 'success');
            App.navigate('home');
        } catch (err) {
            if (err.status === 401) {
                document.getElementById('passErr').textContent = 'Nieprawidłowy email lub hasło';
            } else {
                Toast.show(err.message, 'error');
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Zaloguj się';
        }
    });
};
