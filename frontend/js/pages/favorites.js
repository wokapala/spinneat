'use strict';

Pages.favorites = async function(container) {
    container.innerHTML = `
        <div style="margin-bottom:1.5rem;">
            <h1 style="font-family:var(--font-headline);font-size:2rem;font-weight:800;letter-spacing:-.03em;">${esc(t('favorites.title'))}</h1>
            <p class="text-muted" style="font-size:.875rem;" id="favCount"></p>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem;" id="favList">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    try {
        const res   = await API.dishes.favorites();
        const items = res.data || [];
        const list  = document.getElementById('favList');

        document.getElementById('favCount').textContent = `${items.length} ${t('favorites.count_suffix')}`;

        if (!items.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🤍</div>
                    <p>${esc(t('favorites.empty'))}</p>
                    <button class="btn btn--primary btn--pill mt-md" data-page="dishes">${esc(t('favorites.browse'))}</button>
                </div>
            `;
            return;
        }

        list.innerHTML = items.map(d => `
            <div class="meal-card" data-id="${esc(d.id)}">
                <div class="meal-card__emoji">${esc(d.category_icon || '🍽️')}</div>
                <div class="meal-card__body">
                    <div class="meal-card__header">
                        <h3 class="meal-card__name">${esc(d.name)}</h3>
                        <span class="meal-card__tag">${esc(d.category_name || '')}</span>
                    </div>
                    <div class="meal-card__meta">
                        ${d.prep_time ? `<div class="meal-card__meta-item"><span class="material-symbols-outlined">schedule</span>${esc(d.prep_time)} min</div>` : ''}
                        ${d.avg_rating ? `<div class="meal-card__meta-item"><span class="material-symbols-outlined">star</span>${esc(parseFloat(d.avg_rating).toFixed(1))}</div>` : ''}
                    </div>
                </div>
                <button class="btn btn--ghost btn--sm unfav-btn" data-id="${esc(d.id)}" style="color:#c0392b;flex-shrink:0;" title="${esc(t('favorites.remove_title'))}">
                    <span class="material-symbols-outlined icon-fill" style="color:#c0392b;">favorite</span>
                </button>
            </div>
        `).join('');

        list.querySelectorAll('.unfav-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                try {
                    await API.dishes.removeFavorite(id);
                    btn.closest('.meal-card').remove();
                    const remaining = list.querySelectorAll('.meal-card').length;
                    document.getElementById('favCount').textContent = `${remaining} ${t('favorites.count_suffix')}`;
                    if (!remaining) {
                        list.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">🤍</div>
                                <p>${esc(t('favorites.empty'))}</p>
                                <button class="btn btn--primary btn--pill mt-md" data-page="dishes">${esc(t('favorites.browse'))}</button>
                            </div>
                        `;
                    }
                    Toast.show(t('toast.removed_from_favorites'), 'info');
                } catch (err) { Toast.show(err.message, 'error'); }
            });
        });
    } catch (err) {
        document.getElementById('favList').innerHTML = `<p class="text-muted">${esc(t('error.prefix'))}${esc(err.message)}</p>`;
    }
};
