<?php

require_once 'conexao.php';

// Busca inicial do ranking para carregar rápido na primeira abertura
$rankingInicial = [];
try {
    $stmt = $pdo->query("
        SELECT id, nome, pontuacao, DATE_FORMAT(data_registro, '%d/%m/%Y %H:%i') as data 
        FROM ranking 
        ORDER BY pontuacao DESC, id ASC 
        LIMIT 10
    ");
    $rankingInicial = $stmt->fetchAll();
} catch (Exception $e) {
    // Caso o banco ainda não possua registros
    $rankingInicial = [];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Harry Bross - Jogo com Ranking MySQL</title>
    <link rel="icon" type="image/png" href="assets/moeda_harry.png">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <button type="button" id="btn-mute" class="btn-mute" title="Desativar som">🔊</button>
    <div class="game-container">
        
        <!-- BARRA SUPERIOR (HUD) -->
        <header class="hud-bar">
            <div class="player-info">
                <span class="label">JOGADOR:</span>
                <span class="value" id="hud-player-name">---</span>
            </div>

            <div class="lives-info">
                <span class="label">VIDAS:</span>
                <span class="value" id="lives-count">
                    <img src="assets/coracao.png" class="heart-icon" alt="Vida">
                    <img src="assets/coracao.png" class="heart-icon" alt="Vida">
                    <img src="assets/coracao.png" class="heart-icon" alt="Vida">
                </span>
            </div>

            <div class="coins-info">
                <span class="label">MOEDAS:</span>
                <span class="value" id="coins-count">0</span>
            </div>

            <div class="score-info">
                <span class="label">PONTUAÇÃO:</span>
                <span class="value" id="score-display">0</span>
            </div>
        </header>
        
        <!-- TABULEIRO DO JOGO -->
        <main class="game-board" id="game-board">
            <img src="assets/clouds_harry.png" class="clouds" alt="Nuvens">
            <img src="assets/moeda_harry.png" class="coin" id="coin" alt="Moeda">
            <img src="assets/personagens_correndo/harry_correndo.gif" class="harry" alt="Harry">
            <img src="assets/pipe.png" class="pipe" alt="Obstáculo">
            <span class="jump-tip" id="jump-tip">Pressione ESPAÇO ou clique para pular</span>
        </main>

    </div>

    <!-- 1. TELA DE INÍCIO / INSERIR NOME -->
    <div class="modal-overlay active" id="start-modal">
        <div class="modal-card">
            <div class="modal-header">
                <h1 class="game-title">SUPER HARRY BROSS</h1>
                <p class="game-subtitle">Corra, desvie dos obstáculos e dispute o topo do ranking!</p>
            </div>

            <form class="start-form" id="start-form">
                <div class="input-group">
                    <label for="player-input">DIGITE SEU NOME:</label>
                    <input 
                        type="text" 
                        id="player-input" 
                        placeholder="Ex: Seu Nome" 
                        maxlength="30" 
                        required 
                        autocomplete="off"
                        autofocus
                    >
                </div>

                <div class="character-select">
                    <label class="select-label">ESCOLHA SEU PERSONAGEM:</label>
                    <div class="character-grid" id="character-grid">

                        <label class="character-card">
                            <input type="radio" name="personagem" value="harry" checked>
                            <img src="assets/harry_parado.png" alt="Harry">
                            <main><p>Harry</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="hermione">
                            <img src="assets/hermione_parado.png" alt="Hermione">
                            <main><p>Hermione</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="rony">
                            <img src="assets/rony_parado.png" alt="Rony">
                            <main><p>Rony</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="draco">
                            <img src="assets/draco_parado.png" alt="Draco">
                            <main><p>Draco</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="hagrid">
                            <img src="assets/hagrid_parado.png" alt="Hagrid">
                            <main><p>Hagrid</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="snape">
                            <img src="assets/snape_parado.png" alt="Snape">
                            <main><p>Snape</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="dumbledore">
                            <img src="assets/dumbledore_parado.png" alt="Dumbledore">
                            <main><p>Dumbledore</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="roberto">
                            <img src="assets/personagens_correndo/roberto.png" alt="Roberto">
                            <main><p>Robertin Rex</p></main>
                        </label>

                        <label class="character-card">
                            <input type="radio" name="personagem" value="daniel">
                            <img src="assets/personagens_correndo/daniel.png" alt="Daniel">
                            <main><p>Danrran Frango</p></main>
                        </label>

                    </div>
                </div>

                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="btn-start">INICIAR JOGO</button>
                    <button type="button" class="btn btn-secondary" id="btn-view-ranking">VER RANKING</button>
                </div>
            </form>

            <div class="server-status" id="server-status">
                <span class="status-dot online"></span> Conectado ao MySQL
            </div>
        </div>
    </div>

    <!-- 2. TELA DE GAME OVER & RANKING -->
    <div class="modal-overlay" id="gameover-modal">
        <div class="modal-card gameover-card">
            <div class="modal-header">
                <h2 class="gameover-title">GAME OVER</h2>
                <div class="final-score-box">
                    <div class="final-score-label">SUA PONTUAÇÃO</div>
                    <div class="final-score-num" id="final-score-value">0</div>
                    <div class="save-status" id="save-status-msg"></div>
                </div>
            </div>

            <!-- Tabela com o TOP 10 -->
            <div class="ranking-container">
                <h3 class="ranking-title">🏆 TOP 10 MELHORES PONTUAÇÕES</h3>
                <div class="table-wrapper">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>JOGADOR</th>
                                <th>PONTUAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody id="ranking-body">
                            <?php if (!empty($rankingInicial)): ?>
                                <?php foreach ($rankingInicial as $i => $row): ?>
                                    <tr>
                                        <td class="ranking-pos">
                                            <?= $i === 0 ? '🥇 1º' : ($i === 1 ? '🥈 2º' : ($i === 2 ? '🥉 3º' : ($i + 1) . 'º')) ?>
                                        </td>
                                        <td><strong><?= htmlspecialchars($row['nome']) ?></strong></td>
                                        <td><?= (int)$row['pontuacao'] ?> pts</td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-restart">JOGAR NOVAMENTE</button>
                <button type="button" class="btn btn-secondary" id="btn-change-player">TROCAR PERSONAGEM</button>
            </div>
        </div>
    </div>

    <script src="js/script.js" defer></script>
</body>
</html>