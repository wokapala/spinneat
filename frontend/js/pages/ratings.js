'use strict';

Pages.ratings = async function(container) {
    container.innerHTML = `
        <div style="margin-bottom:1.5rem;">
            <h1 style="font-family:var(--font-headline);font-size:2rem;font-weight:800;letter-spacing:-.03em;">${esc(t('ratings.title'))}</h1>
            <p class="text-muted" style="font-size:.875rem;" id="ratingsCount"></p>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem;" id="ratingsList">
            <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
    `;

    try {
        const res   = await API.ratings.mine();
        const items = res.data || [];
        const list  = document.getElementById('ratingsList');

        document.getElementById('ratingsCount').textContent = `${items.length} ${t('ratings.count_suffix')}`;

        if (!items.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <p>${esc(t('ratings.empty'))}</p>
                    <button class="btn btn--primary btn--pill mt-md" data-page="dishes">${esc(t('ratings.browse'))}</button>
                </div>
            `;
            return;
        }

        list.innerHTML = items.map(r => `
            <div class="meal-card" data-id="${esc(r.id)}" style="align-items:flex-start;gap:1rem;">
                <div class="meal-card__emoji" style="flex-shrink:0;">${esc(r.category_icon || '🍽️')}</div>
                <div style="flex:1;min-width:0;">
                    <div class="meal-card__header">
                        <h3 class="meal-card__name">${esc(r.dish_name)}</h3>
                        <span class="meal-card__tag">${esc(r.category_name || '')}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:.375rem;margin:.3rem 0 .25rem;">
                        <span style="color:#f59e0b;font-size:1.1rem;letter-spacing:.05em;">${_stars(r.score)}</span>
                        <span style="font-size:.8125rem;font-weight:700;color:var(--clr-on-surface);">${esc(r.score)}/5</span>
                    </div>
                    ${r.comment ? `<p style="font-size:.8125rem;color:var(--clr-on-surface-var);margin:.1rem 0 .3rem;line-height:1.5;">"${esc(r.comment)}"</p>` : ''}
                    <p style="font-size:.6875rem;color:var(--clr-outline-var);margin:0;">
                        <span class="material-symbols-outlined" style="font-size:.8rem;vertical-align:middle;">calendar_today</span>
                        ${esc(Utils.formatDate(r.rated_at))}
                    </p>
                </div>
                <button class="btn btn--ghost btn--sm edit-rating-btn" data-id="${esc(r.id)}" data-dish="${esc(r.dish_id)}" data-score="${esc(r.score)}" data-comment="${esc(r.comment || '')}" style="flex-shrink:0;" title="${esc(t('ratings.edit_btn'))}">
                    <span class="material-symbols-outlined">edit</span>
                </button>
            </div>
        `).join('');

        list.querySelectorAll('.edit-rating-btn').forEach(btn =>
            btn.addEventListener('click', () => _openEditModal(
                parseInt(btn.dataset.id),
                parseInt(btn.dataset.dish),
                parseInt(btn.dataset.score),
                btn.dataset.comment
            ))
        );
    } catch (err) {
        document.getElementById('ratingsList').innerHTML =
            `<p class="text-muted">${esc(t('error.prefix'))}${esc(err.message)}</p>`;
    }
};

function _stars(score) {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
}

function _openEditModal(ratingId, dishId, currentScore, currentComment) {
    Modal.show(`
        <h2 style="font-family:var(--font-headline);font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;">${esc(t('ratings.edit_title'))}</h2>
        <form id="editRatingForm">
            <div class="form-group">
                <label>${esc(t('modal.rating_label'))}</label>
                <div class="star-input">
                    ${[5,4,3,2,1].map(n => `
                        <input type="radio" name="score" id="er${n}" value="${n}" ${n === currentScore ? 'checked' : ''}>
                        <label for="er${n}">★</label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>${esc(t('modal.comment_optional'))}</label>
                <textarea name="comment" rows="3" placeholder="${esc(t('modal.comment_placeholder'))}" maxlength="1000">${esc(currentComment)}</textarea>
            </div>
            <button class="btn btn--primary btn--full mt-md" type="submit">${esc(t('modal.save'))}</button>
        </form>
    `);

    document.getElementById('editRatingForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await API.ratings.update(ratingId, {
                score:   parseInt(fd.get('score')),
                comment: fd.get('comment') || null,
            });
            Modal.hide();
            Toast.show(t('ratings.updated'), 'success');
            Pages.ratings(document.getElementById('app'));
        } catch (err) { Toast.show(err.message, 'error'); }
    });
}
