// ============================================================
// INPUT.JS — Scratch input handling and particle system.
// Must be loaded after game.js so canvas/ctx are available.
// ============================================================

// ── Canvas refs (set by main.js after DOM ready) ─────────────
// canvas, ctx, pCtx are declared in main.js

// ── Particle System ─────────────────────────────────────────
function createParticles(x, y, color) {
    const count = 2 + strLvl; // More particles as scratch power grows
    for (let i = 0; i < count; i++) {
        particles.push({
            x:     x + (Math.random() - 0.5) * 12,
            y:     y + (Math.random() - 0.5) * 12,
            vx:    (Math.random() - 0.5) * 2.5,
            vy:    -Math.random() * 2 - 0.5,    // float upward
            life:  28 + Math.random() * 12,
            maxLife: 28 + 12,
            size:  1 + Math.random() * 2.5,
            color,
        });
    }
}

function animateParticles() {
    pCtx.clearRect(0, 0, 320, 320);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.08;  // gentle gravity
        p.life--;

        const alpha = p.life / (p.maxLife || 40);
        const hexA  = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pCtx.fillStyle = p.color + hexA;
        pCtx.fillRect(p.x, p.y, p.size, p.size);

        if (p.life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(animateParticles);
}

// ── Scratch Logic ────────────────────────────────────────────
function scratch(e) {
    if (!isDrawing || !cardActive) return;
    e.preventDefault();

    const rect    = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x       = clientX - rect.left;
    const y       = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth  = 14 + sizeLvl * 3;
    ctx.lineCap    = 'round';
    ctx.lineJoin   = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;

    // Particle burst
    const color = TICKET_COLORS[currentType]?.particle || '#cbd5e1';
    createParticles(x, y, color);

    // Probabilistic reveal check (avoids checking every single frame)
    if (Math.random() > 0.88) checkReveal();
}

// ── Event Listeners ──────────────────────────────────────────
function initInputListeners() {
    canvas.addEventListener('mousedown', e => {
        if (!cardActive) return;
        isDrawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    window.addEventListener('mouseup', () => { isDrawing = false; });

    canvas.addEventListener('mousemove', scratch);

    canvas.addEventListener('touchstart', e => {
        if (!cardActive) return;
        e.preventDefault();
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
    }, { passive: false });

    canvas.addEventListener('touchmove',  scratch,              { passive: false });
    canvas.addEventListener('touchend',   () => { isDrawing = false; });
}
