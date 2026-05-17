'use strict';

const Wheel = (() => {
    let canvas, ctx, segments = [], isSpinning = false;
    let currentAngle = 0;

    // Warm palette from design system
    const PALETTE = ['#ff7949','#fcf5f1','#f6efeb','#ff7949','#fcf5f1','#f6efeb'];

    function init(canvasEl, items) {
        canvas = canvasEl;
        ctx    = canvas.getContext('2d');
        setSegments(items);
    }

    function setSegments(items) {
        segments = items.map((item, i) => ({
            label: item.label || item.name || '',
            color: PALETTE[i % PALETTE.length],
            icon:  item.icon  || '🍽️',
            id:    item.id,
        }));
        if (canvas) _draw(currentAngle);
    }

    function _draw(angle) {
        const size = canvas.offsetWidth;
        canvas.width  = size;
        canvas.height = size;
        const cx = size / 2, cy = size / 2, r = cx - 2;

        ctx.clearRect(0, 0, size, size);

        if (!segments.length) {
            ctx.fillStyle = '#f6efeb';
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#b2aca9';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = '14px Be Vietnam Pro, sans-serif';
            ctx.fillText('Brak dań', cx, cy);
            return;
        }

        const slice = (Math.PI * 2) / segments.length;

        segments.forEach((seg, i) => {
            const start = angle + i * slice;
            const end   = start + slice;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, end);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();
            // subtle border between slices
            ctx.strokeStyle = 'rgba(166,51,0,.08)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // text
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + slice / 2);
            const textR = r * .65;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // icon
            const iconSize = Math.min(18, r / Math.max(segments.length, 4));
            ctx.font = `${iconSize}px sans-serif`;
            ctx.fillText(seg.icon, textR - 4, -iconSize * .7);

            // label
            const maxLen  = Math.max(4, Math.floor(r / 16));
            const label   = seg.label.length > maxLen ? seg.label.slice(0, maxLen) + '…' : seg.label;
            const lblSize = Math.min(12, r / Math.max(segments.length * .9, 5));
            ctx.font = `700 ${lblSize}px Plus Jakarta Sans, sans-serif`;
            ctx.fillStyle = '#312e2c';
            ctx.shadowColor = 'rgba(255,255,255,.7)';
            ctx.shadowBlur  = 3;
            ctx.fillText(label, textR, iconSize * .7);
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        // outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(166,51,0,.06)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function spin(onResult, targetId) {
        if (isSpinning || !segments.length) return;
        isSpinning = true;

        const slice    = (Math.PI * 2) / segments.length;
        const startAng = currentAngle;
        let totalRot;

        const targetIdx = targetId !== undefined
            ? segments.findIndex(s => s.id === targetId)
            : -1;

        if (targetIdx >= 0) {
            // Calculate rotation so the pointer (top, -π/2) lands on the center of targetIdx
            const targetFinalAngle = -Math.PI / 2 - targetIdx * slice - slice / 2;
            const diff = ((targetFinalAngle - startAng) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            totalRot = diff + Math.PI * 2 * (8 + Math.floor(Math.random() * 4));
        } else {
            totalRot = Math.PI * 2 * (8 + Math.random() * 6);
        }

        const duration = 4000 + Math.random() * 1200;
        const start    = performance.now();

        function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

        function frame(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            currentAngle   = startAng + totalRot * easeOut(progress);
            _draw(currentAngle);

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                isSpinning = false;
                if (onResult) onResult(_getWinner());
            }
        }
        requestAnimationFrame(frame);
    }

    function _getWinner() {
        if (!segments.length) return null;
        const slice      = (Math.PI * 2) / segments.length;
        const normalized = ((-currentAngle - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const idx        = Math.floor(normalized / slice) % segments.length;
        return { ...segments[idx], index: idx };
    }

    return { init, setSegments, spin };
})();
