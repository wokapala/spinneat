'use strict';

const Wheel = (() => {
    let canvas, ctx, segments = [], isSpinning = false;
    let currentAngle = 0;

    function init(canvasEl, items) {
        canvas = canvasEl;
        ctx    = canvas.getContext('2d');
        setSegments(items);
        draw(currentAngle);
    }

    function setSegments(items) {
        segments = items.map(item => ({
            label: item.label || item.name || '',
            color: item.color || _randomColor(),
            icon:  item.icon  || '🍽️',
        }));
        if (canvas) draw(currentAngle);
    }

    function draw(angle) {
        const W = canvas.width = canvas.offsetWidth;
        const H = canvas.height = canvas.offsetHeight;
        const cx = W / 2, cy = H / 2;
        const r  = Math.min(cx, cy) - 8;

        ctx.clearRect(0, 0, W, H);

        if (!segments.length) {
            ctx.fillStyle = '#2A2A45';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9090A0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '16px sans-serif';
            ctx.fillText('Brak dań do losowania', cx, cy);
            return;
        }

        const sliceAngle = (Math.PI * 2) / segments.length;

        segments.forEach((seg, i) => {
            const start = angle + i * sliceAngle;
            const end   = start + sliceAngle;

            // Slice
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, end);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(0,0,0,.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + sliceAngle / 2);

            const textR = r * .68;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Icon
            ctx.font = `${Math.min(20, r / (segments.length * .6))}px sans-serif`;
            ctx.fillText(seg.icon, textR - 4, -10);

            // Label
            const maxLen = Math.max(4, Math.floor(r / 14));
            const label  = seg.label.length > maxLen ? seg.label.slice(0, maxLen) + '…' : seg.label;
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.min(13, r / (segments.length * .7))}px sans-serif`;
            ctx.shadowColor = 'rgba(0,0,0,.5)';
            ctx.shadowBlur  = 3;
            ctx.fillText(label, textR, 8);
            ctx.shadowBlur = 0;

            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#0F0F1A';
        ctx.fill();
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎡', cx, cy);
    }

    function spin(onResult) {
        if (isSpinning || !segments.length) return;
        isSpinning = true;

        const totalRotation = Math.PI * 2 * (8 + Math.random() * 6);
        const duration      = 4000 + Math.random() * 1000;
        const start         = performance.now();
        const startAngle    = currentAngle;

        function easeOut(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function frame(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = easeOut(progress);

            currentAngle = startAngle + totalRotation * eased;
            draw(currentAngle);

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                isSpinning = false;
                const winner = _getWinner();
                if (onResult) onResult(winner);
            }
        }

        requestAnimationFrame(frame);
    }

    function _getWinner() {
        if (!segments.length) return null;
        const sliceAngle = (Math.PI * 2) / segments.length;
        // Pointer is at top (−π/2); normalize angle
        const normalized = ((- currentAngle - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const idx        = Math.floor(normalized / sliceAngle) % segments.length;
        return { ...segments[idx], index: idx };
    }

    function _randomColor() {
        const palette = ['#E63946','#F4A261','#2A9D8F','#E9C46A','#57CC99','#FF6B6B','#4CC9F0','#7209B7','#F72585'];
        return palette[Math.floor(Math.random() * palette.length)];
    }

    return { init, setSegments, spin, draw };
})();
