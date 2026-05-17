'use strict';

Pages.history = async function(container, { page = 1 } = {}) {
    container.innerHTML = `
        <div class="page-header"><h1>📜 Historia spinów</h1></div>
        <div id="historyList"><div class="loading-overlay"><div class="spinner"></div></div></div>
        <div id="historyPager" class="pagination"></div>
    `;

    try {
        const res   = await API.spin.history(page);
        const items = res.data?.items || [];
        const total = res.data?.total || 0;
        const limit = res.data?.limit || 20;

        if (!items.length) {
            document.getElementById('historyList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎡</div>
                    <p>Jeszcze nie losowałeś! <a href="#" data-page="home" style="color:var(--color-primary)">Zakręć kołem</a></p>
                </div>
            `;
            return;
        }

        document.getElementById('historyList').innerHTML = `
            <div style="display:flex; flex-direction:column; gap:.75rem;">
                ${items.map(h => `
                    <div class="history-item">
                        <div class="history-item__icon">${h.category_icon || '🍽️'}</div>
                        <div class="history-item__info">
                            <p class="history-item__name">${h.dish_name}</p>
                            <p class="history-item__meta">
                                <span class="badge" style="background:${h.category_color}22;color:${h.category_color}">${h.category_name}</span>
                                &nbsp;${_formatDate(h.spun_at)}
                            </p>
                        </div>
                        <button class="btn btn--ghost btn--sm" onclick="_rateFromHistory(${h.dish_id})">⭐ Oceń</button>
                    </div>
                `).join('')}
            </div>
        `;

        // Pagination
        const pages = Math.ceil(total / limit);
        if (pages > 1) {
            let pagerHtml = '';
            for (let p = 1; p <= pages; p++) {
                pagerHtml += `<button class="pagination__btn ${p === page ? 'active' : ''}"
                    onclick="App.navigate('history', { page: ${p} })">${p}</button>`;
            }
            document.getElementById('historyPager').innerHTML = pagerHtml;
        }
    } catch (err) {
        document.getElementById('historyList').innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
};

function _rateFromHistory(dishId) {
    Modal.show(`
        <h2 style="margin-bottom:1.5rem;">Oceń danie ⭐</h2>
        <form id="ratingHistForm">
            <div class="form-group">
                <label>Ocena</label>
                <div class="star-input">
                    ${[5,4,3,2,1].map(n => `
                        <input type="radio" name="score" id="hs${n}" value="${n}" ${n===5?'checked':''}>
                        <label for="hs${n}">★</label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Komentarz</label>
                <textarea name="comment" rows="3" placeholder="Jak smakowało?"></textarea>
            </div>
            <button class="btn btn--primary btn--full" type="submit">Zapisz</button>
        </form>
    `);
    document.getElementById('ratingHistForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await API.ratings.save({ dish_id: dishId, score: parseInt(fd.get('score')), comment: fd.get('comment') || null });
            Modal.hide();
            Toast.show('Ocena zapisana!', 'success');
        } catch (err) { Toast.show(err.message, 'error'); }
    });
}

function _formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
