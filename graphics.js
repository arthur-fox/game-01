// Graphics and background rendering

const Graphics = {
    groundHeight: 60,

    // Draw the complete background
    drawBackground(ctx, canvas, cameraX) {
        this.drawSky(ctx, canvas);
        this.drawHills(ctx, canvas, cameraX);
        this.drawTrees(ctx, canvas, cameraX);
        this.drawGround(ctx, canvas, cameraX);
    },

    // Draw sky gradient
    drawSky(ctx, canvas) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - this.groundHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#98D8E8');
        gradient.addColorStop(1, '#B8E8F0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height - this.groundHeight);
    },

    // Draw rolling hills with parallax
    drawHills(ctx, canvas, cameraX) {
        // Distant hills (back layer) - slower parallax
        ctx.fillStyle = '#5B8A5B';
        this.drawHillLayer(ctx, canvas, canvas.height - this.groundHeight - 80, 120, 200, cameraX * 0.3);

        // Mid hills - medium parallax
        ctx.fillStyle = '#4A7A4A';
        this.drawHillLayer(ctx, canvas, canvas.height - this.groundHeight - 40, 80, 150, cameraX * 0.5);
    },

    // Draw a single hill layer
    drawHillLayer(ctx, canvas, baseY, height, wavelength, offsetX) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 4) {
            const worldX = x + offsetX;
            const y = baseY - Math.sin(worldX / wavelength) * height * 0.3 - Math.sin(worldX / (wavelength * 0.5)) * height * 0.15;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    },

    // Draw pixel art trees
    drawTrees(ctx, canvas, cameraX) {
        // Calculate which trees are visible based on camera position
        const treeSpacing = 150;
        const startTree = Math.floor((cameraX - 100) / treeSpacing) * treeSpacing;
        const endTree = cameraX + canvas.width + 100;

        for (let worldX = startTree; worldX < endTree; worldX += treeSpacing) {
            // Add variation to tree position using seeded randomness
            const variation = Math.sin(worldX * 0.1) * 50;
            const treeWorldX = worldX + variation;
            const screenX = treeWorldX - cameraX;

            // Only draw if on screen
            if (screenX > -100 && screenX < canvas.width + 100) {
                this.drawTree(ctx, canvas, screenX, treeWorldX);
            }
        }
    },

    // Draw a single tree
    drawTree(ctx, canvas, screenX, worldX) {
        const treeHeight = 60 + Math.floor(Math.sin(worldX * 0.05) * 20);
        const trunkWidth = 12;
        const trunkHeight = treeHeight * 0.4;
        const foliageSize = treeHeight * 0.7;

        const baseY = canvas.height - this.groundHeight;

        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(
            screenX - trunkWidth / 2,
            baseY - trunkHeight,
            trunkWidth,
            trunkHeight
        );

        // Trunk detail
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(
            screenX - trunkWidth / 2 + 2,
            baseY - trunkHeight + 4,
            2,
            trunkHeight - 8
        );

        // Foliage layers (pixel art style - stacked rectangles)
        const foliageColors = ['#2E7D32', '#388E3C', '#43A047'];

        // Bottom foliage layer
        ctx.fillStyle = foliageColors[0];
        ctx.fillRect(
            screenX - foliageSize / 2,
            baseY - trunkHeight - foliageSize * 0.3,
            foliageSize,
            foliageSize * 0.35
        );

        // Middle foliage layer
        ctx.fillStyle = foliageColors[1];
        ctx.fillRect(
            screenX - foliageSize * 0.4,
            baseY - trunkHeight - foliageSize * 0.6,
            foliageSize * 0.8,
            foliageSize * 0.35
        );

        // Top foliage layer
        ctx.fillStyle = foliageColors[2];
        ctx.fillRect(
            screenX - foliageSize * 0.25,
            baseY - trunkHeight - foliageSize * 0.85,
            foliageSize * 0.5,
            foliageSize * 0.3
        );

        // Top point
        ctx.fillStyle = foliageColors[2];
        ctx.fillRect(
            screenX - 4,
            baseY - trunkHeight - foliageSize,
            8,
            foliageSize * 0.2
        );
    },

    // Draw ground with grass texture
    drawGround(ctx, canvas, cameraX) {
        // Main ground
        ctx.fillStyle = '#3D6B3D';
        ctx.fillRect(0, canvas.height - this.groundHeight, canvas.width, this.groundHeight);

        // Grass texture on top of ground
        ctx.fillStyle = '#4A8A4A';
        for (let screenX = 0; screenX < canvas.width; screenX += 8) {
            const worldX = screenX + cameraX;
            const grassHeight = 4 + Math.floor(Math.sin(worldX * 0.1) * 2);
            ctx.fillRect(screenX, canvas.height - this.groundHeight - grassHeight, 4, grassHeight + 4);
        }

        // Additional grass blades
        ctx.fillStyle = '#5AAA5A';
        for (let screenX = 0; screenX < canvas.width; screenX += 12) {
            const worldX = screenX + cameraX;
            const grassHeight = 6 + Math.floor(Math.cos(worldX * 0.15) * 3);
            ctx.fillRect(screenX + 4, canvas.height - this.groundHeight - grassHeight, 2, grassHeight);
        }
    },

    // Draw a platform
    drawPlatform(ctx, platform, cameraX) {
        const screenX = platform.x - cameraX;

        // Only draw if visible
        if (screenX + platform.width < 0 || screenX > ctx.canvas.width) {
            return;
        }

        // Platform base
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX, platform.y, platform.width, platform.height);

        // Platform top (grass)
        ctx.fillStyle = '#4A8A4A';
        ctx.fillRect(screenX, platform.y, platform.width, 8);

        // Platform grass detail
        ctx.fillStyle = '#5AAA5A';
        for (let px = 0; px < platform.width; px += 10) {
            const grassHeight = 3 + Math.floor(Math.sin((platform.x + px) * 0.2) * 2);
            ctx.fillRect(screenX + px, platform.y - grassHeight, 4, grassHeight);
        }

        // Platform edge detail
        ctx.fillStyle = '#6B3510';
        ctx.fillRect(screenX, platform.y + 8, 4, platform.height - 8);
        ctx.fillRect(screenX + platform.width - 4, platform.y + 8, 4, platform.height - 8);
    },

    // Draw the player
    drawPlayer(ctx, player, cameraX) {
        const screenX = player.x - cameraX;

        // Player body
        ctx.fillStyle = player.color;
        ctx.fillRect(screenX, player.y, player.width, player.height);

        // Face
        ctx.fillStyle = '#ffffff';
        // Eyes
        ctx.fillRect(screenX + 8, player.y + 10, 6, 6);
        ctx.fillRect(screenX + 26, player.y + 10, 6, 6);
        // Mouth
        ctx.fillRect(screenX + 12, player.y + 26, 16, 4);
    }
};
