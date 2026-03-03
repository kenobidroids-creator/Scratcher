// ============================================================
// CONFIG.JS — All constants, tables, and tuning values.
// ============================================================

const CONFIG = {
    START_COINS: 35,

    BLIND_NAMES: ['Small Blind', 'Big Blind', 'Boss Blind'],
    BLIND_ICONS: ['🟢', '🟡', '💀'],

    // [ante_index][blind_index] = { t: target_coins, c: cards_allowed }
    BLIND_TABLE: [
        [{ t:  30, c: 3 }, { t:  55, c: 3 }, { t:  90, c: 4 }],  // Ante 1
        [{ t: 120, c: 3 }, { t: 200, c: 3 }, { t: 320, c: 4 }],  // Ante 2
        [{ t: 450, c: 4 }, { t: 700, c: 4 }, { t:1050, c: 5 }],  // Ante 3
        [{ t:1300, c: 4 }, { t:1900, c: 4 }, { t:2700, c: 5 }],  // Ante 4
        [{ t:3200, c: 4 }, { t:4600, c: 5 }, { t:6500, c: 5 }],  // Ante 5
        [{ t:7500, c: 5 }, { t:10500,c: 5 }, { t:15000,c: 6 }],  // Ante 6
    ],

    MEGA_UNLOCK_ANTE:  2,
    ULTRA_UNLOCK_ANTE: 3,

    SCRATCH_WIDTH_STEP: 3,
    REVEAL_BASE:        0.55,
    REVEAL_STR_STEP:    0.012,

    REROLL_COST_INIT:    6,
    REROLL_COST_STEP:    3,
    AUTO_REVEAL_COST:    150,
    WIDEN_COST_PER_LVL:  35,
    POWER_COST_PER_LVL:  50,
    SYMBOL_UPGRADE_COST: 35,
    SYMBOL_UPGRADE_VAL:  6,

    DAILY_TOKEN_COUNT:      2,
    DAILY_SYMBOL_UPGRADES:  2,
    TOKEN_SLOTS:            5,

    GOLDEN_COIN_BONUS:    8,
    DICE_CHANCE:          0.25,
    LEMON_SQUEEZER_MULT:  3,
    HIDDEN_FEES_COST:     8,
    PITY_BASE:            3,
};

const TICKET_TYPES = {
    mini:  { label: 'MINI',  cost: 3,  cols: 3, rows: 3, win3: 22,  win2: 8,   pair2: 14  },
    mega:  { label: 'MEGA',  cost: 15, cols: 4, rows: 3, win3: 70,  win2: 25,  pair2: 45  },
    ultra: { label: 'ULTRA', cost: 50, cols: 4, rows: 4, win3: 220, win2: 80,  pair2: 140 },
};

const DEFAULT_SYMBOL_DATA = {
    '🍒': { val: 8,  lvl: 1 },
    '🍋': { val: 15, lvl: 1 },
    '🔔': { val: 22, lvl: 1 },
    '⭐': { val: 30, lvl: 1 },
    '💎': { val: 45, lvl: 1 },
};
const SYMBOL_LIST = Object.keys(DEFAULT_SYMBOL_DATA);

const TOKENS_DB = [
    { id: 't1', name: 'Golden Coin',    icon: '🪙', desc: '+'+CONFIG.GOLDEN_COIN_BONUS+'💰 flat bonus every card',          cost: 40 },
    { id: 't2', name: 'Lucky Dice',     icon: '🎲', desc: (CONFIG.DICE_CHANCE*100)+'% chance to double win',                cost: 55 },
    { id: 't3', name: 'Sharp Nail',     icon: '💅', desc: 'Scratch width grows faster each level',                         cost: 30 },
    { id: 't4', name: 'Rabbit\'s Foot', icon: '🐇', desc: '+1 extra card this blind',                                      cost: 65 },
    { id: 't5', name: 'Lemon Squeeze',  icon: '🍋', desc: '🍋 wins pay '+CONFIG.LEMON_SQUEEZER_MULT+'×',                    cost: 50 },
    { id: 't6', name: 'Charm Bracelet', icon: '📿', desc: 'Pity payout ×3 on no-match',                                    cost: 45 },
    { id: 't7', name: 'Crystal Ball',   icon: '🔮', desc: 'Reveals win type before you scratch',                           cost: 75 },
    { id: 't8', name: 'Four-Leaf Clover',icon: '🍀',desc: '10% better reveal threshold permanently',                      cost: 60 },
];

const BOSS_MODS = [
    { id: 'frozen_slot', name: 'Audit',           desc: 'One random token slot is disabled this blind.',                icon: '❄️' },
    { id: 'double_cost', name: 'Inflation',        desc: 'All scratch cards cost 2× more this blind.',                  icon: '📈' },
    { id: 'no_pairs',    name: 'Standardisation',  desc: 'Pairs pay 0 this blind. 3-of-a-kind or better only.',         icon: '🚫' },
    { id: 'tax_cut',     name: 'Hidden Fees',      desc: 'Every card costs an extra '+CONFIG.HIDDEN_FEES_COST+'💰.',     icon: '💸' },
    { id: 'leaky_wallet',name: 'Leaky Wallet',     desc: 'Cards cost 1.5× their normal price this blind.',              icon: '💧' },
];

const TICKET_COLORS = {
    mini:  { title: '#38bdf8', scratch: '#64748b', particle: '#38bdf8' },
    mega:  { title: '#a855f7', scratch: '#6d28d9', particle: '#c084fc' },
    ultra: { title: '#fbbf24', scratch: '#b45309', particle: '#fbbf24' },
};
