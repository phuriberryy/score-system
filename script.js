// Configuration
const NUM_TEAMS = 4;
const NUM_PLAYERS_PER_TEAM = 15; // จำนวนสมาชิกต่อทีม (รองรับ 10-15 คน)
const NUM_GAMES = 3; // จำนวนเกม

// Max scores per game (per player)
const MAX_SCORE_PER_PLAYER_PER_GAME = [4, 12, 9]; // เกมที่ 1: 4 ต่อคน, เกมที่ 2: 12 ต่อคน, เกมที่ 3: 9 ต่อคน
const MAX_TOTAL_SCORE = 25; // รวมทั้ง 3 เกม: 25 (สำหรับทีม)

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

// Check if player names are set
let playerNamesSet = false;

// Current selected team for score input (null = all teams, 0-3 = specific team)
let currentSelectedTeam = null;

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
            <h3>ทีม ${teamIndex + 1}</h3>
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
        document.querySelectorAll('.player-score-input').forEach(input => {
            // Remove existing listeners first
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            // Add new listener
            newInput.addEventListener('input', calculateTeamTotals);
            newInput.addEventListener('change', calculateTeamTotals);
        });
    }, 10);
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
    
    const currentGame = parseInt(gameSelect.value);
    const maxScorePerPlayer = MAX_SCORE_PER_PLAYER_PER_GAME[currentGame];
    
    teamInputSection.innerHTML = `
        <div class="team-input-header">
            <h4>ทีม ${teamIndex + 1}</h4>
            <div class="team-total-preview">
                <span>รวม: <span id="team-${teamIndex}-total-preview">0</span></span>
                <span class="max-score-info">(แต่ละคนสูงสุด ${maxScorePerPlayer} คะแนน)</span>
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
                           max="${maxScorePerPlayer}"
                           step="1" 
                           placeholder="0">
                </div>
            `).join('')}
        </div>
    `;
    teamsInputContainer.appendChild(teamInputSection);
}

// Calculate team totals from individual scores
function calculateTeamTotals() {
    // Only calculate for the selected team or all teams
    const teamsToCalculate = currentSelectedTeam !== null ? [currentSelectedTeam] : [0, 1, 2, 3];
    const currentGame = parseInt(gameSelect.value);
    const maxScorePerPlayer = MAX_SCORE_PER_PLAYER_PER_GAME[currentGame];
    
    teamsToCalculate.forEach(teamIndex => {
        let teamTotal = 0;
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
            if (input) {
                let value = parseInt(input.value) || 0;
                // Limit to max score per player for this game
                if (value > maxScorePerPlayer) {
                    value = maxScorePerPlayer;
                    input.value = maxScorePerPlayer;
                }
                teamTotal += Math.max(0, value);
            }
        }
        
        const previewElement = document.getElementById(`team-${teamIndex}-total-preview`);
        if (previewElement) {
            previewElement.textContent = teamTotal;
        }
    });
    
    // Check total score across all games
    checkTotalScoreLimit();
}

// Check if total score across all games exceeds limit
function checkTotalScoreLimit() {
    // Calculate current game total
    const currentGame = parseInt(gameSelect.value);
    let currentGameTotal = 0;
    
    if (currentSelectedTeam !== null) {
        const teamIndex = currentSelectedTeam;
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
            if (input) {
                currentGameTotal += parseInt(input.value) || 0;
            }
        }
    }
    
    // Calculate total across all games for selected team
    if (currentSelectedTeam !== null) {
        const teamIndex = currentSelectedTeam;
        let totalAllGames = 0;
        
        // Sum all games
        for (let gameIdx = 0; gameIdx < NUM_GAMES; gameIdx++) {
            if (gameIdx === currentGame) {
                totalAllGames += currentGameTotal;
            } else {
                // Get saved score for this game
                let gameTotal = 0;
                for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
                    gameTotal += scores[gameIdx][teamIndex][playerIndex] || 0;
                }
                totalAllGames += gameTotal;
            }
        }
        
        // Show warning if exceeds total limit
        const warningElement = document.getElementById(`team-${teamIndex}-score-warning`);
        if (warningElement && totalAllGames > MAX_TOTAL_SCORE) {
            warningElement.textContent = `⚠️ คะแนนรวมทั้ง 3 เกมเกิน! (${totalAllGames}/${MAX_TOTAL_SCORE})`;
            warningElement.style.display = 'block';
            warningElement.style.color = '#e74c3c';
        }
    }
}

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
        } else if (rank === 4) {
            statusText = 'อันดับ 4';
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
                    <div class="team-name">ทีม ${team.teamNumber}</div>
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
            leaderIndicator.innerHTML = `🤝 เสมอกัน: ${tiedTeams.map(t => `ทีม ${t.teamNumber}`).join(', ')} (${leader.score} คะแนน)`;
        } else {
            leaderIndicator.innerHTML = `🏆 ทีม ${leader.teamNumber} นำ! (${leader.score} คะแนน)`;
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
                        <span class="game-team-name">ทีม ${team.teamNumber}</span>
                        <span class="game-team-total">${team.score} คะแนน</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        gameSummaryContainer.appendChild(gameCard);
    }
}

// Add score to history
function addToHistory(game, teamPlayerScores) {
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
                        <span class="history-team-name">ทีม ${teamIndex + 1}</span>
                        <div class="history-individual-scores">${individualScores}</div>
                        <span class="score-value">รวม: ${teamTotal}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
}

// Load existing scores for current game
function loadCurrentScores() {
    if (!playerNamesSet || currentSelectedTeam === null) {
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
    
    const game = parseInt(gameSelect.value);
    const maxScorePerPlayer = MAX_SCORE_PER_PLAYER_PER_GAME[game];
    
    // Validate scores before submitting (only for selected team)
    if (currentSelectedTeam !== null) {
        const teamIndex = currentSelectedTeam;
        let teamTotal = 0;
        
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
                const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                if (input) {
                    const value = parseInt(input.value) || 0;
                    // Check if individual player exceeds max
                    if (value > maxScorePerPlayer) {
                        alert(`⚠️ ${playerNames[teamIndex][playerIndex]} กรอกคะแนน ${value} เกิน ${maxScorePerPlayer} (เกมนี้แต่ละคนสูงสุด ${maxScorePerPlayer} คะแนน)`);
                        return;
                    }
                    teamTotal += value;
                }
            }
        }
        
        let errorMessage = '';
        
        // Check total across all games
        let totalAllGames = 0;
        for (let gameIdx = 0; gameIdx < NUM_GAMES; gameIdx++) {
            if (gameIdx === game) {
                totalAllGames += teamTotal;
            } else {
                let gameTotal = 0;
                for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
                    gameTotal += scores[gameIdx][teamIndex][playerIndex] || 0;
                }
                totalAllGames += gameTotal;
            }
        }
        
        if (totalAllGames > MAX_TOTAL_SCORE) {
            errorMessage += `⚠️ คะแนนรวมทั้ง 3 เกม ${totalAllGames} เกิน ${MAX_TOTAL_SCORE}\n`;
        }
        
        if (errorMessage) {
            if (!confirm(errorMessage + '\nต้องการบันทึกต่อไปหรือไม่?')) {
                return;
            }
        }
    }
    
    // Get individual player scores from inputs (only for players with names)
    const teamPlayerScores = [];
    for (let teamIndex = 0; teamIndex < NUM_TEAMS; teamIndex++) {
        const teamScores = Array(NUM_PLAYERS_PER_TEAM).fill(0);
        for (let playerIndex = 0; playerIndex < NUM_PLAYERS_PER_TEAM; playerIndex++) {
            if (playerNames[teamIndex][playerIndex] && playerNames[teamIndex][playerIndex].trim() !== '') {
                const input = document.getElementById(`team-${teamIndex}-player-${playerIndex}`);
                if (input) {
                    const value = parseInt(input.value) || 0;
                    teamScores[playerIndex] = Math.max(0, value); // Ensure non-negative
                }
            }
        }
        teamPlayerScores.push(teamScores);
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
        
        // Update history (remove old entry and add new one)
        const historyItems = historyContainer.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            if (item.querySelector('.history-item-header').textContent.includes(`เกมที่ ${game + 1}`)) {
                item.remove();
            }
        });
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
    
    // Show success message
    submitBtn.textContent = '✓ บันทึกสำเร็จ!';
    submitBtn.style.background = '#27ae60';
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
        calculateTotalScores();
        historyContainer.innerHTML = '';
        loadCurrentScores();
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
        
        selectedTeamIndicator.innerHTML = `📝 คุณกำลังกรอกคะแนนสำหรับ <strong>ทีม ${teamIndex + 1}</strong>`;
        currentTeamTitle.textContent = `กรอกคะแนนเดี่ยว - ทีม ${teamIndex + 1} (คะแนนทีมจะคำนวณอัตโนมัติ)`;
        
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

// Load scores when game changes
// Update max score display when game changes
function updateMaxScoreDisplay() {
    const currentGame = parseInt(gameSelect.value);
    const maxScorePerPlayer = MAX_SCORE_PER_PLAYER_PER_GAME[currentGame];
    const maxScoreElement = document.getElementById('current-game-max-score');
    if (maxScoreElement) {
        maxScoreElement.textContent = `เกมนี้แต่ละคนสูงสุด: ${maxScorePerPlayer} คะแนน`;
    }
    
    // Update input max attributes
    document.querySelectorAll('.player-score-input').forEach(input => {
        input.setAttribute('max', maxScorePerPlayer);
    });
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

// Auto-sync data from localStorage (for sharing between devices)
function syncData() {
    // Don't sync if modal is open (user is editing names)
    if (playerNamesModal && playerNamesModal.style.display === 'flex') {
        return;
    }
    
    // Don't sync if user is typing in score inputs
    if (isUserTyping()) {
        return;
    }
    
    // Save current input values before syncing
    const currentInputValues = {};
    document.querySelectorAll('.player-score-input').forEach(input => {
        const teamIndex = input.getAttribute('data-team');
        const playerIndex = input.getAttribute('data-player');
        if (teamIndex !== null && playerIndex !== null) {
            const key = `${teamIndex}-${playerIndex}`;
            currentInputValues[key] = input.value;
        }
    });
    
    // Check if user has entered any values
    const hasInputValues = Array.from(document.querySelectorAll('.player-score-input')).some(input => {
        const val = input.value.trim();
        return val !== '' && val !== '0';
    });
    
    loadFromLocalStorage();
    if (playerNamesSet) {
        updateScoreDisplay();
        updateGameSummary();
        // Don't reload inputs if user has entered values - just update display
        if (currentSelectedTeam !== null && !hasInputValues) {
            // Only reload if no values are being entered
            loadCurrentScores();
        }
        // If has values, don't reload - keep what user typed
    }
}

// Check for data changes every 2 seconds
setInterval(syncData, 2000);

// Also listen to storage events (for same browser, different tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'gameScores' || e.key === 'playerNames' || e.key === 'totalScores') {
        syncData();
    }
});

// Initialize
initializePlayerNamesInput();
const savedNames = localStorage.getItem('playerNames');
if (savedNames) {
    playerNames = JSON.parse(savedNames);
    playerNamesSet = true;
    playerNamesModal.style.display = 'none';
} else {
    playerNamesModal.style.display = 'flex';
}

if (playerNamesSet) {
    updateMaxScoreDisplay();
    initializeTeamInputs();
}
updateScoreDisplay();
updateGameSummary();
if (playerNamesSet) {
    loadCurrentScores();
}

// Auto-save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('gameScores', JSON.stringify(scores));
    localStorage.setItem('totalScores', JSON.stringify(totalScores));
    localStorage.setItem('playerTotalScores', JSON.stringify(playerTotalScores));
    localStorage.setItem('playerNames', JSON.stringify(playerNames));
    localStorage.setItem('gameScoresData', JSON.stringify(gameScores));
}

function loadFromLocalStorage() {
    // Don't load player names if modal is open (user is editing)
    const isModalOpen = playerNamesModal && playerNamesModal.style.display === 'flex';
    
    const savedScores = localStorage.getItem('gameScores');
    const savedTotalScores = localStorage.getItem('totalScores');
    const savedPlayerTotalScores = localStorage.getItem('playerTotalScores');
    const savedGameScores = localStorage.getItem('gameScoresData');
    
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
    
    // Only load player names if modal is not open
    if (!isModalOpen) {
        const savedNames = localStorage.getItem('playerNames');
        if (savedNames) {
            playerNames = JSON.parse(savedNames);
        }
    }
    
    calculateTotalScores();
}

// Save on every score submission
submitBtn.addEventListener('click', saveToLocalStorage);
resetBtn.addEventListener('click', () => {
    localStorage.removeItem('gameScores');
    localStorage.removeItem('totalScores');
    localStorage.removeItem('playerTotalScores');
    localStorage.removeItem('gameScoresData');
});

// Load on page load
loadFromLocalStorage();

// Rebuild history from saved scores
function rebuildHistory() {
    historyContainer.innerHTML = '';
    for (let game = NUM_GAMES - 1; game >= 0; game--) {
        if (scores[game].some(teamScores => teamScores.some(score => score > 0))) {
            addToHistory(game, scores[game]);
        }
    }
}

// Rebuild history if there's saved data
if (localStorage.getItem('gameScores')) {
    rebuildHistory();
}
