const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // 'start', 'playing', 'end'
let gameStartTime = 0;
let survivalTime = 0;
let worldSeed = Date.now();

// Screen delay system
let screenEnteredTime = Date.now();
const SCREEN_DELAY = 2000; // 2 seconds

// Enemy system
const enemies = [];
let maxEnemies = 1;
let lastEnemySpawnTime = 0;
let lastEnemyIncreaseTime = 0;
const ENEMY_INCREASE_INTERVAL = 5000; // 5 seconds
const ENEMY_SPAWN_COOLDOWN = 1000; // 1 second between spawns

// Camera position (world coordinates)
let cameraX = 0;

// Set canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Player object (position in world coordinates)
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    speed: 10,
    velocityY: 0,
    gravity: 0.6,
    jumpForce: -15,
    isGrounded: false,
    color: '#e94560'
};

// Platform management
const platforms = [];
const platformChunks = new Set(); // Track which chunks have been generated

// Platform generation settings
const CHUNK_SIZE = 800;
const PLATFORMS_PER_CHUNK = 3;

// Seeded random number generator for consistent platform placement
function seededRandom(seed) {
    const x = Math.sin((seed + worldSeed) * 9999) * 10000;
    return x - Math.floor(x);
}

// Reset game state for new game
function resetGame() {
    // Generate new world seed for different platforms
    worldSeed = Date.now();

    // Reset player
    player.x = 100;
    player.y = 0;
    player.velocityY = 0;
    player.isGrounded = false;

    // Clear platforms
    platforms.length = 0;
    platformChunks.clear();

    // Clear enemies
    enemies.length = 0;
    maxEnemies = 1;
    lastEnemySpawnTime = 0;
    lastEnemyIncreaseTime = 0;

    // Reset camera
    cameraX = 0;

    // Reset timer
    survivalTime = 0;
}

// Spawn a new enemy at screen edge
function spawnEnemy() {
    const now = Date.now();
    if (now - lastEnemySpawnTime < ENEMY_SPAWN_COOLDOWN) return;
    if (enemies.length >= maxEnemies) return;

    lastEnemySpawnTime = now;

    // Spawn from left or right edge (prefer opposite side of player movement)
    const spawnFromLeft = Math.random() < 0.5;
    const spawnX = spawnFromLeft
        ? cameraX - 50
        : cameraX + canvas.width + 10;

    const groundY = canvas.height - Graphics.groundHeight - 40;

    const enemy = {
        x: spawnX,
        y: groundY,
        width: 40,
        height: 40,
        speed: 3 + Math.random() * 2, // 3-5 speed
        direction: spawnFromLeft ? 1 : -1, // face toward center
        velocityY: 0,
        gravity: 0.6,
        jumpForce: -12,
        isGrounded: true,
        canJump: Math.random() < 0.3, // 30% chance to be a jumper
        nextJumpTime: now + 1000 + Math.random() * 2000
    };

    enemies.push(enemy);
}

// Update all enemies
function updateEnemies() {
    const now = Date.now();
    const groundY = canvas.height - Graphics.groundHeight - 40;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move toward player
        enemy.x += enemy.speed * enemy.direction;

        // Random jumping for jumpers
        if (enemy.canJump && enemy.isGrounded && now > enemy.nextJumpTime) {
            enemy.velocityY = enemy.jumpForce;
            enemy.isGrounded = false;
            enemy.nextJumpTime = now + 1500 + Math.random() * 2000;
        }

        // Apply gravity
        enemy.velocityY += enemy.gravity;
        enemy.y += enemy.velocityY;

        // Ground collision
        if (enemy.y >= groundY) {
            enemy.y = groundY;
            enemy.velocityY = 0;
            enemy.isGrounded = true;
        }

        // Platform collisions
        for (const platform of platforms) {
            if (checkEnemyPlatformCollision(enemy, platform)) {
                enemy.y = platform.y - enemy.height;
                enemy.velocityY = 0;
                enemy.isGrounded = true;
                break;
            }
        }

        // Remove if too far off screen
        const distanceFromCamera = Math.abs(enemy.x - (cameraX + canvas.width / 2));
        if (distanceFromCamera > canvas.width * 1.5) {
            enemies.splice(i, 1);
        }
    }
}

// Check enemy-platform collision
function checkEnemyPlatformCollision(enemy, platform) {
    const enemyBottom = enemy.y + enemy.height;
    const enemyRight = enemy.x + enemy.width;
    const platformBottom = platform.y + platform.height;

    if (enemyRight > platform.x && enemy.x < platform.x + platform.width) {
        if (enemy.velocityY >= 0 &&
            enemyBottom >= platform.y &&
            enemyBottom <= platformBottom + enemy.velocityY + 1 &&
            enemy.y < platform.y) {
            return true;
        }
    }
    return false;
}

// Check player-enemy collision
function checkPlayerEnemyCollision() {
    for (const enemy of enemies) {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            return true;
        }
    }
    return false;
}

// Generate platforms for a chunk
function generateChunk(chunkIndex) {
    if (platformChunks.has(chunkIndex)) return;
    platformChunks.add(chunkIndex);

    const chunkStart = chunkIndex * CHUNK_SIZE;
    const groundY = canvas.height - Graphics.groundHeight;

    for (let i = 0; i < PLATFORMS_PER_CHUNK; i++) {
        const seed = chunkIndex * 1000 + i;
        const rand1 = seededRandom(seed);
        const rand2 = seededRandom(seed + 1);
        const rand3 = seededRandom(seed + 2);

        const platformWidth = 80 + rand1 * 120;
        const platformX = chunkStart + 100 + rand2 * (CHUNK_SIZE - 200 - platformWidth);
        const platformY = groundY - 100 - rand3 * 250;

        platforms.push({
            x: platformX,
            y: platformY,
            width: platformWidth,
            height: 20
        });
    }
}

// Remove platforms that are too far from the player
function cleanupPlatforms() {
    const cullDistance = CHUNK_SIZE * 3;
    for (let i = platforms.length - 1; i >= 0; i--) {
        if (Math.abs(platforms[i].x - player.x) > cullDistance) {
            platforms.splice(i, 1);
        }
    }

    // Also cleanup chunk tracking for far away chunks
    const currentChunk = Math.floor(player.x / CHUNK_SIZE);
    for (const chunk of platformChunks) {
        if (Math.abs(chunk - currentChunk) > 4) {
            platformChunks.delete(chunk);
        }
    }
}

// Track which keys are pressed
const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

// Check collision between player and a platform
function checkPlatformCollision(platform) {
    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;
    const platformBottom = platform.y + platform.height;

    // Check if player is horizontally aligned with platform
    if (playerRight > platform.x && player.x < platform.x + platform.width) {
        // Check if player is falling onto platform from above
        if (player.velocityY >= 0 &&
            playerBottom >= platform.y &&
            playerBottom <= platformBottom + player.velocityY + 1 &&
            player.y < platform.y) {
            return true;
        }
    }
    return false;
}

// Update player position
function update() {
    // Horizontal movement
    if (keys.ArrowLeft) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight) {
        player.x += player.speed;
    }

    // Jump
    if (keys.ArrowUp && player.isGrounded) {
        player.velocityY = player.jumpForce;
        player.isGrounded = false;
    }

    // Apply gravity
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Ground collision
    const groundY = canvas.height - Graphics.groundHeight - player.height;
    player.isGrounded = false;

    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // Platform collisions
    for (const platform of platforms) {
        if (checkPlatformCollision(platform)) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
            break;
        }
    }

    // Ceiling limit
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }

    // Update camera to follow player (centered horizontally)
    cameraX = player.x - canvas.width / 2 + player.width / 2;

    // Generate platforms for nearby chunks
    const currentChunk = Math.floor(player.x / CHUNK_SIZE);
    for (let i = currentChunk - 2; i <= currentChunk + 2; i++) {
        generateChunk(i);
    }

    // Periodically cleanup distant platforms
    if (Math.random() < 0.01) {
        cleanupPlatforms();
    }
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
        // Draw background for start screen
        Graphics.drawBackground(ctx, canvas, 0);
        Graphics.drawStartScreen(ctx, canvas, canProceed);
    } else if (gameState === 'playing') {
        // Update survival time
        survivalTime = (Date.now() - gameStartTime) / 1000;

        // Increase max enemies every 5 seconds
        if (now - lastEnemyIncreaseTime >= ENEMY_INCREASE_INTERVAL) {
            maxEnemies++;
            lastEnemyIncreaseTime = now;
        }

        // Spawn enemies
        spawnEnemy();

        // Update enemies
        updateEnemies();

        // Check for player-enemy collision
        if (checkPlayerEnemyCollision()) {
            gameState = 'end';
            screenEnteredTime = Date.now();
        }

        update();
        draw();
        Graphics.drawTimer(ctx, canvas, survivalTime);
    } else if (gameState === 'end') {
        // Keep drawing the last game state as background
        draw();
        Graphics.drawEndScreen(ctx, canvas, survivalTime, canProceed);
    }

    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
