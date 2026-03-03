// ============================================================
// STATE.JS — All mutable game state.
// ============================================================

function freshSymbolData() {
    const out = {};
    for (const [k, v] of Object.entries(DEFAULT_SYMBOL_DATA)) out[k] = { ...v };
    return out;
}

// ── Persistent ──────────────────────────────────────────────
let coins         = CONFIG.START_COINS;
let sizeLvl       = 1;
let strLvl        = 1;
let ante          = 1;       // Current ante (1-indexed)
let blind         = 0;       // 0=Small, 1=Big, 2=Boss
let blindEarned   = 0;       // Coins earned FROM scratching this blind (progress toward target)
let cardsRemaining = 0;      // Cards left to scratch this blind
let tokens        = [];
let hasAutoReveal = false;
let rerollCost    = CONFIG.REROLL_COST_INIT;
let cardActive    = false;
let currentSymbols = [];
let currentType   = 'mini';
let symbolData    = freshSymbolData();
let activeBossMod = null;
let rabbitUsed    = false;   // Rabbit's Foot: one-time extra card per blind

// ── Transient ───────────────────────────────────────────────
let winningIndices  = [];
let winColor        = 'var(--accent-green)';
let isJackpot       = false;
let pendingWin      = 0;
let base            = 0;
let matchType       = 'No Match';
let frozenSlotIndex = null;
let boughtItemsThisShop = new Set();
let crystalBallResult   = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let particles = [];

// Derived helpers
function currentBlindConfig() {
    const anteIdx  = Math.min(ante - 1, CONFIG.BLIND_TABLE.length - 1);
    return CONFIG.BLIND_TABLE[anteIdx][blind];
}

function blindTarget() { return currentBlindConfig().t; }
function blindMaxCards() {
    let base = currentBlindConfig().c;
    // Rabbit's Foot token adds 1 card (once per blind)
    if (!rabbitUsed && tokens.some(t => t?.id === 't4')) base += 1;
    return base;
}
