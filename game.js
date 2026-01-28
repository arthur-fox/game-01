const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
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

    // Draw player
    Graphics.drawPlayer(ctx, player, cameraX);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
