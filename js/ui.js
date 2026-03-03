// ============================================================
// UI.JS — All rendering / DOM updates. No game logic.
// ============================================================

function drawScratchLayer(type) {
    const col = TICKET_COLORS[type];
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = col.scratch;
    ctx.fillRect(0, 0, 320, 320);
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (let i = 0; i < 900; i++) ctx.fillRect(Math.random()*320, Math.random()*320, 1.5, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 5; i++) { const x = Math.random()*320; ctx.fillRect(x, 0, 2+Math.random()*4, 320); }
}

function selectTicket(type, el) {
    if (cardActive) return;
    currentType = type;
    const col  = TICKET_COLORS[type];
    const titleEl = document.getElementById('card-title-display');
    if (titleEl) { titleEl.innerText = TICKET_TYPES[type].label + ' TICKET'; titleEl.style.color = col.title; }
    document.querySelectorAll('.ticket-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    const t    = TICKET_TYPES[type];
    const grid = document.getElementById('prize-grid');
    grid.style.gridTemplateColumns = `repeat(${t.cols}, 1fr)`;
    grid.innerHTML = '';
    for (let i = 0; i < t.cols * t.rows; i++) {
        const c = document.createElement('div');
        c.className = 'prize-cell preview-mode';
        c.innerText = '?';
        grid.appendChild(c);
    }
    drawScratchLayer(type);
    updateUI();
}

function updateUI() {
    // Coins
    document.getElementById('coin-count').innerText = Math.floor(coins);

    // Ante / blind label
    const blindName = CONFIG.BLIND_NAMES[blind] || 'Blind';
    const blindIcon = CONFIG.BLIND_ICONS[blind]  || '';
    document.getElementById('ante-label').innerText = `Ante ${ante}`;
    document.getElementById('blind-label').innerText = `${blindIcon} ${blindName}`;

    // Blind progress
    const target = blindTarget();
    const pct    = Math.min(1, blindEarned / target);
    const progressBar = document.getElementById('blind-progress-bar');
    if (progressBar) progressBar.style.width = (pct * 100) + '%';
    const progressLabel = document.getElementById('blind-progress-label');
    if (progressLabel) progressLabel.innerText = `${Math.floor(blindEarned)} / ${target}💰`;
    // Colour: fill green, overflow gold
    if (progressBar) progressBar.style.background = pct >= 1
        ? 'linear-gradient(90deg,#f1c40f,#fbbf24)'
        : 'linear-gradient(90deg,#15803d,#22c55e)';

    // Cards remaining
    const cardsMax = blindMaxCards();
    document.getElementById('cards-remaining').innerText  = cardsRemaining;
    document.getElementById('cards-max').innerText        = cardsMax;
    const cardPct = ((cardsMax - cardsRemaining) / cardsMax) * 100;
    const cardBar = document.getElementById('cards-progress-bar');
    if (cardBar) cardBar.style.width = cardPct + '%';

    // Symbol level strip
    const levelBar = document.getElementById('symbol-levels');
    if (levelBar) {
        levelBar.innerHTML = Object.entries(symbolData)
            .map(([sym, d]) => `<span class="sym-badge">${sym}<b class="sym-lvl">L${d.lvl}</b><small class="sym-val">${d.val}💰</small></span>`)
            .join('');
    }

    // Ticket tab lock/unlock based on ante
    document.querySelectorAll('.ticket-tab').forEach(tab => {
        const type = tab.dataset.type;
        if (type === 'mega' && ante < CONFIG.MEGA_UNLOCK_ANTE) {
            tab.classList.add('locked');
            tab.innerText = `🔒 Ante ${CONFIG.MEGA_UNLOCK_ANTE}`;
        } else if (type === 'ultra' && ante < CONFIG.ULTRA_UNLOCK_ANTE) {
            tab.classList.add('locked');
            tab.innerText = `🔒 Ante ${CONFIG.ULTRA_UNLOCK_ANTE}`;
        } else {
            tab.classList.remove('locked');
            tab.innerText = tab.dataset.displayText || TICKET_TYPES[type]?.label + ' (' + TICKET_TYPES[type]?.cost + '💰)';
        }
    });

    // Auto-reveal button
    const autoBtn = document.getElementById('auto-reveal-btn');
    if (autoBtn) { autoBtn.style.display = hasAutoReveal ? 'block' : 'none'; autoBtn.disabled = !cardActive; }

    // Buy button
    const buyBtn = document.getElementById('buy-btn');
    if (buyBtn) {
        let cost = cardCost();
        buyBtn.disabled = cardActive || coins < cost || cardsRemaining <= 0;
        const costLabel = document.getElementById('buy-cost');
        if (costLabel) costLabel.innerText = cost;
    }

    // Boss banner
    const bossBanner = document.getElementById('boss-banner');
    if (bossBanner) {
        bossBanner.style.display = activeBossMod ? 'flex' : 'none';
        if (activeBossMod) bossBanner.querySelector('.boss-banner-text').innerText = `${activeBossMod.icon} ${activeBossMod.name}: ${activeBossMod.desc}`;
    }

    // Crystal Ball hint
    const crystalHint = document.getElementById('crystal-hint');
    if (crystalHint) {
        const hasBall = tokens.some(t => t?.id === 't7');
        crystalHint.style.display = (hasBall && cardActive && crystalBallResult) ? 'block' : 'none';
        if (hasBall && cardActive && crystalBallResult) crystalHint.innerText = `🔮 ${crystalBallResult}`;
    }

    renderTokenBar();
}

function cardCost() {
    const t = TICKET_TYPES[currentType];
    let cost = t.cost;
    if (activeBossMod?.id === 'double_cost')  cost *= 2;
    if (activeBossMod?.id === 'tax_cut')      cost += CONFIG.HIDDEN_FEES_COST;
    if (activeBossMod?.id === 'leaky_wallet') cost = Math.ceil(cost * 1.5);
    return cost;
}

function renderTokenBar() {
    const bar = document.getElementById('token-bar');
    if (!bar) return;
    bar.innerHTML = '';
    for (let i = 0; i < CONFIG.TOKEN_SLOTS; i++) {
        const slot = document.createElement('div');
        slot.className = 'token-slot';
        const isFrozen = activeBossMod?.id === 'frozen_slot' && i === frozenSlotIndex;
        if (isFrozen) slot.classList.add('token-frozen');
        if (tokens[i]) {
            slot.innerHTML = `<span>${tokens[i].icon}</span>`;
            if (!isFrozen) slot.classList.add('token-filled');
            slot.title = `${isFrozen ? '[FROZEN] ' : ''}${tokens[i].name}: ${tokens[i].desc}`;
        } else {
            slot.innerHTML = isFrozen ? '<span>🚫</span>' : '<span class="slot-empty">+</span>';
            if (isFrozen) slot.title = 'Slot disabled by the Tax Man!';
        }
        bar.appendChild(slot);
    }
}
