// Configuration
const NUM_TEAMS = 4;
const NUM_PLAYERS_PER_TEAM = 15; // จำนวนสมาชิกต่อทีม 
const NUM_GAMES = 3; // จำนวนเกม

// Team names & Player names
// teamNames[team] = string
let teamNames = Array(NUM_TEAMS).fill('').map((_, i) => `ทีม ${i + 1}`);
// Player names: playerNames[team][player] = name
let playerNames = Array(NUM_TEAMS).fill(null).map(() => 
    Array(NUM_PLAYERS_PER_TEAM).fill('')
);

// Initialize scores data structure
// scores[game][team][player] = individual score
let scores = Array(NUM_GAMES).fill(null).map(() => 
    Array(NUM_TEAMS).fill(null).map(() => 
        Array(NUM_PLAYERS_PER_TEAM).fill(0)
    )
);

// Total scores for each team (sum of all games)
let totalScores = [0, 0, 0, 0];

// Scores per game for each team
let gameScores = Array(NUM_GAMES).fill(null).map(() => [0, 0, 0, 0]);

// Individual total scores for each player (across all games)
let playerTotalScores = Array(NUM_TEAMS).fill(null).map(() => 
    Array(NUM_PLAYERS_PER_TEAM).fill(0)
);

// History of submissions (kept until manual reset)
// Each item: { game: number, teamPlayerScores: number[][], timestamp: number }
let historyData = [];

// Check if player names are set
let playerNamesSet = false;

// Current selected team for score input (null = all teams, 0-3 = specific team)
let currentSelectedTeam = null;
let submitLock = false; // ป้องกันการกดซ้ำซ้อนตอนบันทึกคะแนน

// Initialize DOM elements
const playerNamesModal = document.getElementById('player-names-modal');
const playerNamesContainer = document.getElementById('player-names-container');
const saveNamesBtn = document.getElementById('save-names-btn');
const gameSelect = document.getElementById('game-select');
const teamsInputContainer = document.getElementById('teams-input-container');
const submitBtn = document.getElementById('submit-scores');
const resetBtn = document.getElementById('reset-btn');
const teamsDisplay = document.getElementById('teams-display');
const leaderIndicator = document.getElementById('leader-indicator');
const historyContainer = document.getElementById('score-history');
const gameSummaryContainer = document.getElementById('game-summary');
const scoreInputSection = document.getElementById('score-input-section');
const currentTeamTitle = document.getElementById('current-team-title');
const selectedTeamIndicator = document.getElementById('selected-team-indicator');
const editNamesBtn = document.getElementById('edit-names-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelNamesBtn = document.getElementById('cancel-names-btn');

// Initialize player names input
function initializePlayerNamesInput() {
    playerNamesContainer.innerHTML = '';
    
    for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
        const teamSection = document.createElement('div');
        teamSection.className = 'team-names-section';
        teamSection.innerHTML = `
            <h3>
                ทีม ${teamIndex + 1}
                <input 
                    type="text" 
                    class="team-name-input" 
                    data-team-index="${teamIndex}"
                    placeholder="ตั้งชื่อทีม (เช่น Mverge, Blue, Red)" 
                    value="${teamNames[teamIndex] || `ทีม ${teamIndex + 1}`}"
                >
            </h3>
            <div class="player-names-grid">
                ${Array(NUM_PLAYERS_PER_TEAM).fill(0).map((_, playerIndex) => `
                    <div class="player-name-input-group">
                        <label for="name-team-${teamIndex}-player-${playerIndex}">คนที่ ${playerIndex + 1}:</label>
                        <input type="text" 
                               id="name-team-${teamIndex}-player-${playerIndex}" 
                               class="player-name-input"
                               data-team="${teamIndex}"
                               data-player="${playerIndex}"
                               placeholder="กรอกชื่อเล่น"
                               value="${playerNames[teamIndex][playerIndex] || ''}">
                    </div>
                `).join('')}
            </div>
        `;
        playerNamesContainer.appendChild(teamSection);
    }
}

// Initialize team input forms (only for selected team)
function initializeTeamInputs() {
    if (!playerNamesSet) {
        teamsInputContainer.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">กรุณากรอกชื่อเล่นก่อน</p>';
        return;
    }
    
    teamsInputContainer.innerHTML = '';
    
    if (currentSelectedTeam === null) {
        // Show all teams (for admin view)
        for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
            addTeamInputSection(teamIndex);
        }
    } else {
        // Show only selected team
        addTeamInputSection(currentSelectedTeam);
    }
    
    // Add event listeners to calculate team total in real-time
    setTimeout(() => {
        attachScoreInputListeners();
    }, 10);
}

function refreshTeamButtons() {
    document.querySelectorAll('.team-select-btn').forEach(btn => {
        const teamIndex = parseInt(btn.getAttribute('data-team'));
        const labelSpan = btn.querySelector('.team-btn-label');
        if (!isNaN(teamIndex) && labelSpan) {
            labelSpan.textContent = teamNames[teamIndex] || `ทีม ${teamIndex + 1}`;
        }
    });
}

// Add team input section
function addTeamInputSection(teamIndex) {
    const teamInputSection = document.createElement('div');
    teamInputSection.className = 'team-input-section';
    
    // Get players with names for this team
    const playersWithNames = [];
    for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
        if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
            playersWithNames.push({
                index: playerIndex,
                name: playerNames[teamIndex][playerIndex]
            });
        }
    }
    
    teamInputSection.innerHTML = `
        <div class="team-input-header">
            <h4>${teamNames[teamIndex] || `ทีม ${teamIndex + 1}`}</h4>
            <div class="team-total-preview">
                <span>รวม: <span id="team-${teamIndex}-total-preview">0</span></span>
            </div>
        </div>
        <div id="team-${teamIndex}-score-warning" class="score-warning" style="display: none;"></div>
        <div class="players-input-grid">
            ${playersWithNames.map(player => `
                <div class="player-input-group">
                    <label for="team-${teamIndex}-player-${player.index}">${player.name}:</label>
                    <input type="number" 
                           id="team-${teamIndex}-player-${player.index}" 
                           class="player-score-input"
                           data-team="${teamIndex}"
                           data-player="${player.index}"
                           min="0" 
                           step="1" 
                           placeholder="0">
                </div>
            `).join('')}
        </div>
    `;
    teamsInputContainer.appendChild(teamInputSection);
}

// Clamp/clean input และเชื่อมกับการคำนวณผลรวม
function attachScoreInputListeners() {
    document.querySelectorAll('.player-score-input').forEach(input => {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        const handleInput = () => {
            sanitizeScoreField(newInput);
            calculateTeamTotals();
        };
        newInput.addEventListener('input', handleInput);
        newInput.addEventListener('change', handleInput);
    });
}

// แปลงค่าสกอร์ให้เป็นจำนวนเต็มไม่ติดลบ
function sanitizeScoreField(inputEl) {
    if (!inputEl) return;
    const raw = inputEl.value;
    if (raw === '') return; // อนุญาตว่างเพื่อให้ผู้ใช้พิมพ์ต่อ
    const num = Math.max(0, Math.floor(Number(raw) || 0));
    inputEl.value = num;
}

function sanitizeScoreValue(raw) {
    if (raw === '' || raw === null || raw === undefined) return 0;
    return Math.max(0, Math.floor(Number(raw) || 0));
}

function hasNamedPlayers(teamIndex) {
    for (let i = 0; i < NUM_PLAYERS_PER_TEAM; i++) {
        if (playerNames[teamIndex][i] && playerNames[teamIndex][i].trim() !== '') return true;
    }
    return false;
}

// Calculate team totals from individual scores
function calculateTeamTotals() {
    // Only calculate for the selected team or all teams
    const teamsToCalculate = currentSelectedTeam !== null ? [currentSelectedTeam] : [0, 1, 2, 3];
    
    teamsToCalculate.forEach(teamIndex => {
        let teamTotal = 0;
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
            if (input) {
                const value = parseInt(input.value) || 0;
                teamTotal += Math.max(0, value);
            }
        }
        
        const previewElement = document.getElementById(`team-${teamIndex}-total-preview`);
        if (previewElement) {
            previewElement.textContent = teamTotal;
        }
    });
    
    // ไม่ต้องเช็ค limit ของคะแนนรวมแล้ว
}

// เดิมเคยเช็ค limit คะแนนรวม ตอนนี้ไม่จำเป็นแล้ว เลยเว้นฟังก์ชันว่างไว้
function checkTotalScoreLimit() {}

// Update score display with ranking
function updateScoreDisplay() {
    // Create array of teams with scores and sort by score (descending)
    const teams = totalScores.map((score, index) => ({
        teamNumber: index + 1,
        score: score,
        index: index,
        playerScores: playerTotalScores[index]
    })).sort((a, b) => b.score - a.score);
    
    // Clear and rebuild scoreboard
    teamsDisplay.innerHTML = '';
    
    teams.forEach((team, rankIndex) => {
        const rank = rankIndex + 1;
        const teamCard = document.createElement('div');
        teamCard.className = `team-card rank-${rank}`;
        teamCard.setAttribute('data-team', team.index);
        
        // Determine status text
        let statusText = '';
        if (rank === 1 && team.score > 0) {
            statusText = '👑 นำ';
        } else if (rank === 2 && team.score > 0) {
            statusText = '🥈 อันดับ 2';
        } else if (rank === 3 && team.score > 0) {
            statusText = '🥉 อันดับ 3';
        }
        
        // Create individual scores display - show all players with names
        const playersWithNames = [];
        for (let idx = 0; idx < NUM_PLAYERS_PER_TEAM; idx++) {
            const name = playerNames[team.index][idx];
            if (name && name.trim() !== '') {
                // Get scores per game for this player
                const gameScoresForPlayer = [];
                for (let gameIdx = 0; gameIdx < NUM_GAMES; gameIdx++) {
                    gameScoresForPlayer.push(scores[gameIdx][team.index][idx] || 0);
                }
                const totalScore = team.playerScores[idx] || 0;
                
                playersWithNames.push({
                    score: totalScore,
                    gameScores: gameScoresForPlayer,
                    idx: idx + 1,
                    name: name
                });
            }
        }
        
        // Sort players by score (highest first)
        playersWithNames.sort((a, b) => b.score - a.score);
        
        // Create individual scores display with game breakdown
        let individualScores = '';
        if (playersWithNames.length > 0) {
            individualScores = playersWithNames.map((p, index) => {
                const gameScoresStr = p.gameScores.map((gs, gi) => 
                    `<span class="game-score-badge">เกม${gi + 1}: ${gs}</span>`
                ).join('');
                const isTopPlayer = index === 0 && p.score > 0;
                return `
                    <div class="player-score-item ${p.score > 0 ? 'has-score' : ''} ${isTopPlayer ? 'top-player' : ''}">
                        ${isTopPlayer ? '<span class="top-player-badge">🏆</span>' : ''}
                        <div class="player-name-score">
                            <span class="player-name">${p.name}</span>
                            <span class="player-total-score">รวม: ${p.score}</span>
                        </div>
                        <div class="player-game-scores">${gameScoresStr}</div>
                    </div>
                `;
            }).join('');
        } else {
            individualScores = '<div class="player-score-item" style="opacity:0.6;">ยังไม่มีชื่อเล่น</div>';
        }
        
        // Get game scores for this team
        const teamGameScores = [];
        for (let gameIdx = 0; gameIdx < NUM_GAMES; gameIdx++) {
            teamGameScores.push(gameScores[gameIdx][team.index] || 0);
        }
        const gameScoresDisplay = teamGameScores.map((gs, gi) => 
            `<span class="team-game-score">เกม${gi + 1}: ${gs}</span>`
        ).join('');
        
        teamCard.innerHTML = `
            <div class="team-left">
                <div class="team-rank">${rank}</div>
                <div class="team-info">
                    <div class="team-name">${teamNames[team.index] || `ทีม ${team.teamNumber}`}</div>
                    ${statusText ? `<div class="team-status">${statusText}</div>` : ''}
                    <div class="team-game-scores-summary">${gameScoresDisplay}</div>
                </div>
            </div>
            <div class="team-score">
                <div class="team-score-label">รวมทั้ง 3 เกม</div>
                <div class="team-score-value">${team.score}</div>
            </div>
            <div class="team-players-scores">
                <div class="players-scores-header">คะแนนเดี่ยวของสมาชิก:</div>
                <div class="players-scores-list">${individualScores}</div>
            </div>
        `;
        
        teamsDisplay.appendChild(teamCard);
    });
    
    // Update leader indicator
    const leader = teams[0];
    if (leader && leader.score > 0) {
        const isTie = teams.filter(t => t.score === leader.score).length > 1;
        if (isTie) {
            const tiedTeams = teams.filter(t => t.score === leader.score);
            leaderIndicator.innerHTML = `🤝 เสมอกัน: ${tiedTeams.map(t => teamNames[t.index] || `ทีม ${t.teamNumber}`).join(', ')} (${leader.score} คะแนน)`;
        } else {
            leaderIndicator.innerHTML = `🏆 ${teamNames[leader.index] || `ทีม ${leader.teamNumber}`} นำ! (${leader.score} คะแนน)`;
        }
    } else {
        leaderIndicator.innerHTML = 'เริ่มต้นเกม - ยังไม่มีคะแนน';
    }
}

// Calculate total scores
function calculateTotalScores() {
    totalScores = [0, 0, 0, 0];
    playerTotalScores = Array(NUM_TEAMS).fill(null).map(() => 
        Array(NUM_PLAYERS_PER_TEAM).fill(0)
    );
    gameScores = Array(NUM_GAMES).fill(null).map(() => [0, 0, 0, 0]);
    
    scores.forEach((gameScoresData, gameIndex) => {
        gameScoresData.forEach((teamScores, teamIndex) => {
            let gameTotal = 0;
            teamScores.forEach((playerScore, playerIndex) => {
                playerTotalScores[teamIndex][playerIndex] += playerScore;
                totalScores[teamIndex] += playerScore;
                gameTotal += playerScore;
            });
            gameScores[gameIndex][teamIndex] = gameTotal;
        });
    });
    updateScoreDisplay();
    updateGameSummary();
}

// Update game summary
function updateGameSummary() {
    gameSummaryContainer.innerHTML = '';
    
    for (let gameIndex = 0; gameIndex < NUM_GAMES; gameIndex++) {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-summary-card';
        
        const gameTeams = gameScores[gameIndex]
            .map((score, index) => ({ teamNumber: index + 1, score, index }))
            .sort((a, b) => b.score - a.score);
        
        gameCard.innerHTML = `
            <h3>เกมที่ ${gameIndex + 1}</h3>
            <div class="game-teams-scores">
                ${gameTeams.map((team, rankIndex) => `
                    <div class="game-team-score ${rankIndex === 0 && team.score > 0 ? 'winner' : ''}">
                        <span class="game-team-rank">${rankIndex + 1}</span>
                        <span class="game-team-name">${teamNames[team.index] || `ทีม ${team.teamNumber}`}</span>
                        <span class="game-team-total">${team.score} คะแนน</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        gameSummaryContainer.appendChild(gameCard);
    }
}

// Internal: render a single history item to the DOM
function renderHistoryItem(game, teamPlayerScores) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const gameNum = parseInt(game) + 1;
    
    // Calculate team totals from individual scores
    const teamTotals = teamPlayerScores.map(teamScores => 
        teamScores.reduce((sum, score) => sum + score, 0)
    );
    
    historyItem.innerHTML = `
        <div class="history-item-header">
            เกมที่ ${gameNum}
        </div>
        <div class="history-scores">
            ${teamTotals.map((teamTotal, teamIndex) => {
                // Only show players with scores > 0
                const playersWithScores = teamPlayerScores[teamIndex]
                    .map((score, idx) => ({ 
                        score, 
                        idx: idx + 1,
                        name: playerNames[teamIndex][idx] || `คน${idx + 1}`
                    }))
                    .filter(p => p.score > 0);
                
                let individualScores = '';
                if (playersWithScores.length > 0) {
                    if (playersWithScores.length <= 10) {
                        // Show all if 10 or fewer
                        individualScores = playersWithScores.map(p => 
                            `<span class="history-individual">${p.name}: ${p.score}</span>`
                        ).join('');
                    } else {
                        // Show first 8 and count
                        const shown = playersWithScores.slice(0, 8);
                        const remaining = playersWithScores.length - 8;
                        individualScores = shown.map(p => 
                            `<span class="history-individual">${p.name}: ${p.score}</span>`
                        ).join('') + `<span class="history-individual">+${remaining} คน</span>`;
                    }
                } else {
                    individualScores = '<span class="history-individual" style="opacity:0.5;">ไม่มีคะแนน</span>';
                }
                
                return `
                    <div class="history-score-item">
                        <span class="history-team-name">${teamNames[teamIndex] || `ทีม ${teamIndex + 1}`}</span>
                        <div class="history-individual-scores">${individualScores}</div>
                        <span class="score-value">รวม: ${teamTotal}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
}

// Add score to history (and keep in memory)
function addToHistory(game, teamPlayerScores) {
    // เก็บแค่ 1 ประวัติต่อเกม (อัปเดตทับของเดิม)
    historyData = historyData.filter(entry => entry.game !== game);
    historyData.push({
        game,
        teamPlayerScores,
        timestamp: Date.now()
    });
    
    // ลบ DOM เดิมของเกมนี้ก่อน เพื่อไม่ให้แสดงซ้ำ
    const historyItems = historyContainer.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        const header = item.querySelector('.history-item-header');
        if (header && header.textContent.includes(`เกมที่ ${game + 1}`)) {
            item.remove();
        }
    });
    
    renderHistoryItem(game, teamPlayerScores);
}

// Load existing scores for current game
function loadCurrentScores() {
    if (!playerNamesSet) {
        return;
    }
    
    // Don't reload if user is typing
    if (isUserTyping()) {
        return;
    }
    
    const game = parseInt(gameSelect.value);
    
    // Save current input values before rebuilding
    const currentInputValues = {};
    document.querySelectorAll('.player-score-input').forEach(input => {
        const teamIndex = input.getAttribute('data-team');
        const playerIndex = input.getAttribute('data-player');
        if (teamIndex !== null && playerIndex !== null && input.value !== '') {
            const key = `${teamIndex}-${playerIndex}`;
            currentInputValues[key] = input.value;
        }
    });
    
    // Rebuild input forms with current game scores
    initializeTeamInputs();
    
    // Wait a bit for DOM to update
    setTimeout(() => {
        // Load scores for players with names
        for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
            for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
                if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
                    const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                    if (input) {
                        const key = `${teamIndex}-${playerIndex}`;
                        // Use current value if user was typing, otherwise use saved score
                        if (currentInputValues[key] !== undefined) {
                            input.value = currentInputValues[key];
                        } else {
                            input.value = scores[game][teamIndex][playerIndex] || '';
                        }
                    }
                }
            }
        }
        calculateTeamTotals();
    }, 50);
}

// Submit scores
submitBtn.addEventListener('click', () => {
    if (!playerNamesSet) {
        alert('กรุณากรอกชื่อเล่นก่อน');
        playerNamesModal.style.display = 'flex';
        return;
    }
    if (submitLock) return;
    
    const game = parseInt(gameSelect.value);
    
    // Validate scores (เฉพาะเช็คว่าต้องเป็นเลขไม่ติดลบ) สำหรับทีมที่เลือก
    if (currentSelectedTeam !== null) {
        const teamIndex = currentSelectedTeam;
        if (!hasNamedPlayers(teamIndex)) {
            alert('ทีมนี้ยังไม่มีชื่อผู้เล่น กรุณากรอกก่อน');
            return;
        }
        let teamTotal = 0;
        
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
                const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                if (input) {
                    const value = sanitizeScoreValue(input.value);
                    if (value < 0) {
                        alert(`⚠️ คะแนนของ ${playerNames[teamIndex][playerIndex]} ต้องไม่ติดลบ`);
                        return;
                    }
                    teamTotal += value;
                }
            }
        }
        
        // ไม่ต้องเช็คเพดานคะแนนรวมแล้ว
    }
    
    submitLock = true;
    submitBtn.disabled = true;
    
    // Prepare scores update: start from existing scores to avoid clearing other teams
    const teamPlayerScores = scores[game].map(teamScores => [...teamScores]);
    
    if (currentSelectedTeam !== null) {
        // Update only the selected team; keep others as-is
        const teamIndex = currentSelectedTeam;
        const teamScores = [...scores[game][teamIndex]];
        
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
                const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                if (input) {
                    const value = sanitizeScoreValue(input.value);
                    teamScores[playerIndex] = Math.max(0, value); // Ensure non-negative
                }
            }
        }
        teamPlayerScores[teamIndex] = teamScores;
    } else {
        // Admin view: update all visible teams (all inputs exist)
        for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
            const teamScores = [...scores[game][teamIndex]];
            for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
                if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
                    const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                    if (input) {
                        const value = sanitizeScoreValue(input.value);
                        teamScores[playerIndex] = Math.max(0, value); // Ensure non-negative
                    }
                }
            }
            teamPlayerScores[teamIndex] = teamScores;
        }
    }
    
    // Check if scores are already entered
    const alreadyEntered = scores[game].some(teamScores => 
        teamScores.some(score => score > 0)
    );
    
    if (alreadyEntered) {
        // Update existing scores - subtract old scores first
        for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
            for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
                const oldScore = scores[game][teamIndex][playerIndex];
                const newScore = teamPlayerScores[teamIndex][playerIndex];
                
                playerTotalScores[teamIndex][playerIndex] -= oldScore;
                playerTotalScores[teamIndex][playerIndex] += newScore;
                totalScores[teamIndex] -= oldScore;
                totalScores[teamIndex] += newScore;
                
                scores[game][teamIndex][playerIndex] = newScore;
            }
        }
        calculateTotalScores();
        
        // Keepประวัติทุกรอบ ไม่ลบของเก่า
        addToHistory(game, teamPlayerScores);
    } else {
        // Save new scores
        for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
            for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
                const score = teamPlayerScores[teamIndex][playerIndex];
                scores[game][teamIndex][playerIndex] = score;
                playerTotalScores[teamIndex][playerIndex] += score;
                totalScores[teamIndex] += score;
            }
        }
        calculateTotalScores();
        addToHistory(game, teamPlayerScores);
    }
    
    // Clear inputs
    initializeTeamInputs();
    loadCurrentScores(); // Refill inputs (selected team or all teams) with saved scores so they stay visible
    
    // Show success message
    submitBtn.textContent = '✓ บันทึกสำเร็จ!';
    submitBtn.style.background = '#27ae60';
    submitBtn.disabled = false;
    submitLock = false;
    setTimeout(() => {
        submitBtn.textContent = 'บันทึกคะแนน';
        submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 1500);
});

// Open modal to edit player names
editNamesBtn.addEventListener('click', () => {
    // Stop sync while modal is open
    // Reload player names into inputs
    initializePlayerNamesInput();
    playerNamesModal.style.display = 'flex';
    
    // Prevent sync from interfering
    const modalInputs = playerNamesContainer.querySelectorAll('input');
    modalInputs.forEach(input => {
        // Save value on blur to prevent loss
        input.addEventListener('blur', function() {
            const teamIndex = parseInt(this.getAttribute('data-team'));
            const playerIndex = parseInt(this.getAttribute('data-player'));
            if (teamIndex !== null && playerIndex !== null) {
                playerNames[teamIndex][playerIndex] = this.value.trim();
            }
        });
    });
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    playerNamesModal.style.display = 'none';
});

cancelNamesBtn.addEventListener('click', () => {
    playerNamesModal.style.display = 'none';
});

// Close modal when clicking outside
playerNamesModal.addEventListener('click', (e) => {
    if (e.target === playerNamesModal) {
        playerNamesModal.style.display = 'none';
    }
});

// Save player names
saveNamesBtn.addEventListener('click', () => {
    // เก็บชื่อทีมจากช่อง team-name-input
    const teamNameInputs = document.querySelectorAll('.team-name-input');
    teamNameInputs.forEach(input => {
        const teamIndex = parseInt(input.getAttribute('data-team-index'));
        if (!isNaN(teamIndex)) {
            const name = input.value.trim();
            teamNames[teamIndex] = name || `ทีม ${teamIndex + 1}`;
        }
    });
    
    for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            const input = document.getElementById(`name-team-${teamIndex}-player-${playerIndex}`);
            if (input) {
                playerNames[teamIndex][playerIndex] = input.value.trim();
            }
        }
    }
    playerNamesSet = true;
    playerNamesModal.style.display = 'none';
    saveToLocalStorage();
    saveNamesToFirebase(); // Sync to Firebase
    
    // อัปเดตปุ่มเลือกทีมให้ใช้ชื่อทีมใหม่
    refreshTeamButtons();
    
    // If team is already selected, initialize inputs
    if (currentSelectedTeam !== null) {
        initializeTeamInputs();
        loadCurrentScores();
    }
    
    // Update scoreboard to show new names
    updateScoreDisplay();
});

// Reset all scores
resetBtn.addEventListener('click', () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตคะแนนทั้งหมด?')) {
        // Reset in-memory data
        scores = Array(NUM_GAMES).fill(null).map(() => 
            Array(NUM_TEAMS).fill(null).map(() => 
                Array(NUM_PLAYERS_PER_TEAM).fill(0)
            )
        );
        totalScores = [0, 0, 0, 0];
        playerTotalScores = Array(NUM_TEAMS).fill(null).map(() => 
            Array(NUM_PLAYERS_PER_TEAM).fill(0)
        );
        gameScores = Array(NUM_GAMES).fill(null).map(() => [0, 0, 0, 0]);
        
        // Reset history data and UI
        historyData = [];
        calculateTotalScores();
        historyContainer.innerHTML = '';
        loadCurrentScores();
        updateGameSummary();
        updateScoreDisplay();
        
        // Reset Firebase
        if (firebaseInitialized && typeof database !== 'undefined') {
            database.ref('scores').remove();
        }
        // Reset localStorage
        localStorage.removeItem('gameScores');
        localStorage.removeItem('totalScores');
        localStorage.removeItem('playerTotalScores');
        localStorage.removeItem('gameScoresData');
        localStorage.removeItem('historyData');
    }
});

// Team selector buttons
document.querySelectorAll('.team-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const teamIndex = parseInt(btn.getAttribute('data-team'));
        currentSelectedTeam = teamIndex;
        
        // Update UI
        document.querySelectorAll('.team-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const teamLabel = teamNames[teamIndex] || `ทีม ${teamIndex + 1}`;
        selectedTeamIndicator.innerHTML = `📝 คุณกำลังกรอกคะแนนสำหรับ <strong>${teamLabel}</strong>`;
        currentTeamTitle.textContent = `กรอกคะแนนเดี่ยว - ${teamLabel} (คะแนนทีมจะคำนวณอัตโนมัติ)`;
        
        scoreInputSection.style.display = 'block';
        updateMaxScoreDisplay();
        initializeTeamInputs();
        loadCurrentScores();
        
        // Save selected team
        localStorage.setItem('selectedTeam', teamIndex);
    });
});

// Load selected team from localStorage
const savedSelectedTeam = localStorage.getItem('selectedTeam');
if (savedSelectedTeam !== null) {
    const teamIndex = parseInt(savedSelectedTeam);
    currentSelectedTeam = teamIndex;
    const btn = document.querySelector(`.team-select-btn[data-team="${teamIndex}"]`);
    if (btn) {
        btn.click();
    }
}
// ถ้าไม่มีทีมถูกเลือก ให้แสดงส่วนกรอกคะแนนพร้อมข้อความบอกให้เลือกทีม
if (currentSelectedTeam === null && scoreInputSection) {
    scoreInputSection.style.display = 'block';
    selectedTeamIndicator.innerHTML = 'เลือกทีมด้านบนเพื่อเริ่มกรอกคะแนน';
}

// Load scores when game changes
// Update max score display when game changes
function updateMaxScoreDisplay() {
    const currentGame = parseInt(gameSelect.value);
    const maxScoreElement = document.getElementById('current-game-max-score');
    if (maxScoreElement) {
        maxScoreElement.textContent = `กำลังกรอกคะแนน: เกมที่ ${currentGame + 1}`;
    }
}

gameSelect.addEventListener('change', () => {
    updateMaxScoreDisplay();
    loadCurrentScores();
});


// Check if user is currently typing in score inputs
function isUserTyping() {
    const activeElement = document.activeElement;
    return activeElement && activeElement.classList.contains('player-score-input');
}

// Firebase Realtime Sync Functions
let firebaseInitialized = false;
let syncEnabled = true;

// Sync status indicator
const syncStatusEl = document.getElementById('sync-status');
const syncIndicatorEl = document.getElementById('sync-indicator');
const syncTextEl = document.getElementById('sync-text');

function updateSyncStatus(status) {
    if (!syncStatusEl) return;
    
    syncStatusEl.style.display = 'inline-flex';
    syncStatusEl.className = 'sync-status';
    
    switch(status) {
        case 'syncing':
            syncIndicatorEl.textContent = '🔄';
            syncTextEl.textContent = 'กำลัง sync...';
            break;
        case 'synced':
            syncStatusEl.classList.add('synced');
            syncIndicatorEl.textContent = '✅';
            syncTextEl.textContent = 'Sync สำเร็จ';
            setTimeout(() => {
                syncStatusEl.style.display = 'none';
            }, 2000);
            break;
        case 'error':
            syncStatusEl.classList.add('error');
            syncIndicatorEl.textContent = '❌';
            syncTextEl.textContent = 'Sync ไม่สำเร็จ (ใช้ localStorage)';
            break;
        case 'offline':
            syncStatusEl.classList.add('error');
            syncIndicatorEl.textContent = '📴';
            syncTextEl.textContent = 'ออฟไลน์ (ใช้ localStorage)';
            break;
    }
}

// Initialize Firebase sync
function initFirebaseSync() {
    if (typeof firebase === 'undefined' || typeof database === 'undefined' || !database) {
        console.warn('Firebase not initialized, using localStorage only');
        updateSyncStatus('offline');
        return;
    }
    
    firebaseInitialized = true;
    updateSyncStatus('syncing');
    
    // Listen for real-time changes
    const scoresRef = database.ref('scores');
    const namesRef = database.ref('playerNames');
    const teamNamesRef = database.ref('teamNames');
    
    // Listen to scores changes
    scoresRef.on('value', (snapshot) => {
        if (!syncEnabled) return;
        
        updateSyncStatus('syncing');
        const data = snapshot.val();
        if (data) {
            // Don't sync if modal is open or user is typing
            if (playerNamesModal && playerNamesModal.style.display === 'flex') return;
            if (isUserTyping()) return;
            
            // Save current input values before syncing
            const currentInputValues = {};
            document.querySelectorAll('.player-score-input').forEach(input => {
                const teamIndex = input.getAttribute('data-team');
                const playerIndex = input.getAttribute('data-player');
                if (teamIndex !== null && playerIndex !== null && input.value !== '') {
                    const key = `${teamIndex}-${playerIndex}`;
                    currentInputValues[key] = input.value;
                }
            });
            
            scores = data.scores || scores;
            totalScores = data.totalScores || totalScores;
            gameScores = data.gameScores || gameScores;
            playerTotalScores = data.playerTotalScores || playerTotalScores;
            historyData = data.historyData || historyData;
            teamNames = data.teamNames || teamNames;
            
            calculateTotalScores();
            updateScoreDisplay();
            updateGameSummary();
            rebuildHistory();
            refreshTeamButtons();
            
            // Reload current scores if not typing
            if (currentSelectedTeam !== null && Object.keys(currentInputValues).length === 0) {
                loadCurrentScores();
            } else {
                // Restore user input values
                Object.keys(currentInputValues).forEach(key => {
                    const [teamIndex, playerIndex] = key.split('-');
                    const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                    if (input) {
                        input.value = currentInputValues[key];
                    }
                });
            }
            
            updateSyncStatus('synced');
        }
    }, (error) => {
        console.error('Firebase sync error:', error);
        updateSyncStatus('error');
    });
    
    // Listen to player names changes
    namesRef.on('value', (snapshot) => {
        if (!syncEnabled) return;
        
        const data = snapshot.val();
        if (data && playerNamesModal && playerNamesModal.style.display !== 'flex') {
            playerNames = data;
            playerNamesSet = true;
            if (currentSelectedTeam !== null) {
                initializeTeamInputs();
                loadCurrentScores();
            }
            updateScoreDisplay();
        }
    });
    
    // Listen to team name changes
    teamNamesRef.on('value', (snapshot) => {
        if (!syncEnabled) return;
        const data = snapshot.val();
        if (data) {
            teamNames = data;
            refreshTeamButtons();
            updateScoreDisplay();
            updateGameSummary();
        }
    });
}

// Save to Firebase
function saveToFirebase() {
    if (!firebaseInitialized || typeof database === 'undefined') {
        saveToLocalStorage(); // Fallback to localStorage
        return;
    }
    
    syncEnabled = false; // Prevent sync loop
    
    const data = {
        scores,
        totalScores,
        gameScores,
        playerTotalScores,
        historyData,
        teamNames,
        lastUpdated: Date.now()
    };
    
    database.ref('scores').set(data).then(() => {
        syncEnabled = true;
        updateSyncStatus('synced');
        // Also save to localStorage as backup
        saveToLocalStorage();
    }).catch((error) => {
        console.error('Firebase save error:', error);
        syncEnabled = true;
        updateSyncStatus('error');
        saveToLocalStorage(); // Fallback
    });
}

// Save player names to Firebase
function saveNamesToFirebase() {
    if (!firebaseInitialized || typeof database === 'undefined') {
        saveToLocalStorage();
        return;
    }
    
    syncEnabled = false;
    
    Promise.all([
        database.ref('playerNames').set(playerNames),
        database.ref('teamNames').set(teamNames)
    ]).then(() => {
        syncEnabled = true;
        saveToLocalStorage();
    }).catch((error) => {
        console.error('Firebase save error:', error);
        syncEnabled = true;
        saveToLocalStorage();
    });
}

// Load from Firebase on startup
function loadFromFirebase() {
    if (!firebaseInitialized || typeof database === 'undefined') {
        loadFromLocalStorage();
        return;
    }
    
    database.ref('scores').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            scores = data.scores || scores;
            totalScores = data.totalScores || totalScores;
            gameScores = data.gameScores || gameScores;
            playerTotalScores = data.playerTotalScores || playerTotalScores;
            historyData = data.historyData || historyData;
            teamNames = data.teamNames || teamNames;
            calculateTotalScores();
            updateScoreDisplay();
            updateGameSummary();
            rebuildHistory();
            refreshTeamButtons();
        } else {
            loadFromLocalStorage(); // Fallback
        }
    }).catch(() => {
        loadFromLocalStorage(); // Fallback
    });
    
    database.ref('playerNames').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            playerNames = data;
            playerNamesSet = true;
            playerNamesModal.style.display = 'none';
            if (currentSelectedTeam !== null) {
                initializeTeamInputs();
                loadCurrentScores();
            }
        } else {
            const savedNames = localStorage.getItem('playerNames');
            if (savedNames) {
                playerNames = JSON.parse(savedNames);
                playerNamesSet = true;
                playerNamesModal.style.display = 'none';
            }
        }
    }).catch(() => {
        loadFromLocalStorage();
    });
    
    database.ref('teamNames').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            teamNames = data;
            refreshTeamButtons();
            updateScoreDisplay();
            updateGameSummary();
        } else {
            const savedTeamNamesLS = localStorage.getItem('teamNames');
            if (savedTeamNamesLS) {
                try {
                    const parsedTeamNames = JSON.parse(savedTeamNamesLS);
                    if (Array.isArray(parsedTeamNames) && parsedTeamNames.length === NUM_TEAMS) {
                        teamNames = parsedTeamNames;
                        refreshTeamButtons();
                    }
                } catch (e) {
                    // ignore parse errors
                }
            }
        }
    }).catch(() => {
        // ignore, localStorage fallback covers
    });
}

// Auto-sync data from localStorage (fallback for same browser tabs)
function syncData() {
    // Don't sync if modal is open (user is editing names)
    if (playerNamesModal && playerNamesModal.style.display === 'flex') {
        return;
    }
    
    // Don't sync if user is typing in score inputs
    if (isUserTyping()) {
        return;
    }
    
    // If Firebase is initialized, it handles sync automatically
    if (firebaseInitialized) {
        return;
    }
    
    // Fallback: use localStorage sync for same browser tabs
    loadFromLocalStorage();
    if (playerNamesSet) {
        updateScoreDisplay();
        updateGameSummary();
        if (currentSelectedTeam !== null) {
            loadCurrentScores();
        }
    }
}

// Check for data changes every 2 seconds (fallback only)
if (!firebaseInitialized) {
    setInterval(syncData, 2000);
}

// Also listen to storage events (for same browser, different tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'gameScores' || e.key === 'playerNames' || e.key === 'totalScores') {
        syncData();
    }
});

// Initialize
initializePlayerNamesInput();

// Check for saved names (will be loaded by Firebase or localStorage)
const savedNames = localStorage.getItem('playerNames');
if (savedNames) {
    try {
        playerNames = JSON.parse(savedNames);
        playerNamesSet = true;
        playerNamesModal.style.display = 'none';
    } catch (e) {
        playerNamesModal.style.display = 'flex';
    }
} else {
    playerNamesModal.style.display = 'flex';
}

// โหลดชื่อทีมจาก localStorage ถ้ามี
const savedTeamNames = localStorage.getItem('teamNames');
if (savedTeamNames) {
    try {
        const parsedTeamNames = JSON.parse(savedTeamNames);
        if (Array.isArray(parsedTeamNames) && parsedTeamNames.length === NUM_TEAMS) {
            teamNames = parsedTeamNames;
        }
    } catch (e) {
        // ใช้ค่า default ต่อไป
    }
}

if (playerNamesSet) {
    updateMaxScoreDisplay();
    initializeTeamInputs();
}
refreshTeamButtons();
updateScoreDisplay();
updateGameSummary();
if (playerNamesSet) {
    loadCurrentScores();
}

// Auto-save to localStorage (backup)
function saveToLocalStorage() {
    localStorage.setItem('gameScores', JSON.stringify(scores));
    localStorage.setItem('totalScores', JSON.stringify(totalScores));
    localStorage.setItem('playerTotalScores', JSON.stringify(playerTotalScores));
    localStorage.setItem('playerNames', JSON.stringify(playerNames));
    localStorage.setItem('gameScoresData', JSON.stringify(gameScores));
    localStorage.setItem('historyData', JSON.stringify(historyData));
    localStorage.setItem('teamNames', JSON.stringify(teamNames));
}

function loadFromLocalStorage() {
    // Don't load player names if modal is open (user is editing)
    const isModalOpen = playerNamesModal && playerNamesModal.style.display === 'flex';
    
    const savedScores = localStorage.getItem('gameScores');
    const savedTotalScores = localStorage.getItem('totalScores');
    const savedPlayerTotalScores = localStorage.getItem('playerTotalScores');
    const savedGameScores = localStorage.getItem('gameScoresData');
    const savedHistoryData = localStorage.getItem('historyData');
    const savedTeamNames = localStorage.getItem('teamNames');
    
    if (savedScores) {
        scores = JSON.parse(savedScores);
    }
    if (savedTotalScores) {
        totalScores = JSON.parse(savedTotalScores);
    }
    if (savedPlayerTotalScores) {
        playerTotalScores = JSON.parse(savedPlayerTotalScores);
    }
    if (savedGameScores) {
        gameScores = JSON.parse(savedGameScores);
    }
    if (savedHistoryData) {
        try {
            historyData = JSON.parse(savedHistoryData);
        } catch (e) {
            historyData = [];
        }
    }
    if (savedTeamNames) {
        try {
            const parsed = JSON.parse(savedTeamNames);
            if (Array.isArray(parsed) && parsed.length === NUM_TEAMS) {
                teamNames = parsed;
            }
        } catch (e) {
            // ignore, keep default teamNames
        }
    }
    
    // Only load player names if modal is not open
    if (!isModalOpen) {
        const savedNames = localStorage.getItem('playerNames');
        if (savedNames) {
            playerNames = JSON.parse(savedNames);
        }
        const savedTeamNamesLS = localStorage.getItem('teamNames');
        if (savedTeamNamesLS) {
            try {
                const parsedTeamNames = JSON.parse(savedTeamNamesLS);
                if (Array.isArray(parsedTeamNames) && parsedTeamNames.length === NUM_TEAMS) {
                    teamNames = parsedTeamNames;
                }
            } catch (e) {
                // ignore parse error
            }
        }
    }
    
    refreshTeamButtons();
    calculateTotalScores();
    rebuildHistory();
}

// Save on every score submission
submitBtn.addEventListener('click', () => {
    saveToFirebase();
    saveToLocalStorage(); // Backup
});

// Save names when saved
saveNamesBtn.addEventListener('click', () => {
    // This is already handled in the existing saveNamesBtn event listener
    // Just add Firebase save
    setTimeout(() => {
        saveNamesToFirebase();
    }, 100);
});

// Initialize Firebase sync after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initFirebaseSync();
            loadFromFirebase();
        }, 500);
    });
} else {
    setTimeout(() => {
        initFirebaseSync();
        loadFromFirebase();
    }, 500);
}

// Fallback: Load from localStorage on page load
loadFromLocalStorage();

// Rebuild history from saved scores
function rebuildHistory() {
    historyContainer.innerHTML = '';
    if (!historyData || historyData.length === 0) {
        return;
    }
    // แสดงรายการล่าสุดไว้บนสุด
    const sortedHistory = [...historyData].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    sortedHistory.forEach(entry => {
        renderHistoryItem(entry.game, entry.teamPlayerScores);
    });
}

// Rebuild history if there's saved data
if (localStorage.getItem('gameScores')) {
    rebuildHistory();
}
