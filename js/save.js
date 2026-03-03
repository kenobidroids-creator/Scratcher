// ============================================================
// SAVE.JS — localStorage persistence.
// ============================================================

const SAVE_KEY = 'scratch_inc_save_v3';

function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            coins, sizeLvl, strLvl, ante, blind,
            blindEarned, cardsRemaining, tokens,
            hasAutoReveal, rerollCost, cardActive,
            currentSymbols, currentType, symbolData,
            activeBossMod, frozenSlotIndex, rabbitUsed,
        }));
    } catch(e) { console.warn('Save failed:', e); }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        coins          = d.coins          ?? CONFIG.START_COINS;
        sizeLvl        = d.sizeLvl        ?? 1;
        strLvl         = d.strLvl         ?? 1;
        ante           = d.ante           ?? 1;
        blind          = d.blind          ?? 0;
        blindEarned    = d.blindEarned    ?? 0;
        cardsRemaining = d.cardsRemaining ?? blindMaxCards();
        tokens         = d.tokens         ?? [];
        hasAutoReveal  = d.hasAutoReveal  ?? false;
        rerollCost     = d.rerollCost     ?? CONFIG.REROLL_COST_INIT;
        cardActive     = d.cardActive     ?? false;
        currentSymbols = d.currentSymbols ?? [];
        currentType    = d.currentType    ?? 'mini';
        activeBossMod  = d.activeBossMod  ?? null;
        frozenSlotIndex = d.frozenSlotIndex ?? null;
        rabbitUsed     = d.rabbitUsed     ?? false;
        if (d.symbolData) symbolData = { ...freshSymbolData(), ...d.symbolData };
        return true;
    } catch(e) { console.warn('Load failed:', e); return false; }
}

function clearSave() { localStorage.removeItem(SAVE_KEY); }

// ── Reset modal ──────────────────────────────────────────────
function resetRun() {
    const modal  = document.getElementById('reset-modal');
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('reset-modal-title').innerText = 'RESET RUN?';
    document.getElementById('reset-modal-msg').innerHTML   = 'All progress, tokens and upgrades will be lost.<br>This cannot be undone.';
    document.getElementById('reset-confirm-btn').onclick   = () => { clearSave(); location.reload(); };
    overlay.style.display = 'block';
    modal.style.display   = 'block';
}

function cancelReset() {
    document.getElementById('reset-modal').style.display  = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}
