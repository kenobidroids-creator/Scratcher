// ============================================================
// GAME.JS — Core game loop: buying, scoring, revealing.
// ============================================================

function buyCard() {
    if (cardsRemaining <= 0 || cardActive) return;
    const cost = cardCost();
    if (coins < cost) { showToast('Not enough coins!', '#ef4444'); return; }

    coins -= cost;
    cardsRemaining--;

    // Rabbit's Foot: mark used once we draw the first card if it granted the bonus
    if (!rabbitUsed && tokens.some(t => t?.id === 't4')) rabbitUsed = true;

    // Remove preview mode
    document.querySelectorAll('.prize-cell').forEach(c => { c.classList.remove('preview-mode'); c.innerText = ''; });
    drawScratchLayer(currentType);

    // Populate symbols
    const res = [];
    document.querySelectorAll('.prize-cell').forEach(c => {
        const s = SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)];
        c.innerHTML = s; res.push(s);
    });
    currentSymbols = res;
    calculateWin(res);
    crystalBallResult = tokens.some(t => t?.id === 't7') ? matchType : null;

    cardActive = true;
    canvas.style.opacity = 1;
    document.getElementById('buy-btn').disabled = true;
    saveGame();
    updateUI();
}

function calculateWin(res) {
    const t         = TICKET_TYPES[currentType];
    const gridWidth = t.cols;
    const lines     = [];

    base = 0; matchType = 'No Match'; winningIndices = []; isJackpot = false;
    winColor = 'var(--accent-green)';

    // Build lines
    for (let r = 0; r < t.rows; r++) { const row=[]; for(let c=0;c<t.cols;c++) row.push(r*gridWidth+c); lines.push(row); }
    for (let c = 0; c < t.cols; c++) { const col=[]; for(let r=0;r<t.rows;r++) col.push(r*gridWidth+c); lines.push(col); }
    const d1=[], d2=[], dim=Math.min(t.rows,t.cols);
    for(let i=0;i<dim;i++){ d1.push(i*gridWidth+i); d2.push(i*gridWidth+(gridWidth-1-i)); }
    lines.push(d1,d2);

    const wins = [];

    // 1. Jackpot — every cell identical
    if (res.every(s => s === res[0])) {
        wins.push({ type:'JACKPOT! 🎉', val: t.win3*4 + symbolData[res[0]].val*res.length, idx:res.map((_,i)=>i), symbol:res[0] });
    }

    // 2. Full line (3+ in a row/col/diagonal)
    for (const line of lines) {
        if (line.length < 3) continue;
        const sym = res[line[0]];
        if (line.every(i => res[i] === sym)) {
            wins.push({ type:'3 in a Line!', val: t.win3 + symbolData[sym].val*line.length, idx:line, symbol:sym });
        }
    }

    // 3. L-shapes
    for (let r=0;r<t.rows-1;r++) for(let c=0;c<t.cols-1;c++) {
        const i=r*gridWidth+c, right=i+1, down=i+gridWidth, corner=i+gridWidth+1;
        for (const shape of [[i,right,down],[i,right,corner],[i,down,corner],[right,down,corner]]) {
            if (shape.every(idx => res[idx] === res[shape[0]])) {
                const sym = res[shape[0]];
                wins.push({ type:'L-Shape!', val:(t.win3||22)+symbolData[sym].val*3, idx:shape, symbol:sym });
            }
        }
    }

    // 4. Pairs (unless boss no_pairs)
    if (activeBossMod?.id !== 'no_pairs') {
        const pairsFound = [];
        for (const line of lines) {
            for (let s=0; s<=line.length-2; s++) {
                const a=line[s], b=line[s+1];
                if (res[a]===res[b] && !pairsFound.some(p=>p.sym===res[a])) {
                    pairsFound.push({sym:res[a], indices:[a,b]});
                    if (pairsFound.length===2) break;
                }
            }
            if (pairsFound.length===2) break;
        }
        if (pairsFound.length===2) {
            const [p1,p2] = pairsFound;
            wins.push({ type:'Two Pair', val:(t.pair2||14)+symbolData[p1.sym].val*2+symbolData[p2.sym].val*2, idx:[...p1.indices,...p2.indices], symbol:p1.sym });
        } else if (pairsFound.length===1) {
            const p1=pairsFound[0];
            wins.push({ type:'Pair', val:t.win2+symbolData[p1.sym].val*2, idx:p1.indices, symbol:p1.sym });
        }
    }

    // Pick best win
    if (wins.length > 0) {
        wins.sort((a,b) => b.val - a.val);
        const best = wins[0];
        base=best.val; matchType=best.type; winningIndices=best.idx;
        isJackpot = matchType.startsWith('JACKPOT');
        winColor  = isJackpot ? 'var(--text-gold)' : 'var(--accent-green)';
    }

    // Tokens
    let mult=1, flatBonus=0, diceHit=false;
    tokens.forEach((tk,i) => {
        if (!tk) return;
        if (activeBossMod?.id==='frozen_slot' && i===frozenSlotIndex) return;
        if (tk.id==='t1') flatBonus += CONFIG.GOLDEN_COIN_BONUS;
        if (tk.id==='t2' && Math.random()<CONFIG.DICE_CHANCE) diceHit=true;
        if (tk.id==='t5' && matchType!=='No Match' && winningIndices.length>0 && currentSymbols[winningIndices[0]]==='🍋')
            mult = Math.max(mult, CONFIG.LEMON_SQUEEZER_MULT);
    });
    if (diceHit) mult *= 2;

    // Pity on no-match (scales with ante)
    let pity = 0;
    if (matchType === 'No Match') {
        pity = CONFIG.PITY_BASE * ante;
        if (tokens.some((t,i) => t?.id==='t6' && !(activeBossMod?.id==='frozen_slot' && i===frozenSlotIndex))) pity *= 3;
    }

    pendingWin = matchType === 'No Match' ? pity + flatBonus : Math.floor(base * mult) + flatBonus;
    pendingWin = Math.max(0, pendingWin);

    // Modal content
    const tp = matchType === 'No Match' ? 0 : base;
    document.getElementById('modal-title').innerText = matchType !== 'No Match' ? '🏆 WINNER!' : '😔 No Match';
    document.getElementById('modal-msg').innerHTML = `
        <div class="result-breakdown">
            <div class="result-row"><span>Result</span><b>${matchType}${diceHit?' <span class="tag tag-dice">🎲 ×2</span>':''}</b></div>
            <div class="result-row"><span>Base Prize</span><b>+${tp}💰</b></div>
            <div class="result-row"><span>Multiplier</span><b>×${mult.toFixed(1)}</b></div>
            ${flatBonus>0?`<div class="result-row"><span>Token Bonus</span><b style="color:var(--blue)">+${flatBonus}💰</b></div>`:''}
            ${pity>0?`<div class="result-row"><span>Pity Pay</span><b style="color:#94a3b8">+${pity}💰</b></div>`:''}
            <hr class="result-divider">
            <div class="result-row result-total"><b>Earned</b><b style="color:var(--green)">${pendingWin}💰</b></div>
            <div class="result-row" style="font-size:0.75rem;opacity:0.7">
                <span>Blind Progress</span>
                <b>${Math.floor(blindEarned)} → ${Math.floor(blindEarned+pendingWin)} / ${blindTarget()}💰</b>
            </div>
        </div>`;
}

function checkReveal() {
    if (!cardActive) return;
    const data = ctx.getImageData(0,0,320,320).data;
    let trans = 0;
    for (let i=3; i<data.length; i+=4) if(data[i]===0) trans++;
    const threshold = CONFIG.REVEAL_BASE - strLvl * CONFIG.REVEAL_STR_STEP;
    if (trans / (320*320) > threshold) triggerReveal();
}

function triggerReveal() {
    if (!cardActive) return;
    cardActive = false;
    crystalBallResult = null;
    ctx.globalCompositeOperation = 'source-over';
    if (winningIndices.length > 0) drawWinEffects(winningIndices, winColor, isJackpot);
    else ctx.clearRect(0, 0, 320, 320);
    setTimeout(() => {
        document.getElementById('modal-overlay').style.display = 'block';
        document.getElementById('result-modal').style.display  = 'block';
    }, winningIndices.length > 0 ? 900 : 300);
}

function autoReveal() { if (cardActive) triggerReveal(); }

function drawWinEffects(indices, color, jackpot) {
    const cells = document.querySelectorAll('.prize-cell');
    ctx.clearRect(0,0,320,320);
    ctx.globalCompositeOperation = 'source-over';
    const glowColor = color==='var(--text-gold)' ? '#f1c40f' : color==='var(--joker-purple)' ? '#a855f7' : '#22c55e';
    indices.forEach(idx => {
        const cell = cells[idx]; if (!cell) return;
        ctx.shadowBlur=24; ctx.shadowColor=glowColor; ctx.strokeStyle=glowColor; ctx.lineWidth=3;
        ctx.strokeRect(cell.offsetLeft+4, cell.offsetTop+4, cell.offsetWidth-8, cell.offsetHeight-8);
        ctx.fillStyle=glowColor+'22'; ctx.fillRect(cell.offsetLeft+4, cell.offsetTop+4, cell.offsetWidth-8, cell.offsetHeight-8);
    });
    ctx.shadowBlur = 0;
    if (jackpot && indices.length>1) {
        const f=cells[indices[0]], l=cells[indices[indices.length-1]];
        ctx.beginPath(); ctx.moveTo(f.offsetLeft+f.offsetWidth/2, f.offsetTop+f.offsetHeight/2);
        ctx.lineTo(l.offsetLeft+l.offsetWidth/2, l.offsetTop+l.offsetHeight/2);
        ctx.lineWidth=6; ctx.lineCap='round'; ctx.strokeStyle=glowColor; ctx.shadowBlur=20; ctx.shadowColor=glowColor; ctx.stroke(); ctx.shadowBlur=0;
    }
}

// Called when player taps COLLECT
function closeModal() {
    // Award coins + blind progress
    coins      += pendingWin;
    blindEarned += pendingWin;
    pendingWin  = 0;

    document.getElementById('result-modal').style.display  = 'none';
    document.getElementById('modal-overlay').style.display = 'none';

    // Reset card to preview state
    document.querySelectorAll('.prize-cell').forEach(c => { c.innerText='?'; c.classList.add('preview-mode'); });
    drawScratchLayer(currentType);
    cardActive     = false;
    currentSymbols = [];

    // Check blind end conditions
    if (cardsRemaining <= 0) {
        document.getElementById('buy-btn').disabled = true;
        evaluateBlindResult();
    } else {
        document.getElementById('buy-btn').disabled = false;
        updateUI();
    }
    saveGame();
}

// Decide pass/fail after last card is collected
function evaluateBlindResult() {
    const target = blindTarget();
    if (blindEarned >= target) {
        // PASS — open shop
        setTimeout(() => openShop(), 400);
    } else {
        // FAIL — game over
        setTimeout(() => showGameOver(target, blindEarned), 400);
    }
}

function resumeActiveCard() {
    document.querySelectorAll('.ticket-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.type === currentType));
    const t = TICKET_TYPES[currentType];
    const grid = document.getElementById('prize-grid');
    grid.style.gridTemplateColumns = `repeat(${t.cols}, 1fr)`;
    grid.innerHTML = '';
    currentSymbols.forEach(s => { const c=document.createElement('div'); c.className='prize-cell'; c.innerHTML=s; grid.appendChild(c); });
    drawScratchLayer(currentType);
    calculateWin(currentSymbols);
    cardActive=true; isDrawing=false;
    document.getElementById('buy-btn').disabled = true;
    if (hasAutoReveal) { const b=document.getElementById('auto-reveal-btn'); if(b) b.style.display='block'; }
}

function showToast(msg, color='#22c55e') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText=msg; t.style.background=color; t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(10px)'; }, 2000);
}
