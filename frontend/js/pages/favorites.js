'use strict';

Pages.favorites = async function(container) {
    container.innerHTML = `
        <div class="page-header"><h1>❤️ Ulubione dania</h1></div>
        <div class="grid grid--auto" id="favGrid">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    try {
        const res   = await API.dishes.favorites();
        const items = res.data || [];

        if (!items.length) {
            document.getElementById('favGrid').innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-icon">🤍</div>
                    <p>Brak ulubionych.<br/>Dodaj dania klikając 🤍 na liście dań.</p>
                </div>
            `;
            return;
        }

        document.getElementById('favGrid').innerHTML = items.map(d => `
            <div class="dish-card">
                <div class="dish-card__img">${d.category_icon || '🍽️'}</div>
                <div class="dish-card__body">
                    <p class="dish-card__name">${d.name}</p>
                    <p class="dish-card__desc">${d.description || ''}</p>
                    <div class="dish-card__meta">
                        <span class="badge" style="background:${d.category_color}22;color:${d.category_color}">
                            ${d.category_icon || ''} ${d.category_name}
                        </span>
                    </div>
                </div>
                <div class="dish-card__actions">
                    <button class="btn btn--ghost btn--sm unfav-btn" data-id="${d.id}" title="Usuń z ulubionych">💔 Usuń</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.unfav-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                try {
                    await API.dishes.removeFavorite(id);
                    btn.closest('.dish-card').remove();
                    Toast.show('Usunięto z ulubionych', 'info');
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });
    } catch (err) {
        document.getElementById('favGrid').innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
};
