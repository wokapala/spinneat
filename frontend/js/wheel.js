'use strict';

/*
 * Horizontal "case-opening" carousel (CS:GO-style).
 * Exposes the same public API as the old wheel — Wheel.init/setSegments/
 * ensureSegment/spin — so the rest of the app doesn't need to change.
 */
const Wheel = (() => {
    let viewport, strip, segments = [], isSpinning = false;

    // Palette mirrors the previous wheel colors for brand consistency.
    const PALETTE = [
        { bg: '#ff7949', fg: '#ffffff' },
        { bg: '#fcf5f1', fg: '#312e2c' },
        { bg: '#f6efeb', fg: '#312e2c' },
        { bg: '#ffd9c9', fg: '#5a1e00' },
    ];

    // Strip is built by repeating segments many times so the spin can travel
    // through a long path without running out of cards.
    const REPEAT = 30;

    function _cardMetrics() {
        // Pull the actual rendered card width + gap + strip padding so the
        // math survives any CSS tweaks (e.g. mobile vs desktop sizing).
        const card = strip?.querySelector('.carousel-card');
        if (!card) return { width: 120, gap: 12, padding: 0 };
        const styles  = getComputedStyle(strip);
        const gap     = parseFloat(styles.columnGap || styles.gap || '12') || 12;
        const padding = parseFloat(styles.paddingLeft) || 0;
        return { width: card.getBoundingClientRect().width, gap, padding };
    }

    function init(viewportEl, items) {
        viewport = viewportEl;
        strip = viewport.querySelector('.carousel-strip');
        setSegments(items);
    }

    function setSegments(items) {
        segments = items.map((item, i) => {
            const c = PALETTE[i % PALETTE.length];
            return {
                label: item.label || item.name || '',
                bg:    c.bg,
                fg:    c.fg,
                icon:  item.category_icon || item.icon || '🍽️',
                id:    item.id,
            };
        });
        _render();
    }

    function ensureSegment(dish) {
        const id = dish.dish_id ?? dish.id;
        if (segments.some(s => s.id === id)) return id;

        const i = segments.length;
        const c = PALETTE[i % PALETTE.length];
        segments.push({
            label: dish.dish_name || dish.name || '',
            bg:    c.bg,
            fg:    c.fg,
            icon:  dish.category_icon || dish.icon || '🍽️',
            id,
        });
        _render();
        return id;
    }

    function _render() {
        if (!strip) return;

        if (!segments.length) {
            strip.innerHTML = '<div class="carousel-empty">Brak dań</div>';
            strip.style.transform = 'translateX(0)';
            return;
        }

        const html = [];
        for (let r = 0; r < REPEAT; r++) {
            for (let i = 0; i < segments.length; i++) {
                const s = segments[i];
                html.push(
                    `<div class="carousel-card" style="background:${s.bg};color:${s.fg}">` +
                        `<div class="carousel-card__icon">${esc(s.icon)}</div>` +
                        `<div class="carousel-card__label">${esc(s.label)}</div>` +
                    `</div>`
                );
            }
        }
        strip.innerHTML = html.join('');
        strip.style.transform = 'translateX(0)';
    }

    /** @returns {boolean} false when a spin is already running (caller should re-enable its UI) */
    function spin(onResult, targetId) {
        if (isSpinning || !segments.length) return false;
        isSpinning = true;

        // Find target index in the segment list; pick a random one if not given
        // or not present.
        let targetIdx = targetId !== undefined
            ? segments.findIndex(s => s.id === targetId)
            : Math.floor(Math.random() * segments.length);
        if (targetIdx < 0) targetIdx = Math.floor(Math.random() * segments.length);

        const { width, gap, padding } = _cardMetrics();
        const step = width + gap;
        const cycle = step * segments.length;
        const viewportW = viewport.clientWidth;
        const centerOffset = viewportW / 2 - width / 2 - padding;

        // The strip repeats the same segment cycle, so the offset left over
        // from a previous spin can be folded back into the first cycle without
        // any visible change — this keeps consecutive spins from teleporting
        // the strip back to zero and lets the travel distance stay constant.
        let startX = parseFloat((strip.style.transform.match(/-?[\d.]+/) || [0])[0]) || 0;
        startX = -((-startX % cycle) + cycle) % cycle;
        strip.style.transform = `translateX(${startX}px)`;

        // Land on a copy of the target card in the latter portion of the strip.
        const repetition = Math.floor(REPEAT * 0.7) + Math.floor(Math.random() * 3);
        const finalCardIdx = repetition * segments.length + targetIdx;

        // Slight off-center wiggle so it doesn't look mechanically perfect,
        // but clamp so the pointer still clearly sits on the target card.
        const wiggle = (Math.random() - 0.5) * (width * 0.55);

        const finalX = -(finalCardIdx * step) + centerOffset + wiggle;

        const duration = 5500 + Math.random() * 1200;
        const startT = performance.now();

        function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

        function frame(now) {
            const elapsed = now - startT;
            const progress = Math.min(elapsed / duration, 1);
            const x = startX + (finalX - startX) * easeOut(progress);
            strip.style.transform = `translateX(${x}px)`;

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                isSpinning = false;
                if (onResult) onResult({ ...segments[targetIdx], index: targetIdx });
            }
        }
        requestAnimationFrame(frame);
        return true;
    }

    return { init, setSegments, ensureSegment, spin };
})();
