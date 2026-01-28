// Player management

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

// Track which keys are pressed
const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Check collision between player and a platform
function checkPlayerPlatformCollision(platform) {
    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;
    const platformBottom = platform.y + platform.height;

    if (playerRight > platform.x && player.x < platform.x + platform.width) {
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
function updatePlayer(canvas) {
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
        if (checkPlayerPlatformCollision(platform)) {
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
}

// Reset player for new game
function resetPlayer() {
    player.x = 100;
    player.y = 0;
    player.velocityY = 0;
    player.isGrounded = false;
}
