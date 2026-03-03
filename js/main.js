// ============================================================
// MAIN.JS — Bootstrap
// ============================================================

const canvas = document.getElementById('scratch-canvas');
const ctx    = canvas.getContext('2d');
const pCtx   = document.getElementById('particle-canvas').getContext('2d');

(function init() {
    const hasSave = loadGame();

    // If cardsRemaining was never set (fresh game), initialize it
    if (cardsRemaining <= 0 && !cardActive) cardsRemaining = blindMaxCards();

    document.querySelectorAll('.ticket-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === currentType);
    });

    if (cardActive && currentSymbols.length > 0) {
        resumeActiveCard();
        const titleEl = document.getElementById('card-title-display');
        if (titleEl) { titleEl.innerText = TICKET_TYPES[currentType].label+' TICKET'; titleEl.style.color = TICKET_COLORS[currentType].title; }
    } else {
        const targetTab = document.querySelector(`.ticket-tab[data-type="${currentType}"]`);
        selectTicket(currentType, targetTab);
    }

    updateUI();
    animateParticles();
    initInputListeners();

    // Show blind intro on fresh start or after load with no active card
    if (!hasSave && !cardActive) {
        showBlindIntro();
    }
})();
