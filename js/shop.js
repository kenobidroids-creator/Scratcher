// ============================================================
// SHOP.JS — Night shop, blind progression, boss encounters.
// ============================================================

function openShop() {
    boughtItemsThisShop.clear();
    rerollCost = CONFIG.REROLL_COST_INIT; // Reset reroll each shop visit
    document.getElementById('shop-ante').innerText   = ante;
    document.getElementById('shop-blind').innerText  = CONFIG.BLIND_NAMES[blind];
    document.getElementById('shop-earned').innerText = Math.floor(blindEarned);
    document.getElementById('shop-target').innerText = blindTarget();

    // Determine next blind info for the button
    const isLastBlind = blind === 2;
    const nextLabel = isLastBlind
        ? `⚔️ START ANTE ${ante + 1}`
        : `${CONFIG.BLIND_ICONS[blind + 1]} ${CONFIG.BLIND_NAMES[blind + 1]}`;
    document.getElementById('shop-next-btn').innerText = nextLabel;

    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('shop-modal').style.display    = 'block';
    renderShopItems();
    updateUI();
}

function renderShopItems() {
    const container = document.getElementById('shop-items');
    container.innerHTML = `
        <div class="shop-section"><div class="shop-section-title">⚙️ GEAR</div><div id="gear-grid" class="shop-grid"></div></div>
        <div class="shop-section"><div class="shop-section-title">🪙 LUCKY TOKENS</div><div id="token-grid" class="shop-grid"></div></div>
        <div class="shop-section"><div class="shop-section-title">📦 VOUCHERS</div><div id="voucher-grid" class="shop-grid"></div></div>
    `;

    addShopItem('gear-grid', '🔭 Widen Coin',    `Scratch width → Lvl ${sizeLvl+1}`,  sizeLvl*CONFIG.WIDEN_COST_PER_LVL, 'widen',  () => sizeLvl++);
    addShopItem('gear-grid', '💪 Scratch Power', `Reveal speed  → Lvl ${strLvl+1}`,   strLvl*CONFIG.POWER_COST_PER_LVL,  'power',  () => strLvl++);

    const ownedIds = new Set(tokens.filter(Boolean).map(t => t.id));
    const slotsFree = CONFIG.TOKEN_SLOTS - tokens.filter(Boolean).length;
    TOKENS_DB.filter(t => !ownedIds.has(t.id)).sort(() => 0.5-Math.random()).slice(0, CONFIG.DAILY_TOKEN_COUNT).forEach(t => {
        addShopItem('token-grid', `${t.icon} ${t.name}`, t.desc + (slotsFree<=0?' <em>(slots full)</em>':''), t.cost, t.id,
            () => { if (tokens.filter(Boolean).length < CONFIG.TOKEN_SLOTS) tokens.push(t); }, slotsFree<=0);
    });

    if (!hasAutoReveal) addShopItem('voucher-grid', '⚡ Auto-Laser', 'Unlocks Quick Reveal', CONFIG.AUTO_REVEAL_COST, 'autolaser', () => { hasAutoReveal=true; });

    Object.keys(symbolData).sort(() => 0.5-Math.random()).slice(0, CONFIG.DAILY_SYMBOL_UPGRADES).forEach(sym => {
        addShopItem('voucher-grid', `${sym} Level Up`,
            `Base value +${CONFIG.SYMBOL_UPGRADE_VAL}💰 → ${symbolData[sym].val+CONFIG.SYMBOL_UPGRADE_VAL}💰`,
            CONFIG.SYMBOL_UPGRADE_COST, `lvl_${sym}`,
            () => { symbolData[sym].val += CONFIG.SYMBOL_UPGRADE_VAL; symbolData[sym].lvl += 1; });
    });

    document.getElementById('reroll-display').innerText = rerollCost;
    updateUI();
}

function addShopItem(gridId, name, desc, cost, id, action, locked=false) {
    const grid = document.getElementById(gridId); if (!grid) return;
    const sold = boughtItemsThisShop.has(id);
    const canBuy = !locked && !sold && coins >= cost;
    const div = document.createElement('div');
    div.className = `item-card${sold?' sold-out':''}`;
    div.innerHTML = `<div class="item-info"><b>${name}</b><span>${desc}</span></div>
        <button class="btn-buy-item" ${canBuy?'':'disabled'}>${sold?'✓ SOLD':cost+'💰'}</button>`;
    div.querySelector('button').addEventListener('click', () => {
        if (coins<cost || boughtItemsThisShop.has(id) || locked) return;
        coins -= cost; action(); boughtItemsThisShop.add(id);
        saveGame(); renderShopItems(); updateUI();
    });
    grid.appendChild(div);
}

function rerollShop() {
    if (coins < rerollCost) { showToast('Not enough coins to reroll!', '#ef4444'); return; }
    coins -= rerollCost;
    rerollCost += CONFIG.REROLL_COST_STEP;
    renderShopItems(); updateUI(); saveGame();
}

// Advance to next blind or next ante
function nextBlind() {
    document.getElementById('shop-modal').style.display  = 'none';
    document.getElementById('modal-overlay').style.display = 'none';

    if (blind === 2) {
        // Completed all 3 blinds — advance ante
        ante++;
        blind = 0;
    } else {
        blind++;
    }

    // Boss blind: assign modifier
    activeBossMod   = null;
    frozenSlotIndex = null;
    rabbitUsed      = false;

    if (blind === 2) {
        activeBossMod = BOSS_MODS[Math.floor(Math.random() * BOSS_MODS.length)];
        if (activeBossMod.id === 'frozen_slot') frozenSlotIndex = Math.floor(Math.random() * CONFIG.TOKEN_SLOTS);
    }

    // Reset blind state
    blindEarned    = 0;
    cardsRemaining = blindMaxCards();

    // Reset card area
    cardActive     = false;
    currentSymbols = [];
    document.querySelectorAll('.prize-cell').forEach(c => { c.innerText='?'; c.classList.add('preview-mode'); });
    drawScratchLayer(currentType);
    document.getElementById('buy-btn').disabled = false;

    saveGame();
    updateUI();

    // Show blind intro
    showBlindIntro();
}

function showBlindIntro() {
    const cfg = currentBlindConfig();
    document.getElementById('intro-ante').innerText  = ante;
    document.getElementById('intro-name').innerText  = CONFIG.BLIND_NAMES[blind];
    document.getElementById('intro-icon').innerText  = CONFIG.BLIND_ICONS[blind];
    document.getElementById('intro-target').innerText = cfg.t;
    document.getElementById('intro-cards').innerText  = cfg.c;

    const modRow = document.getElementById('intro-mod-row');
    if (blind === 2 && activeBossMod) {
        modRow.style.display = 'flex';
        document.getElementById('intro-mod-icon').innerText = activeBossMod.icon;
        document.getElementById('intro-mod-text').innerText = `${activeBossMod.name}: ${activeBossMod.desc}`;
    } else {
        modRow.style.display = 'none';
    }

    const introModal = document.getElementById('blind-intro-modal');
    introModal.className = 'modal modal-intro' + (blind === 2 ? ' boss-intro' : '');
    introModal.querySelector('.intro-blind-name').style.color = blind === 2 ? 'var(--red)' : blind === 1 ? 'var(--gold)' : 'var(--green)';

    document.getElementById('modal-overlay').style.display = 'block';
    introModal.style.display = 'block';
}

function closeBlindIntro() {
    document.getElementById('blind-intro-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display     = 'none';
}

function closeBossModal() {
    document.getElementById('boss-modal').style.display  = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

function showGameOver(target, earned) {
    document.getElementById('gameover-target').innerText = target;
    document.getElementById('gameover-earned').innerText = Math.floor(earned);
    document.getElementById('gameover-ante').innerText   = ante;
    document.getElementById('gameover-blind').innerText  = CONFIG.BLIND_NAMES[blind];
    document.getElementById('modal-overlay').style.display  = 'block';
    document.getElementById('gameover-modal').style.display = 'block';
}

function restartGame() { clearSave(); location.reload(); }
