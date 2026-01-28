// Enemy management

const enemies = [];
let maxEnemies = 1;
let lastEnemySpawnTime = 0;
let lastEnemyIncreaseTime = 0;

const ENEMY_INCREASE_INTERVAL = 5000; // 5 seconds
const ENEMY_SPAWN_COOLDOWN = 1000; // 1 second between spawns
const MAX_TOTAL_ENEMIES = 50;
const FLYING_ENEMY_START_TIME = 10000; // Flying enemies after 10 seconds

// Spawn a ground enemy at screen edge
function spawnGroundEnemy(cameraX, canvas) {
    const now = Date.now();
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
        speed: 3 + Math.random() * 2,
        direction: spawnFromLeft ? 1 : -1,
        velocityY: 0,
        gravity: 0.6,
        jumpForce: -12,
        isGrounded: true,
        canJump: Math.random() < 0.3,
        nextJumpTime: now + 1000 + Math.random() * 2000,
        isFlying: false
    };

    enemies.push(enemy);
}

// Spawn a flying enemy at screen edge
function spawnFlyingEnemy(cameraX, canvas) {
    const spawnFromLeft = Math.random() < 0.5;
    const spawnX = spawnFromLeft
        ? cameraX - 50
        : cameraX + canvas.width + 10;

    // Spawn in upper portion of screen
    const minY = 50;
    const maxY = canvas.height - Graphics.groundHeight - 150;
    const spawnY = minY + Math.random() * (maxY - minY);

    const enemy = {
        x: spawnX,
        y: spawnY,
        baseY: spawnY,
        startX: spawnX,
        width: 40,
        height: 40,
        speed: 4 + Math.random() * 2,
        direction: spawnFromLeft ? 1 : -1,
        isFlying: true,
        zigzag: Math.random() < 0.5,
        zigzagAmplitude: 40 + Math.random() * 30,
        zigzagFrequency: 0.01 + Math.random() * 0.01,
        wingFrame: 0
    };

    enemies.push(enemy);
}

// Main spawn function - decides which type to spawn
function spawnEnemy(cameraX, canvas, gameStartTime) {
    const now = Date.now();
    if (now - lastEnemySpawnTime < ENEMY_SPAWN_COOLDOWN) return;
    if (enemies.length >= maxEnemies) return;
    if (enemies.length >= MAX_TOTAL_ENEMIES) return;

    lastEnemySpawnTime = now;

    const timePlaying = now - gameStartTime;
    const canSpawnFlying = timePlaying > FLYING_ENEMY_START_TIME;

    // 30% chance for flying enemy after 10 seconds
    if (canSpawnFlying && Math.random() < 0.3) {
        spawnFlyingEnemy(cameraX, canvas);
    } else {
        spawnGroundEnemy(cameraX, canvas);
    }
}

// Check enemy-platform collision (for ground enemies)
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

// Update all enemies
function updateEnemies(cameraX, canvas) {
    const now = Date.now();
    const groundY = canvas.height - Graphics.groundHeight - 40;

    // Force remove if over cap (remove farthest first)
    while (enemies.length > MAX_TOTAL_ENEMIES) {
        let farthestIndex = 0;
        let farthestDistance = 0;
        for (let i = 0; i < enemies.length; i++) {
            const dist = Math.abs(enemies[i].x - (cameraX + canvas.width / 2));
            if (dist > farthestDistance) {
                farthestDistance = dist;
                farthestIndex = i;
            }
        }
        enemies.splice(farthestIndex, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.isFlying) {
            // Flying enemy update
            enemy.x += enemy.speed * enemy.direction;

            // Zigzag movement
            if (enemy.zigzag) {
                const distanceTraveled = Math.abs(enemy.x - enemy.startX);
                enemy.y = enemy.baseY + Math.sin(distanceTraveled * enemy.zigzagFrequency) * enemy.zigzagAmplitude;
            }

            // Update wing animation
            enemy.wingFrame = (enemy.wingFrame + 0.2) % (Math.PI * 2);

        } else {
            // Ground enemy update
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
        }

        // Remove if too far off screen
        const distanceFromCamera = Math.abs(enemy.x - (cameraX + canvas.width / 2));
        if (distanceFromCamera > canvas.width * 1.5) {
            enemies.splice(i, 1);
        }
    }
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

// Increase max enemies (called every 5 seconds)
function increaseMaxEnemies() {
    maxEnemies++;
}

// Reset enemies for new game
function resetEnemies() {
    enemies.length = 0;
    maxEnemies = 1;
    lastEnemySpawnTime = 0;
    lastEnemyIncreaseTime = 0;
}
