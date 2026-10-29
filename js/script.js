/**
 * Super Harry Bross - Lógica do Jogo com Vidas, Moedas e Ranking MySQL
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const harry = document.querySelector('.harry');
    const pipe = document.querySelector('.pipe');
    const coin = document.getElementById('coin');
    const gameBoard = document.getElementById('game-board');

    // HUD / Barra de Status
    const hudPlayerName = document.getElementById('hud-player-name');
    const livesDisplay = document.getElementById('lives-count');
    const coinsDisplay = document.getElementById('coins-count');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');

    // Modais
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // Sprites dos personagens
    const PERSONAGENS = {
        harry:      { correndo: 'assets/personagens_correndo/harry_correndo.gif', gameover: 'assets/harry_parado.png' },
        hermione:   { correndo: 'assets/personagens_correndo/hermione_correndo.gif', gameover: 'assets/hermione_parado.png' },
        rony:       { correndo: 'assets/personagens_correndo/rony_correndo.gif', gameover: 'assets/rony_parado.png' },
        snape:      { correndo: 'assets/personagens_correndo/snape_correndo.gif', gameover: 'assets/snape_parado.png' },
        hagrid:     { correndo: 'assets/personagens_correndo/hagrid_correndo.gif', gameover: 'assets/hagrid_parado.png' },
        dumbledore: { correndo: 'assets/personagens_correndo/dumbledore_correndo.gif', gameover: 'assets/dumbledore_parado.png' },
        draco:      { correndo: 'assets/personagens_correndo/draco_correndo.gif', gameover: 'assets/draco_parado.png' },
       roberto:    { correndo: 'assets/personagens_correndo/roberto.png', gameover: 'assets/personagens_correndo/roberto.png' },
daniel:     { correndo: 'assets/personagens_correndo/daniel.png',  gameover: 'assets/personagens_correndo/daniel.png' }
    };

    // --- SONS DO JOGO ---
const SONS = {
    pulo:  { src: 'assets/sons/pulando.wav',  volume: 0.5 },
    moeda: { src: 'assets/sons/moeda.wav', volume: 0.6 },
    dano:  { src: 'assets/sons/dano.wav',  volume: 0.7 },
    morte: { src: 'assets/sons/morrendo.wav', volume: 0.8 }
};

// Pré-carrega os arquivos para tocar sem atraso
Object.values(SONS).forEach(s => {
    s.audio = new Audio(s.src);
    s.audio.preload = 'auto';
});

// Estado do mudo (lembra a escolha do jogador)
let somMutado = localStorage.getItem('harry_jump_mudo') === '1';

function tocarSom(nome) {
    if (somMutado) return;
    const s = SONS[nome];
    if (!s) return;
    const som = s.audio.cloneNode();
    som.volume = s.volume;
    som.play().catch(() => {});
}

// Botão de mutar / desmutar
const btnMute = document.getElementById('btn-mute');

function atualizarBotaoMute() {
    if (!btnMute) return;
    btnMute.textContent = somMutado ? '🔇' : '🔊';
    btnMute.title = somMutado ? 'Ativar som' : 'Desativar som';
    btnMute.setAttribute('aria-label', btnMute.title);
}

if (btnMute) {
    atualizarBotaoMute();

    btnMute.addEventListener('click', () => {
        somMutado = !somMutado;
        localStorage.setItem('harry_jump_mudo', somMutado ? '1' : '0');
        atualizarBotaoMute();
        btnMute.blur(); // evita que a barra de espaço aperte o botão em vez de pular
    });
}

    // Variáveis de Estado
    let currentCharacter = 'harry';
    let currentPlayer = '';
    let lives = 3;
    let coins = 0;
    let score = 0;
    
    let isPlaying = false;
    let isInvincible = false;
    let coinCollected = false;
    let blinkInterval = null;

    let gameLoop = null;
    let scoreLoop = null;

    // Recupera dados salvos previamente
    const savedName = localStorage.getItem('harry_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }
    const savedChar = localStorage.getItem('harry_jump_personagem');
    if (savedChar && PERSONAGENS[savedChar]) {
        const radio = document.querySelector(`input[name="personagem"][value="${savedChar}"]`);
        if (radio) radio.checked = true;
    }

    // --- REINÍCIO DA MOEDA VIA EVENTO CSS ---
    if (coin) {
        coin.addEventListener('animationiteration', () => {
            coinCollected = false;
            coin.style.visibility = 'visible';
        });
    }

    // --- ATUALIZAÇÃO DO HUD ---
    function updateLivesDisplay() {
        if (!livesDisplay) return;
        let heartsHTML = '';
        for (let i = 0; i < lives; i++) {
            heartsHTML += '<img src="assets/coracao.png" class="heart-icon" alt="Vida">';
        }
        livesDisplay.innerHTML = heartsHTML || '💀';
    }

    function updateHUD() {
        if (hudPlayerName) hudPlayerName.textContent = currentPlayer || 'Jogador';
        if (coinsDisplay) coinsDisplay.textContent = coins;
        if (scoreDisplay) scoreDisplay.textContent = score;
        updateLivesDisplay();
    }

    // --- EFEITO PONTOS FLUTUANTES (+5 PTS) ---
    function showFloatingScore(x, y) {
        const floatText = document.createElement('span');
        floatText.classList.add('floating-score');
        floatText.innerText = '+5 pts';
        floatText.style.left = `${x}px`;
        floatText.style.top = `${y}px`;

        gameBoard.appendChild(floatText);

        setTimeout(() => {
            floatText.remove();
        }, 800);
    }

    // --- IMUNIDADE SEM CANCELAR O SALTO ---
    function triggerInvincibility() {
        isInvincible = true;

        if (blinkInterval) clearInterval(blinkInterval);

        blinkInterval = setInterval(() => {
            harry.classList.toggle('blink-low');
        }, 100);

        setTimeout(() => {
            clearInterval(blinkInterval);
            harry.classList.remove('blink-low');
            isInvincible = false;
        }, 1200);
    }

    // --- RESET DE ELEMENTOS ---
    function resetElements() {
        pipe.style.animation = '';
        pipe.style.left = '';

        const p = PERSONAGENS[currentCharacter] || PERSONAGENS.harry;
        harry.src = p.correndo;
        harry.style.animation = '';
        harry.style.bottom = '0px';
        harry.style.width = '';
        harry.style.marginLeft = '';
        harry.classList.remove('jump', 'blink-low');

        if (blinkInterval) clearInterval(blinkInterval);
        isInvincible = false;

        if (coin) {
            coin.style.visibility = 'visible';
        }

        gameBoard.classList.remove('running');
        void gameBoard.offsetWidth; // Força recálculo do navegador
    }

    function startGame() {
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        currentCharacter = document.querySelector('input[name="personagem"]:checked')?.value || 'harry';
        
        lives = 3;
        coins = 0;
        score = 0;
        isInvincible = false;
        coinCollected = false;

        resetElements();
        updateHUD();

        isPlaying = true;
        gameBoard.classList.add('running');

        if (jumpTip) jumpTip.style.opacity = '1';

        // Loop de pontuação contínua (1 ponto a cada 150ms)
        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                if (scoreDisplay) scoreDisplay.textContent = score;
            }
        }, 150);

        // Loop principal do jogo (15ms)
        gameLoop = setInterval(runGameLoop, 15);
    }

    function jump() {
        if (!isPlaying || harry.classList.contains('jump')) return;

        harry.classList.add('jump');
        tocarSom('pulo');
        if (jumpTip) jumpTip.style.opacity = '0';

        setTimeout(() => {
            harry.classList.remove('jump');
        }, 500);
    }

    // Função de colisão precisa
    function checkCollision(rect1, rect2) {
        return !(
            rect1.top > rect2.bottom ||
            rect1.right < rect2.left ||
            rect1.bottom < rect2.top ||
            rect1.left > rect2.right
        );
    }

    // --- LOOP PRINCIPAL DO JOGO ---
    function runGameLoop() {
        if (!isPlaying) return;

        const harryRect = harry.getBoundingClientRect();
        const pipeRect = pipe.getBoundingClientRect();
        const coinRect = coin ? coin.getBoundingClientRect() : null;
        const boardRect = gameBoard.getBoundingClientRect();

        // Hitbox do personagem com margem justa de contacto
        const harryHitbox = {
            left: harryRect.left + 15,
            right: harryRect.right - 15,
            top: harryRect.top + 10,
            bottom: harryRect.bottom - 5
        };

        // 1. COLISÃO COM O TUBO (DANO)
        if (checkCollision(harryHitbox, pipeRect)) {
            if (!isInvincible) {
                lives--;
                updateLivesDisplay();

                if (lives <= 0) {
                    triggerGameOver(pipe.offsetLeft, +window.getComputedStyle(harry).bottom.replace('px', ''));
                    return;
                } else {
                    tocarSom('dano');
                    triggerInvincibility();
                }
            }
        }

        // 2. COLISÃO COM A MOEDA (+1 MOEDA E +5 PONTOS)
        if (coinRect && !coinCollected && checkCollision(harryHitbox, coinRect)) {
            coinCollected = true;
            tocarSom('moeda');
            coin.style.visibility = 'hidden';

            coins += 1;
            score += 5;

            if (coinsDisplay) coinsDisplay.textContent = coins;
            if (scoreDisplay) scoreDisplay.textContent = score;

            const posX = coinRect.left - boardRect.left;
            const posY = coinRect.top - boardRect.top;
            showFloatingScore(posX, posY);
        }
    }

    // --- GAME OVER ---
    function triggerGameOver(pipePosition, harryPosition) {
        isPlaying = false;
        tocarSom('morte');
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        if (blinkInterval) clearInterval(blinkInterval);

        gameBoard.classList.remove('running');

        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        harry.style.animation = 'none';
        harry.style.bottom = `${harryPosition}px`;
        
        const p = PERSONAGENS[currentCharacter] || PERSONAGENS.harry;
        harry.src = p.gameover;

        if (finalScoreValue) finalScoreValue.textContent = score;
        if (saveStatusMsg) {
            saveStatusMsg.textContent = 'Salvando pontuação no banco...';
            saveStatusMsg.style.color = '#060071';
        }

        gameoverModal.classList.add('active');
        saveScore(currentPlayer, score);
    }

    // --- SALVAR RANKING (MYSQL) ---
    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: playerName,
                pontuacao: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                if (saveStatusMsg) {
                    saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                    saveStatusMsg.style.color = '#10b981';
                }
                if (data.ranking) renderRanking(data.ranking, playerName, finalScore);
            } else {
                if (saveStatusMsg) {
                    saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                    saveStatusMsg.style.color = '#ef4444';
                }
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            if (saveStatusMsg) {
                saveStatusMsg.textContent = '⚠️ Erro ao conectar ao banco de dados.';
                saveStatusMsg.style.color = '#ef4444';
            }
        });
    }

    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;
        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if (!highlighted && highlightName && item.nome === highlightName && parseInt(item.pontuacao, 10) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontuacao, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --- EVENTOS DE INTERAÇÃO ---
    startForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameValue = playerInput.value.trim();
        if (!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('harry_jump_player', currentPlayer);

        const escolhido = document.querySelector('input[name="personagem"]:checked');
        currentCharacter = escolhido ? escolhido.value : 'harry';
        localStorage.setItem('harry_jump_personagem', currentCharacter);

        startModal.classList.remove('active');
        startGame();
    });

    btnViewRanking.addEventListener('click', () => {
        fetchRanking();
        if (finalScoreValue) finalScoreValue.textContent = '---';
        if (saveStatusMsg) saveStatusMsg.textContent = '';
        startModal.classList.remove('active');
        gameoverModal.classList.add('active');
    });

    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        if (!currentPlayer) {
            startModal.classList.add('active');
            playerInput.focus();
        } else {
            startGame();
        }
    });

    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        resetElements();
        startModal.classList.add('active');
        playerInput.value = '';
        playerInput.focus();
    });

    gameBoard.addEventListener('click', jump);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });
});