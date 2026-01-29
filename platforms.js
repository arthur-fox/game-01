// Platform management

const platforms = [];
const platformChunks = new Set();

const CHUNK_SIZE = 800;
const PLATFORMS_PER_CHUNK = 3;
const MIN_PLATFORM_GAP = 30;

// Check if two platforms overlap (with minimum gap)
function platformsOverlap(p1, p2) {
    return !(p1.x + p1.width + MIN_PLATFORM_GAP < p2.x ||
             p2.x + p2.width + MIN_PLATFORM_GAP < p1.x ||
             p1.y + p1.height + MIN_PLATFORM_GAP < p2.y ||
             p2.y + p2.height + MIN_PLATFORM_GAP < p1.y);
}

// Check if a new platform overlaps with any existing platform
function checkPlatformOverlap(newPlatform) {
    for (const platform of platforms) {
        if (platformsOverlap(newPlatform, platform)) {
            return true;
        }
    }
    return false;
}

// Generate platforms for a chunk
function generateChunk(chunkIndex, canvas, worldSeed) {
    if (platformChunks.has(chunkIndex)) return;
    platformChunks.add(chunkIndex);

    const chunkStart = chunkIndex * CHUNK_SIZE;
    const groundY = canvas.height - Graphics.groundHeight;

    for (let i = 0; i < PLATFORMS_PER_CHUNK; i++) {
        const seed = chunkIndex * 1000 + i;
        const rand1 = seededRandom(seed, worldSeed);
        const rand2 = seededRandom(seed + 1, worldSeed);
        const rand3 = seededRandom(seed + 2, worldSeed);

        const platformWidth = 80 + rand1 * 120;
        const platformX = chunkStart + 100 + rand2 * (CHUNK_SIZE - 200 - platformWidth);
        const platformY = groundY - 100 - rand3 * 250;

        const newPlatform = {
            x: platformX,
            y: platformY,
            width: platformWidth,
            height: 20,
            standingTime: 0,      // How long player has stood on it (ms)
            fadeStartTime: null,  // When fade began (null = not fading)
            opacity: 1            // For visual fade (1 = solid, 0 = gone)
        };

        // Only add if it doesn't overlap with existing platforms
        if (!checkPlatformOverlap(newPlatform)) {
            platforms.push(newPlatform);
        }
    }
}

// Seeded random number generator
function seededRandom(seed, worldSeed) {
    const x = Math.sin((seed + worldSeed) * 9999) * 10000;
    return x - Math.floor(x);
}

// Remove platforms that are too far from the player
function cleanupPlatforms(playerX) {
    const cullDistance = CHUNK_SIZE * 3;
    for (let i = platforms.length - 1; i >= 0; i--) {
        if (Math.abs(platforms[i].x - playerX) > cullDistance) {
            platforms.splice(i, 1);
        }
    }

    // Also cleanup chunk tracking for far away chunks
    const currentChunk = Math.floor(playerX / CHUNK_SIZE);
    for (const chunk of platformChunks) {
        if (Math.abs(chunk - currentChunk) > 4) {
            platformChunks.delete(chunk);
        }
    }
}

// Generate platforms around the player
function updatePlatforms(playerX, canvas, worldSeed) {
    const currentChunk = Math.floor(playerX / CHUNK_SIZE);
    for (let i = currentChunk - 2; i <= currentChunk + 2; i++) {
        generateChunk(i, canvas, worldSeed);
    }

    // Periodically cleanup
    if (Math.random() < 0.01) {
        cleanupPlatforms(playerX);
    }
}

// Check if player is standing on a platform
function isPlayerOnPlatform(player, platform) {
    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;

    // Check if player's feet are on the platform
    return playerRight > platform.x &&
           player.x < platform.x + platform.width &&
           playerBottom >= platform.y &&
           playerBottom <= platform.y + 10 && // Within top 10px of platform
           player.velocityY >= 0; // Player is falling or stationary (not jumping up)
}

// Update platform stability - platforms disappear after player stands on them
function updatePlatformStability(player, deltaTime) {
    const STAND_TIME_BEFORE_FADE = 2000; // 2 seconds before fading starts
    const FADE_DURATION = 1000; // 1 second fade
    const now = Date.now();

    for (let i = platforms.length - 1; i >= 0; i--) {
        const platform = platforms[i];

        // Check if player is standing on this platform
        if (isPlayerOnPlatform(player, platform)) {
            platform.standingTime += deltaTime;

            // Start fading after standing for 2 seconds
            if (platform.standingTime >= STAND_TIME_BEFORE_FADE && platform.fadeStartTime === null) {
                platform.fadeStartTime = now;
            }
        }

        // Handle fading
        if (platform.fadeStartTime !== null) {
            const fadeProgress = (now - platform.fadeStartTime) / FADE_DURATION;
            platform.opacity = Math.max(0, 1 - fadeProgress);

            // Remove platform when fully faded
            if (platform.opacity <= 0) {
                platforms.splice(i, 1);
            }
        }
    }
}

// Reset platforms for new game
function resetPlatforms() {
    platforms.length = 0;
    platformChunks.clear();
}
