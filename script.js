document.addEventListener('DOMContentLoaded', () => {
    let gameBoard = [];
    let currentScore = 0;
    let previousGameState = null;
    let isGameEnded = false;
    let previousBoard = null; // Для отслеживания предыдущего состояния для анимаций
    
    const gameBoardElement = document.getElementById('grid');
    const scoreDisplay = document.getElementById('score');
    const newGameBtn = document.getElementById('new-game');
    const undoBtn = document.getElementById('undo');
    const leaderboardBtn = document.getElementById('leaderboard');
    const gameEndModal = document.getElementById('game-over-modal');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const finalScoreDisplay = document.getElementById('final-score');
    const playerNameField = document.getElementById('player-name');
    const saveScoreBtn = document.getElementById('save-score');
    const restartBtn = document.getElementById('restart');
    const scoreSavedMsg = document.getElementById('score-saved-message');
    const closeModalBtn = document.getElementById('close-modal');
    const closeLeaderboardBtn = document.getElementById('close-leaderboard');
    const leaderboardTableBody = document.getElementById('leaderboard-body');
    
    const upBtn = document.getElementById('up');
    const downBtn = document.getElementById('down');
    const leftBtn = document.getElementById('left');
    const rightBtn = document.getElementById('right');
    
    function initializeGame() {
        createGameBoard();
        loadSavedGame();
        if (gameBoard.flat().every(cell => cell === 0)) {
            generateNewTile();
            generateNewTile();
        }
        renderGameBoard();
        setupEventHandlers();
        scoreSavedMsg.style.display = 'none';
    }
    
    function createGameBoard() {
        while (gameBoardElement.firstChild) {
            gameBoardElement.removeChild(gameBoardElement.firstChild);
        }
        
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gameBoardElement.appendChild(cell);
        }
    }
    
    function renderGameBoard() {
        const cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
        const cellGap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));
        
        // Если нет предыдущего состояния, просто рендерим без анимации
        if (!previousBoard) {
            const tiles = document.querySelectorAll('.tile');
            tiles.forEach(tile => {
                tile.parentNode.removeChild(tile);
            });
            
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const value = gameBoard[row][col];
                    if (value !== 0) {
                        const tile = document.createElement('div');
                        tile.className = 'tile tile-' + value;
                        tile.textContent = value;
                        tile.dataset.position = `${row}-${col}`;
                        
                        const x = col * (cellSize + cellGap) + cellGap;
                        const y = row * (cellSize + cellGap) + cellGap;
                        
                        tile.style.left = x + 'px';
                        tile.style.top = y + 'px';
                        
                        gameBoardElement.appendChild(tile);
                    }
                }
            }
        } else {
            // Анимированный рендеринг - сравниваем старое и новое состояние
            const existingTiles = new Map();
            document.querySelectorAll('.tile').forEach(tile => {
                const pos = tile.dataset.position;
                if (pos) {
                    existingTiles.set(pos, tile);
                }
            });
            
            // Обрабатываем каждую позицию
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const pos = `${row}-${col}`;
                    const newValue = gameBoard[row][col];
                    const oldValue = previousBoard[row][col];
                    const newX = col * (cellSize + cellGap) + cellGap;
                    const newY = row * (cellSize + cellGap) + cellGap;
                    
                    if (oldValue === 0 && newValue !== 0) {
                        // Новая плитка
                        const tile = document.createElement('div');
                        tile.className = 'tile tile-' + newValue + ' new';
                        tile.textContent = newValue;
                        tile.dataset.position = pos;
                        tile.style.left = newX + 'px';
                        tile.style.top = newY + 'px';
                        gameBoardElement.appendChild(tile);
                        
                        setTimeout(() => {
                            tile.classList.remove('new');
                        }, 200);
                    } else if (oldValue !== 0 && newValue === 0) {
                        // Плитка исчезла (слилась) - удаляем
                        const tile = existingTiles.get(pos);
                        if (tile) {
                            tile.remove();
                        }
                    } else if (oldValue !== 0 && newValue !== 0) {
                        const tile = existingTiles.get(pos);
                        if (tile) {
                            if (oldValue === newValue) {
                                // Плитка осталась на месте - обновляем позицию
                                tile.dataset.position = pos;
                                tile.style.left = newX + 'px';
                                tile.style.top = newY + 'px';
                            } else if (newValue === oldValue * 2) {
                                // Слияние на месте
                                tile.classList.add('merging');
                                tile.textContent = newValue;
                                tile.className = 'tile tile-' + newValue + ' merging';
                                tile.dataset.position = pos;
                                
                                setTimeout(() => {
                                    tile.classList.remove('merging');
                                }, 200);
                            } else {
                                // Значение изменилось (не должно происходить в нормальной игре)
                                tile.textContent = newValue;
                                tile.className = 'tile tile-' + newValue;
                                tile.dataset.position = pos;
                            }
                        } else {
                            // Плитка переместилась сюда - ищем её в старых позициях
                            let found = false;
                            for (let oldRow = 0; oldRow < 4 && !found; oldRow++) {
                                for (let oldCol = 0; oldCol < 4 && !found; oldCol++) {
                                    const oldPos = `${oldRow}-${oldCol}`;
                                    if (previousBoard[oldRow][oldCol] === newValue && oldPos !== pos) {
                                        const oldTile = existingTiles.get(oldPos);
                                        if (oldTile) {
                                            // Анимируем перемещение
                                            const oldX = oldCol * (cellSize + cellGap) + cellGap;
                                            const oldY = oldRow * (cellSize + cellGap) + cellGap;
                                            
                                            oldTile.style.left = oldX + 'px';
                                            oldTile.style.top = oldY + 'px';
                                            oldTile.classList.add('moving');
                                            oldTile.dataset.position = pos;
                                            
                                            oldTile.offsetHeight; // reflow
                                            
                                            requestAnimationFrame(() => {
                                                oldTile.style.left = newX + 'px';
                                                oldTile.style.top = newY + 'px';
                                                
                                                setTimeout(() => {
                                                    oldTile.classList.remove('moving');
                                                }, 150);
                                            });
                                            
                                            found = true;
                                        }
                                    }
                                }
                            }
                            
                            if (!found) {
                                // Создаем новую плитку
                                const tile = document.createElement('div');
                                tile.className = 'tile tile-' + newValue;
                                tile.textContent = newValue;
                                tile.dataset.position = pos;
                                tile.style.left = newX + 'px';
                                tile.style.top = newY + 'px';
                                gameBoardElement.appendChild(tile);
                            }
                        }
                    }
                }
            }
        }
        
        // Сохраняем текущее состояние для следующей анимации
        previousBoard = JSON.parse(JSON.stringify(gameBoard));
        
        scoreDisplay.textContent = currentScore;
    }
    
    function generateNewTile() {
        const emptyCells = [];
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (gameBoard[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            gameBoard[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    function saveCurrentGame() {
        const gameData = {
            gameBoard: gameBoard,
            currentScore: currentScore,
            previousGameState: previousGameState
        };
        localStorage.setItem('2048-game-state', JSON.stringify(gameData));
    }
    
    function loadSavedGame() {
        const savedData = localStorage.getItem('2048-game-state');
        if (savedData) {
            const gameData = JSON.parse(savedData);
            gameBoard = gameData.gameBoard;
            currentScore = gameData.currentScore;
            previousGameState = gameData.previousGameState;
        } else {
            gameBoard = Array(4).fill().map(() => Array(4).fill(0));
            currentScore = 0;
            previousGameState = null;
        }
    }
    
    function makeMove(direction) {
        if (isGameEnded) return false;
        
        previousGameState = {
            gameBoard: JSON.parse(JSON.stringify(gameBoard)),
            currentScore: currentScore
        };
        
        // Сохраняем предыдущее состояние для анимации
        previousBoard = JSON.parse(JSON.stringify(gameBoard));
        
        let hasMoved = false;
        
        if (direction === 'up' || direction === 'down') {
            gameBoard = transposeMatrix(gameBoard);
        }
        
        if (direction === 'right' || direction === 'down') {
            gameBoard = gameBoard.map(row => row.reverse());
        }
        
        for (let row = 0; row < 4; row++) {
            const newRow = [];
            let previousValue = null;
            
            for (let col = 0; col < 4; col++) {
                const value = gameBoard[row][col];
                
                if (value !== 0) {
                    if (previousValue === value) {
                        newRow[newRow.length - 1] = value * 2;
                        currentScore += value * 2;
                        previousValue = null;
                        hasMoved = true;
                    } else {
                        newRow.push(value);
                        previousValue = value;
                        if (col !== newRow.length - 1) {
                            hasMoved = true;
                        }
                    }
                }
            }
            
            while (newRow.length < 4) {
                newRow.push(0);
            }
            
            gameBoard[row] = newRow;
        }
        
        if (direction === 'right' || direction === 'down') {
            gameBoard = gameBoard.map(row => row.reverse());
        }
        
        if (direction === 'up' || direction === 'down') {
            gameBoard = transposeMatrix(gameBoard);
        }
        
        if (hasMoved) {
            generateNewTile();
            renderGameBoard();
            saveCurrentGame();
            
            if (checkGameCompletion()) {
                isGameEnded = true;
                showGameEndModal();
            }
        } else {
            renderGameBoard();
        }
        
        return hasMoved;
    }
    
    function transposeMatrix(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }
    
    function checkGameCompletion() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (gameBoard[row][col] === 0) {
                    return false;
                }
            }
        }
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                if (gameBoard[row][col] === gameBoard[row][col + 1]) {
                    return false;
                }
            }
        }
        
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 3; row++) {
                if (gameBoard[row][col] === gameBoard[row + 1][col]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    function showGameEndModal() {
        finalScoreDisplay.textContent = currentScore;
        gameEndModal.classList.add('active');
        playerNameField.value = '';
        scoreSavedMsg.style.display = 'none';
        document.getElementById('name-input-section').style.display = 'block';
        
        setTimeout(() => {
            playerNameField.focus();
        }, 300);
    }
    
    function addToLeaderboard(name) {
        const leaderboardData = JSON.parse(localStorage.getItem('2048-leaderboard') || '[]');
        
        leaderboardData.push({
            name: name,
            score: currentScore,
            date: new Date().toLocaleDateString('ru-RU')
        });
        
        leaderboardData.sort((a, b) => b.score - a.score);
        if (leaderboardData.length > 10) {
            leaderboardData.length = 10;
        }
        
        localStorage.setItem('2048-leaderboard', JSON.stringify(leaderboardData));
    }
    
    function displayLeaderboard() {
        const leaderboardData = JSON.parse(localStorage.getItem('2048-leaderboard') || '[]');
        
        while (leaderboardTableBody.firstChild) {
            leaderboardTableBody.removeChild(leaderboardTableBody.firstChild);
        }
        
        if (leaderboardData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'Пока нет рекордов';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            row.appendChild(cell);
            leaderboardTableBody.appendChild(row);
        } else {
            leaderboardData.forEach(entry => {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.textContent = entry.name;
                
                const scoreCell = document.createElement('td');
                scoreCell.textContent = entry.score;
                
                const dateCell = document.createElement('td');
                dateCell.textContent = entry.date;
                
                row.appendChild(nameCell);
                row.appendChild(scoreCell);
                row.appendChild(dateCell);
                
                leaderboardTableBody.appendChild(row);
            });
        }
        
        leaderboardModal.classList.add('active');
    }
    
    function undoLastMove() {
        if (previousGameState && !isGameEnded) {
            gameBoard = previousGameState.gameBoard;
            currentScore = previousGameState.currentScore;
            previousGameState = null;
            previousBoard = null;
            renderGameBoard();
            saveCurrentGame();
        }
    }
    
    function startNewGame() {
        gameBoard = Array(4).fill().map(() => Array(4).fill(0));
        currentScore = 0;
        previousGameState = null;
        previousBoard = null;
        isGameEnded = false;
        
        generateNewTile();
        generateNewTile();
        
        renderGameBoard();
        saveCurrentGame();
        
        gameEndModal.classList.remove('active');
        leaderboardModal.classList.remove('active');
    }
    
    function setupEventHandlers() {
        document.addEventListener('keydown', (e) => {
            if (isGameEnded && !gameEndModal.classList.contains('active')) return;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    makeMove('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    makeMove('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    makeMove('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    makeMove('right');
                    break;
            }
        });
        
        upBtn.addEventListener('click', () => makeMove('up'));
        downBtn.addEventListener('click', () => makeMove('down'));
        leftBtn.addEventListener('click', () => makeMove('left'));
        rightBtn.addEventListener('click', () => makeMove('right'));
        
        let touchStartX, touchStartY;
        
        gameBoardElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });
        
        gameBoardElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        gameBoardElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            const minSwipeDistance = 30;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipeDistance) {
                    if (dx > 0) {
                        makeMove('right');
                    } else {
                        makeMove('left');
                    }
                }
            } else {
                if (Math.abs(dy) > minSwipeDistance) {
                    if (dy > 0) {
                        makeMove('down');
                    } else {
                        makeMove('up');
                    }
                }
            }
            
            touchStartX = null;
            touchStartY = null;
        }, { passive: false });
        
        newGameBtn.addEventListener('click', startNewGame);
        undoBtn.addEventListener('click', undoLastMove);
        leaderboardBtn.addEventListener('click', displayLeaderboard);
        
        saveScoreBtn.addEventListener('click', () => {
            const name = playerNameField.value.trim();
            if (name) {
                addToLeaderboard(name);
                document.getElementById('name-input-section').style.display = 'none';
                scoreSavedMsg.style.display = 'block';
            }
        });
        
        restartBtn.addEventListener('click', startNewGame);
        closeModalBtn.addEventListener('click', () => {
            gameEndModal.classList.remove('active');
        });
        
        closeLeaderboardBtn.addEventListener('click', () => {
            leaderboardModal.classList.remove('active');
        });
        
        document.addEventListener('click', (e) => {
            if (e.target === gameEndModal) {
                gameEndModal.classList.remove('active');
            }
            if (e.target === leaderboardModal) {
                leaderboardModal.classList.remove('active');
            }
        });
        
        window.addEventListener('resize', () => {
            if (document.activeElement.tagName === 'INPUT') {
                window.scrollTo(0, 0);
            }
        });
    }
    
    initializeGame();
});