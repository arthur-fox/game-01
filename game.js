// Main game controller

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // 'start', 'playing', 'dead', 'entering_name', 'end'
let gameStartTime = 0;
let survivalTime = 0;
let worldSeed = Date.now();

// Leaderboard state
let playerName = '';
let isHighScore = false;
let leaderboardFetched = false;

// Screen delay system
let screenEnteredTime = Date.now();
const SCREEN_DELAY = 2000; // 2 seconds

// Delta time tracking for accurate updates
let lastFrameTime = Date.now();

// Camera position (world coordinates)
let cameraX = 0;

// Set canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Handle player death - check leaderboard and transition state
async function handlePlayerDeath() {
    // IMMEDIATELY stop gameplay
    gameState = 'dead';

    GameAudio.playHit();
    GameAudio.stopMusic();

    // Fetch current leaderboard (game is already paused)
    await Leaderboard.fetch();
    leaderboardFetched = true;

    // Check if player made the top 10
    if (Leaderboard.qualifies(survivalTime)) {
        isHighScore = true;
        playerName = '';
        gameState = 'entering_name';
    } else {
        isHighScore = false;
        gameState = 'end';
    }

    screenEnteredTime = Date.now();
}

// Submit the player's score
async function submitScore() {
    await Leaderboard.submit(playerName, survivalTime);
    gameState = 'end';
    screenEnteredTime = Date.now();
}

// Event listeners for key presses
document.addEventListener('keydown', (e) => {
    const now = Date.now();
    const canProceed = now - screenEnteredTime >= SCREEN_DELAY;

    // Handle game state transitions
    if (gameState === 'start') {
        if (canProceed) {
            gameState = 'playing';
            gameStartTime = Date.now();
            lastEnemyIncreaseTime = Date.now();
            Leaderboard.resetPlayerRank();
            GameAudio.init();
            GameAudio.playMusic();
        }
        e.preventDefault();
        return;
    }

    // Name entry state - handle letter input
    if (gameState === 'entering_name') {
        // Letter keys (A-Z)
        if (e.key.length === 1 && e.key.match(/[a-zA-Z]/) && playerName.length < 4) {
            playerName += e.key.toUpperCase();
            e.preventDefault();
            return;
        }

        // Backspace - delete last character
        if (e.key === 'Backspace' && playerName.length > 0) {
            playerName = playerName.slice(0, -1);
            e.preventDefault();
            return;
        }

        // Enter - submit if we have at least 1 character
        if (e.key === 'Enter' && playerName.length > 0) {
            submitScore();
            e.preventDefault();
            return;
        }

        e.preventDefault();
        return;
    }

    if (gameState === 'end') {
        if (canProceed) {
            resetGame();
            gameState = 'start';
            screenEnteredTime = Date.now();
        }
        e.preventDefault();
        return;
    }

    // Mute toggle with M key
    if (e.key === 'm' || e.key === 'M') {
        GameAudio.toggleSound();
        e.preventDefault();
        return;
    }

    // Normal gameplay key handling
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

// Click handler for mute button
canvas.addEventListener('click', (e) => {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const bounds = Graphics.getMuteButtonBounds(canvas);

    if (clickX >= bounds.x && clickX <= bounds.x + bounds.width &&
        clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
        GameAudio.toggleSound();
    }
});

// Reset game state for new game
function resetGame() {
    worldSeed = Date.now();
    resetPlayer();
    resetPlatforms();
    resetEnemies();
    cameraX = 0;
    survivalTime = 0;
    playerName = '';
    isHighScore = false;
    leaderboardFetched = false;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background with parallax
    Graphics.drawBackground(ctx, canvas, cameraX);

    // Draw platforms
    for (const platform of platforms) {
        Graphics.drawPlatform(ctx, platform, cameraX);
    }

    // Draw enemies
    for (const enemy of enemies) {
        Graphics.drawEnemy(ctx, enemy, cameraX);
    }

    // Draw player
    Graphics.drawPlayer(ctx, player, cameraX);
}

// Game loop
function gameLoop() {
    const now = Date.now();
    const canProceed = now - screenEnteredTime >= SCREEN_DELAY;

    if (gameState === 'start') {
        // Reset frame time when in start screen
        lastFrameTime = now;
        // Draw background for start screen
        Graphics.drawBackground(ctx, canvas, 0);
        Graphics.drawStartScreen(ctx, canvas, canProceed);
    } else if (gameState === 'playing') {
        // Calculate delta time (capped at 100ms to prevent huge jumps)
        const deltaTime = Math.min(100, now - lastFrameTime);
        lastFrameTime = now;

        // Update survival time
        survivalTime = (Date.now() - gameStartTime) / 1000;

        // Increase max enemies every 5 seconds
        if (now - lastEnemyIncreaseTime >= ENEMY_INCREASE_INTERVAL) {
            increaseMaxEnemies();
            lastEnemyIncreaseTime = now;
        }

        // Spawn enemies (pass survivalTime for speed scaling)
        spawnEnemy(cameraX, canvas, gameStartTime, survivalTime);

        // Update enemies
        updateEnemies(cameraX, canvas);

        // Update platform stability (disappearing platforms)
        updatePlatformStability(player, deltaTime);

        // Check for player-enemy collision
        if (checkPlayerEnemyCollision()) {
            handlePlayerDeath();
        }

        // Update player
        updatePlayer(canvas);

        // Update camera to follow player
        cameraX = player.x - canvas.width / 2 + player.width / 2;

        // Update platforms
        updatePlatforms(player.x, canvas, worldSeed);

        draw();
        Graphics.drawTimer(ctx, canvas, survivalTime);
        Graphics.drawMuteButton(ctx, canvas, GameAudio.isSoundEnabled());
    } else if (gameState === 'dead') {
        // Frozen state while fetching leaderboard
        draw();
        // Show a simple "loading" overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('You Died', canvas.width / 2, canvas.height / 2);
    } else if (gameState === 'entering_name') {
        // Draw game state in background
        draw();
        Graphics.drawNameEntry(ctx, canvas, survivalTime, playerName);
    } else if (gameState === 'end') {
        // Keep drawing the last game state as background
        draw();
        Graphics.drawEndScreen(ctx, canvas, survivalTime, canProceed, Leaderboard.scores, Leaderboard.playerRank);
    }

    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
