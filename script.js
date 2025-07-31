class CandyCrushGame {
    constructor() {
        this.board = [];
        this.boardSize = 8;
        this.candyTypes = ['🍬', '🍭', '🍫', '🍯', '🧁', '🍰'];
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.selectedCandy = null;
        this.isSwapping = false;
        this.matchingInProgress = false;
        this.objectives = {
            red: { current: 0, target: 20 },
            blue: { current: 0, target: 15 }
        };
        this.powerUps = {
            bomb: 3,
            lightning: 2,
            rainbow: 1
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.renderBoard();
        this.attachEventListeners();
        this.updateUI();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                let candyType;
                do {
                    candyType = this.getRandomCandy();
                } while (this.wouldCreateMatch(row, col, candyType));
                
                this.board[row][col] = {
                    type: candyType,
                    row: row,
                    col: col,
                    id: `candy-${row}-${col}`
                };
            }
        }
    }
    
    getRandomCandy() {
        return this.candyTypes[Math.floor(Math.random() * this.candyTypes.length)];
    }
    
    wouldCreateMatch(row, col, candyType) {
        // Check horizontal match
        let horizontalCount = 1;
        if (col >= 2 && this.board[row][col-1]?.type === candyType && this.board[row][col-2]?.type === candyType) {
            return true;
        }
        
        // Check vertical match
        let verticalCount = 1;
        if (row >= 2 && this.board[row-1][col]?.type === candyType && this.board[row-2][col]?.type === candyType) {
            return true;
        }
        
        return false;
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const candy = this.board[row][col];
                const candyElement = document.createElement('div');
                candyElement.className = 'candy';
                candyElement.id = candy.id;
                candyElement.textContent = candy.type;
                candyElement.dataset.row = row;
                candyElement.dataset.col = col;
                
                // Add candy type class for special styling
                const typeIndex = this.candyTypes.indexOf(candy.type) + 1;
                candyElement.classList.add(`candy-type-${typeIndex}`);
                
                // Add falling animation for new candies
                setTimeout(() => {
                    candyElement.classList.add('falling');
                }, (row + col) * 50);
                
                gameBoard.appendChild(candyElement);
            }
        }
    }
    
    attachEventListeners() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.addEventListener('click', (e) => this.handleCandyClick(e));
        
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffleBoard());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('replay-btn').addEventListener('click', () => this.replayLevel());
        
        // Power-up event listeners
        document.querySelectorAll('.power-up-item').forEach(item => {
            item.addEventListener('click', (e) => this.activatePowerUp(e));
        });
    }
    
    handleCandyClick(e) {
        if (!e.target.classList.contains('candy') || this.isSwapping || this.matchingInProgress) {
            return;
        }
        
        const clickedCandy = e.target;
        const row = parseInt(clickedCandy.dataset.row);
        const col = parseInt(clickedCandy.dataset.col);
        
        if (!this.selectedCandy) {
            this.selectCandy(clickedCandy);
        } else {
            if (this.selectedCandy === clickedCandy) {
                this.deselectCandy();
            } else if (this.areAdjacent(this.selectedCandy, clickedCandy)) {
                this.swapCandies(this.selectedCandy, clickedCandy);
            } else {
                this.deselectCandy();
                this.selectCandy(clickedCandy);
            }
        }
    }
    
    selectCandy(candyElement) {
        this.selectedCandy = candyElement;
        candyElement.classList.add('selected');
    }
    
    deselectCandy() {
        if (this.selectedCandy) {
            this.selectedCandy.classList.remove('selected');
            this.selectedCandy = null;
        }
    }
    
    areAdjacent(candy1, candy2) {
        const row1 = parseInt(candy1.dataset.row);
        const col1 = parseInt(candy1.dataset.col);
        const row2 = parseInt(candy2.dataset.row);
        const col2 = parseInt(candy2.dataset.col);
        
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    async swapCandies(candy1, candy2) {
        if (this.isSwapping) return;
        
        this.isSwapping = true;
        this.moves--;
        this.updateUI();
        
        const row1 = parseInt(candy1.dataset.row);
        const col1 = parseInt(candy1.dataset.col);
        const row2 = parseInt(candy2.dataset.row);
        const col2 = parseInt(candy2.dataset.col);
        
        // Swap in data model
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        // Update IDs
        this.board[row1][col1].row = row1;
        this.board[row1][col1].col = col1;
        this.board[row2][col2].row = row2;
        this.board[row2][col2].col = col2;
        
        // Animate swap
        await this.animateSwap(candy1, candy2);
        
        // Check for matches
        const matches = this.findAllMatches();
        
        if (matches.length > 0) {
            this.deselectCandy();
            await this.processMatches();
        } else {
            // Swap back if no matches
            const temp2 = this.board[row1][col1];
            this.board[row1][col1] = this.board[row2][col2];
            this.board[row2][col2] = temp2;
            
            this.board[row1][col1].row = row1;
            this.board[row1][col1].col = col1;
            this.board[row2][col2].row = row2;
            this.board[row2][col2].col = col2;
            
            await this.animateSwap(candy1, candy2);
            this.moves++; // Give back the move
        }
        
        this.deselectCandy();
        this.isSwapping = false;
        this.checkGameEnd();
    }
    
    animateSwap(candy1, candy2) {
        return new Promise(resolve => {
            const rect1 = candy1.getBoundingClientRect();
            const rect2 = candy2.getBoundingClientRect();
            
            const deltaX = rect2.left - rect1.left;
            const deltaY = rect2.top - rect1.top;
            
            candy1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            candy2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
            candy1.style.zIndex = '100';
            candy2.style.zIndex = '100';
            
            setTimeout(() => {
                // Update visual content
                const temp = candy1.textContent;
                candy1.textContent = candy2.textContent;
                candy2.textContent = temp;
                
                // Update classes
                const candy1Classes = Array.from(candy1.classList).filter(c => c.startsWith('candy-type-'));
                const candy2Classes = Array.from(candy2.classList).filter(c => c.startsWith('candy-type-'));
                
                candy1Classes.forEach(c => candy1.classList.remove(c));
                candy2Classes.forEach(c => candy2.classList.remove(c));
                
                const type1Index = this.candyTypes.indexOf(this.board[parseInt(candy1.dataset.row)][parseInt(candy1.dataset.col)].type) + 1;
                const type2Index = this.candyTypes.indexOf(this.board[parseInt(candy2.dataset.row)][parseInt(candy2.dataset.col)].type) + 1;
                
                candy1.classList.add(`candy-type-${type1Index}`);
                candy2.classList.add(`candy-type-${type2Index}`);
                
                // Reset transform
                candy1.style.transform = '';
                candy2.style.transform = '';
                candy1.style.zIndex = '';
                candy2.style.zIndex = '';
                
                resolve();
            }, 300);
        });
    }
    
    findAllMatches() {
        const matches = [];
        const visited = new Set();
        
        // Find horizontal matches
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentType = this.board[row][0].type;
            
            for (let col = 1; col < this.boardSize; col++) {
                if (this.board[row][col].type === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = col - count; i < col; i++) {
                            const key = `${row}-${i}`;
                            if (!visited.has(key)) {
                                matches.push({row, col: i});
                                visited.add(key);
                            }
                        }
                    }
                    count = 1;
                    currentType = this.board[row][col].type;
                }
            }
            
            // Check last sequence
            if (count >= 3) {
                for (let i = this.boardSize - count; i < this.boardSize; i++) {
                    const key = `${row}-${i}`;
                    if (!visited.has(key)) {
                        matches.push({row, col: i});
                        visited.add(key);
                    }
                }
            }
        }
        
        // Find vertical matches
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentType = this.board[0][col].type;
            
            for (let row = 1; row < this.boardSize; row++) {
                if (this.board[row][col].type === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = row - count; i < row; i++) {
                            const key = `${i}-${col}`;
                            if (!visited.has(key)) {
                                matches.push({row: i, col});
                                visited.add(key);
                            }
                        }
                    }
                    count = 1;
                    currentType = this.board[row][col].type;
                }
            }
            
            // Check last sequence
            if (count >= 3) {
                for (let i = this.boardSize - count; i < this.boardSize; i++) {
                    const key = `${i}-${col}`;
                    if (!visited.has(key)) {
                        matches.push({row: i, col});
                        visited.add(key);
                    }
                }
            }
        }
        
        return matches;
    }
    
    async processMatches() {
        this.matchingInProgress = true;
        
        while (true) {
            const matches = this.findAllMatches();
            if (matches.length === 0) break;
            
            // Animate matched candies
            await this.animateMatches(matches);
            
            // Calculate score
            const points = matches.length * 100;
            this.score += points;
            this.createScoreParticles(points);
            
            // Update objectives
            this.updateObjectives(matches);
            
            // Remove matched candies and drop others
            this.removeCandies(matches);
            await this.dropCandies();
            await this.fillEmptySpaces();
            
            this.updateUI();
        }
        
        this.matchingInProgress = false;
    }
    
    animateMatches(matches) {
        return new Promise(resolve => {
            matches.forEach(match => {
                const candyElement = document.getElementById(`candy-${match.row}-${match.col}`);
                if (candyElement) {
                    candyElement.classList.add('matching');
                }
            });
            
            setTimeout(resolve, 500);
        });
    }
    
    removeCandies(matches) {
        matches.forEach(match => {
            this.board[match.row][match.col] = null;
            const candyElement = document.getElementById(`candy-${match.row}-${match.col}`);
            if (candyElement) {
                candyElement.remove();
            }
        });
    }
    
    dropCandies() {
        return new Promise(resolve => {
            let moved = false;
            
            for (let col = 0; col < this.boardSize; col++) {
                // Collect non-null candies from bottom to top
                const candies = [];
                for (let row = this.boardSize - 1; row >= 0; row--) {
                    if (this.board[row][col] !== null) {
                        candies.push(this.board[row][col]);
                        this.board[row][col] = null;
                    }
                }
                
                // Place candies from bottom
                for (let i = 0; i < candies.length; i++) {
                    const newRow = this.boardSize - 1 - i;
                    this.board[newRow][col] = candies[i];
                    this.board[newRow][col].row = newRow;
                    
                    // Update DOM element
                    const candyElement = document.getElementById(candies[i].id);
                    if (candyElement) {
                        candyElement.dataset.row = newRow;
                        candyElement.id = `candy-${newRow}-${col}`;
                        this.board[newRow][col].id = `candy-${newRow}-${col}`;
                        
                        if (candies[i].row !== newRow) {
                            moved = true;
                            this.animateDrop(candyElement, candies[i].row, newRow);
                        }
                    }
                }
            }
            
            setTimeout(resolve, moved ? 300 : 0);
        });
    }
    
    animateDrop(candyElement, fromRow, toRow) {
        const distance = (toRow - fromRow) * 62; // 60px + 2px gap
        candyElement.style.transform = `translateY(-${distance}px)`;
        
        setTimeout(() => {
            candyElement.style.transform = '';
        }, 50);
    }
    
    fillEmptySpaces() {
        return new Promise(resolve => {
            let hasEmpty = false;
            
            for (let col = 0; col < this.boardSize; col++) {
                for (let row = 0; row < this.boardSize; row++) {
                    if (this.board[row][col] === null) {
                        hasEmpty = true;
                        const candyType = this.getRandomCandy();
                        this.board[row][col] = {
                            type: candyType,
                            row: row,
                            col: col,
                            id: `candy-${row}-${col}`
                        };
                        
                        // Create DOM element
                        const candyElement = document.createElement('div');
                        candyElement.className = 'candy falling';
                        candyElement.id = `candy-${row}-${col}`;
                        candyElement.textContent = candyType;
                        candyElement.dataset.row = row;
                        candyElement.dataset.col = col;
                        
                        const typeIndex = this.candyTypes.indexOf(candyType) + 1;
                        candyElement.classList.add(`candy-type-${typeIndex}`);
                        
                        const gameBoard = document.getElementById('game-board');
                        gameBoard.appendChild(candyElement);
                    }
                }
            }
            
            setTimeout(resolve, hasEmpty ? 500 : 0);
        });
    }
    
    updateObjectives(matches) {
        matches.forEach(match => {
            const candyType = this.board[match.row][match.col].type;
            if (candyType === '🍬') {
                this.objectives.red.current = Math.min(this.objectives.red.current + 1, this.objectives.red.target);
            } else if (candyType === '🍭') {
                this.objectives.blue.current = Math.min(this.objectives.blue.current + 1, this.objectives.blue.target);
            }
        });
    }
    
    createScoreParticles(points) {
        const container = document.getElementById('particle-container');
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = `+${points}`;
        particle.style.cssText = `
            left: ${Math.random() * window.innerWidth}px;
            top: ${window.innerHeight / 2}px;
            color: #ffd93d;
            font-weight: bold;
            font-size: 1.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('moves').textContent = this.moves;
        
        // Update objectives
        document.getElementById('red-progress').textContent = `${this.objectives.red.current}/${this.objectives.red.target}`;
        document.getElementById('blue-progress').textContent = `${this.objectives.blue.current}/${this.objectives.blue.target}`;
        
        // Update power-ups
        document.getElementById('bomb-count').textContent = this.powerUps.bomb;
        document.getElementById('lightning-count').textContent = this.powerUps.lightning;
        document.getElementById('rainbow-count').textContent = this.powerUps.rainbow;
        
        // Update progress bar
        const totalObjectives = this.objectives.red.target + this.objectives.blue.target;
        const completedObjectives = this.objectives.red.current + this.objectives.blue.current;
        const progress = (completedObjectives / totalObjectives) * 100;
        document.getElementById('progress-fill').style.width = `${Math.min(progress, 100)}%`;
    }
    
    checkGameEnd() {
        const objectivesComplete = this.objectives.red.current >= this.objectives.red.target && 
                                 this.objectives.blue.current >= this.objectives.blue.target;
        
        if (objectivesComplete) {
            this.showModal('Level Complete!', 'Congratulations! You\'ve completed the level.', true);
        } else if (this.moves <= 0) {
            this.showModal('Game Over', 'No more moves left. Try again!', false);
        }
    }
    
    showModal(title, message, isWin) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        
        const modal = document.getElementById('game-over-modal');
        const nextLevelBtn = document.getElementById('next-level-btn');
        
        if (isWin) {
            nextLevelBtn.style.display = 'block';
        } else {
            nextLevelBtn.style.display = 'none';
        }
        
        modal.classList.add('show');
    }
    
    hideModal() {
        document.getElementById('game-over-modal').classList.remove('show');
    }
    
    newGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.objectives.red.current = 0;
        this.objectives.blue.current = 0;
        this.hideModal();
        this.createBoard();
        this.renderBoard();
        this.updateUI();
    }
    
    nextLevel() {
        this.level++;
        this.moves = 30;
        this.objectives.red.current = 0;
        this.objectives.blue.current = 0;
        this.objectives.red.target += 5;
        this.objectives.blue.target += 3;
        this.hideModal();
        this.createBoard();
        this.renderBoard();
        this.updateUI();
    }
    
    replayLevel() {
        this.moves = 30;
        this.objectives.red.current = 0;
        this.objectives.blue.current = 0;
        this.hideModal();
        this.createBoard();
        this.renderBoard();
        this.updateUI();
    }
    
    showHint() {
        // Find first possible match
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const possibleMoves = this.getPossibleMoves(row, col);
                if (possibleMoves.length > 0) {
                    const candyElement = document.getElementById(`candy-${row}-${col}`);
                    candyElement.style.animation = 'pulse 0.6s infinite alternate';
                    
                    setTimeout(() => {
                        candyElement.style.animation = '';
                    }, 3000);
                    
                    return;
                }
            }
        }
    }
    
    getPossibleMoves(row, col) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.boardSize && newCol >= 0 && newCol < this.boardSize) {
                // Simulate swap
                const temp = this.board[row][col];
                this.board[row][col] = this.board[newRow][newCol];
                this.board[newRow][newCol] = temp;
                
                const matches = this.findAllMatches();
                
                // Swap back
                this.board[newRow][newCol] = this.board[row][col];
                this.board[row][col] = temp;
                
                if (matches.length > 0) {
                    moves.push({row: newRow, col: newCol});
                }
            }
        }
        
        return moves;
    }
    
    shuffleBoard() {
        if (this.powerUps.rainbow > 0) {
            this.powerUps.rainbow--;
            
            // Create new random board
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    let candyType;
                    do {
                        candyType = this.getRandomCandy();
                    } while (this.wouldCreateMatch(row, col, candyType));
                    
                    this.board[row][col].type = candyType;
                }
            }
            
            this.renderBoard();
            this.updateUI();
        }
    }
    
    activatePowerUp(e) {
        const powerUpType = e.currentTarget.dataset.powerup;
        
        if (this.powerUps[powerUpType] > 0) {
            this.powerUps[powerUpType]--;
            
            switch (powerUpType) {
                case 'bomb':
                    // Remove random candies
                    this.activateBomb();
                    break;
                case 'lightning':
                    // Clear a row and column
                    this.activateLightning();
                    break;
                case 'rainbow':
                    // Already handled in shuffleBoard
                    break;
            }
            
            this.updateUI();
        }
    }
    
    activateBomb() {
        const matches = [];
        
        // Select 9 random positions for bomb effect
        for (let i = 0; i < 9; i++) {
            const row = Math.floor(Math.random() * this.boardSize);
            const col = Math.floor(Math.random() * this.boardSize);
            matches.push({row, col});
        }
        
        this.processCustomMatches(matches);
    }
    
    activateLightning() {
        const matches = [];
        const centerRow = Math.floor(this.boardSize / 2);
        const centerCol = Math.floor(this.boardSize / 2);
        
        // Clear entire row and column
        for (let i = 0; i < this.boardSize; i++) {
            matches.push({row: centerRow, col: i});
            matches.push({row: i, col: centerCol});
        }
        
        this.processCustomMatches(matches);
    }
    
    async processCustomMatches(matches) {
        this.matchingInProgress = true;
        
        // Remove duplicates
        const uniqueMatches = matches.filter((match, index, self) =>
            index === self.findIndex(m => m.row === match.row && m.col === match.col)
        );
        
        await this.animateMatches(uniqueMatches);
        
        const points = uniqueMatches.length * 150;
        this.score += points;
        this.createScoreParticles(points);
        
        this.updateObjectives(uniqueMatches);
        this.removeCandies(uniqueMatches);
        await this.dropCandies();
        await this.fillEmptySpaces();
        await this.processMatches(); // Check for new matches
        
        this.matchingInProgress = false;
        this.updateUI();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CandyCrushGame();
});

// Add some fun sound effects (optional - using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Add sound effects to various game events
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('candy')) {
                playSound(800, 0.1);
            }
            if (e.target.classList.contains('btn')) {
                playSound(1000, 0.2);
            }
        });
    }, 1000);
});