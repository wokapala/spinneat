'use strict';

Pages.history = async function(container, { page = 1 } = {}) {
    container.innerHTML = `
        <div class="stats-banner" id="statsBanner">
            <div class="stats-banner__glow"></div>
            <span class="material-symbols-outlined stats-banner__icon">auto_awesome</span>
            <p class="stats-banner__label">Lifetime Achievement</p>
            <h2 class="stats-banner__count">Total spins: <span id="totalSpins">…</span></h2>
            <div class="stats-banner__trend">
                <span class="material-symbols-outlined">trending_up</span> Śledź swoje postępy
            </div>
        </div>
        <div class="section-header">
            <h2>Recent spins</h2>
            <button class="section-header__action" onclick="App.navigate('history')">View All</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem;" id="historyList">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
        <div id="historyPager" class="pagination"></div>
    `;

    try {
        const res   = await API.spin.history(page);
        const items = res.data?.items || [];
        const total = res.data?.total || 0;
        const limit = res.data?.limit || 20;

        document.getElementById('totalSpins').textContent = total;

        const list = document.getElementById('historyList');
        if (!items.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎡</div>
                    <p>Jeszcze nie losowałeś!</p>
                    <button class="btn btn--primary btn--pill mt-md" data-page="home">Zakręć kołem</button>
                </div>`;
            return;
        }

        list.innerHTML = items.map(h => `
            <div class="history-item">
                <div class="history-item__thumb">${h.category_icon || '🍽️'}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
                        <h4 class="history-item__name">${h.dish_name}</h4>
                        <span style="flex-shrink:0;font-size:.6875rem;font-weight:700;padding:.2rem .625rem;border-radius:var(--radius-full);background:var(--clr-secondary-container);color:var(--clr-on-secondary-container);">
                            ${h.category_name}
                        </span>
                    </div>
                    <div class="history-item__date">
                        <span class="material-symbols-outlined">calendar_today</span>
                        ${_fmt(h.spun_at)}
                    </div>
                </div>
                <button class="btn btn--tertiary btn--sm rate-hist-btn" data-id="${h.dish_id}">
                    <span class="material-symbols-outlined">star</span>
                </button>
            </div>
        `).join('');

        list.querySelectorAll('.rate-hist-btn').forEach(btn =>
            btn.addEventListener('click', () => _rateModal(parseInt(btn.dataset.id)))
        );

        // Pagination
        const pages = Math.ceil(total / limit);
        if (pages > 1) {
            const pager = document.getElementById('historyPager');
            for (let p = 1; p <= pages; p++) {
                const b = document.createElement('button');
                b.className = `pagination__btn${p === page ? ' active' : ''}`;
                b.textContent = p;
                b.addEventListener('click', () => App.navigate('history', { page: p }));
                pager.appendChild(b);
            }
        }
    } catch (err) {
        document.getElementById('historyList').innerHTML = `<p class="text-muted">Błąd: ${err.message}</p>`;
    }
};

function _rateModal(dishId) {
    Modal.show(`
        <h2 style="font-family:var(--font-headline);font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;">Oceń danie ⭐</h2>
        <form id="rateHistForm">
            <div class="form-group"><label>Ocena</label>
                <div class="star-input">
                    ${[5,4,3,2,1].map(n=>`<input type="radio" name="score" id="hs${n}" value="${n}" ${n===5?'checked':''}><label for="hs${n}">★</label>`).join('')}
                </div>
            </div>
            <div class="form-group"><label>Komentarz</label><textarea name="comment" rows="3" placeholder="Jak smakowało?"></textarea></div>
            <button class="btn btn--primary btn--full mt-md" type="submit">Zapisz</button>
        </form>
    `);
    document.getElementById('rateHistForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try { await API.ratings.save({ dish_id: dishId, score: parseInt(fd.get('score')), comment: fd.get('comment') || null }); Modal.hide(); Toast.show('Ocena zapisana!', 'success'); }
        catch (err) { Toast.show(err.message, 'error'); }
    });
}

function _fmt(iso) {
    return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
