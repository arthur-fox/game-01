const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    speed: 5,
    color: '#e94560'
};

// Track which keys are pressed
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

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

// Update player position
function update() {
    if (keys.ArrowUp) {
        player.y -= player.speed;
    }
    if (keys.ArrowDown) {
        player.y += player.speed;
    }
    if (keys.ArrowLeft) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight) {
        player.x += player.speed;
    }

    // Keep player within canvas bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw a simple face to show direction
    ctx.fillStyle = '#ffffff';
    // Eyes
    ctx.fillRect(player.x + 8, player.y + 10, 6, 6);
    ctx.fillRect(player.x + 26, player.y + 10, 6, 6);
    // Mouth
    ctx.fillRect(player.x + 12, player.y + 26, 16, 4);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
