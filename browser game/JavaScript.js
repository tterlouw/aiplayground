const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let playerX = canvas.width / 2;
let playerY = canvas.height - 20;
const playerWidth = 20;
const playerHeight = 20;
const playerSpeed = 5;
let diamonds = [];
let rocks = [];
let dynamites = [];
const objectWidth = 20;
const objectHeight = 20;
let diamondImage = new Image();
diamondImage.src = 'diamond.svg';
let diamondCount = 0;
let gameOver = false;
let gameInterval;

// Input handling
let leftPressed = false;
let rightPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === 'ArrowRight') {
        rightPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
        leftPressed = false;
    } else if (e.key === 'ArrowRight') {
        rightPressed = false;
    }
});

// Object creation
function createDiamond() {
    return {
        x: Math.random() * (canvas.width - objectWidth),
        y: 0,
        type: 'diamond',
        speed: 2
    };
}

function createRock() {
    return {
        x: Math.random() * (canvas.width - objectWidth),
        y: 0,
        type: 'rock',
        speed: 3
    };
}

function createDynamite() {
    return {
        x: Math.random() * (canvas.width - objectWidth),
        y: 0,
        type: 'dynamite',
        speed: 3
    };
}

// Game functions
function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
}

function drawObjects() {
    diamonds.forEach(diamond => {
        ctx.drawImage(diamondImage, diamond.x, diamond.y, objectWidth, objectHeight);
    });
    rocks.forEach(rock => {
        ctx.fillStyle = 'gray';
        ctx.fillRect(rock.x, rock.y, objectWidth, objectHeight);
    });
    dynamites.forEach(dynamite => {
        ctx.fillStyle = 'red';
        ctx.fillRect(dynamite.x, dynamite.y, objectWidth, objectHeight);
    });
}

function updateObjects() {
    diamonds.forEach(diamond => {
        diamond.y += diamond.speed;
    });
    rocks.forEach(rock => {
        rock.y += rock.speed;
    });
    dynamites.forEach(dynamite => {
        dynamite.y += dynamite.speed;
    });
}

function checkCollisions() {
    // Player and diamond collisions
    diamonds = diamonds.filter(diamond => {
        if (playerX < diamond.x + objectWidth &&
            playerX + playerWidth > diamond.x &&
            playerY < diamond.y + objectHeight &&
            playerY + playerHeight > diamond.y) {
            diamondCount++;
            return false; // Remove the diamond
        }
        return true; // Keep the diamond
    });

    // Player and rock collisions
    rocks.forEach(rock => {
        if (playerX < rock.x + objectWidth &&
            playerX + playerWidth > rock.x &&
            playerY < rock.y + objectHeight &&
            playerY + playerHeight > rock.y) {
            gameOver = true;
        }
    });

    // Player and dynamite collisions
    dynamites.forEach(dynamite => {
        if (playerX < dynamite.x + objectWidth &&
            playerX + playerWidth > dynamite.x &&
            playerY < dynamite.y + objectHeight &&
            playerY + playerHeight > dynamite.y) {
            gameOver = true;
        }
    });
}

function movePlayer() {
    if (leftPressed && playerX > 0) {
        playerX -= playerSpeed;
    }
    if (rightPressed && playerX < canvas.width - playerWidth) {
        playerX += playerSpeed;
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('Diamonds: ' + diamondCount, 10, 20);
}

function drawGameOver() {
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Diamonds Collected: ' + diamondCount, canvas.width / 2, canvas.height / 2 + 40);
}

function gameLoop() {
    if (gameOver) {
        clearInterval(gameInterval);
        drawGameOver();
        return;
    }

    // Object creation
    if (Math.random() < 0.02) {
        diamonds.push(createDiamond());
    }
    if (Math.random() < 0.01) {
        rocks.push(createRock());
    }
    if (Math.random() < 0.01) {
        dynamites.push(createDynamite());
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game elements
    movePlayer();
    updateObjects();
    checkCollisions();

    // Draw game elements
    drawPlayer();
    drawObjects();
    drawScore();

    // Remove objects that are off-screen
    diamonds = diamonds.filter(diamond => diamond.y < canvas.height);
    rocks = rocks.filter(rock => rock.y < canvas.height);
    dynamites = dynamites.filter(dynamite => dynamite.y < canvas.height);
}

// Start the game
gameInterval = setInterval(gameLoop, 20);
