// Отримуємо посилання на canvas та його 2D-контекст
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const introScreen = document.getElementById('introScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const highScoreText = document.getElementById('highScoreText');
const currentScoreText = document.getElementById('currentScoreText');
const finalHighScoreText = document.getElementById('finalHighScoreText');

// --- Змінні гри ---
const bird = {
    x: 50,
    y: 0, // Початкова позиція буде встановлена після розміру canvas в resizeCanvas
    width: 30,
    height: 30,
    gravity: 0.2, // Трохи більша гравітація
    lift: -7, // Більша сила стрибка для великого проміжку
    velocity: 0
};

const pipes = [];
const pipeWidth = 50;
const pipeGap = 380; // Відстань між трубами = приблизно 10 см
let pipeSpeed = 1.0;

let score = 0;
let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
let gameOver = false;
let gameStarted = false;

let frame = 0;
const pipeInterval = 120; // Інтервал появи нових труб

const pipeColors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'];
let currentPipeColor = pipeColors[0];

// --- Функції налаштування розмірів та екранів ---

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bird.y = canvas.height / 2 - bird.height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function showIntroScreen() {
    introScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    canvas.style.display = 'none';
    highScoreText.textContent = `Максимальний рекорд: ${highScore}`;
    gameStarted = false;
}

function hideIntroScreen() {
    introScreen.style.display = 'none';
    canvas.style.display = 'block';
    gameStarted = true;
    resetGame();
}

function showGameOverScreen() {
    gameOverScreen.style.display = 'flex';
    canvas.style.display = 'none';
    currentScoreText.textContent = `Ваш рахунок: ${score}`;
    finalHighScoreText.textContent = `Максимальний рекорд: ${highScore}`;
}

// --- Функції малювання ---

function drawBird() {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(bird.x, bird.y);
    ctx.lineTo(bird.x + bird.width, bird.y + bird.height / 2);
    ctx.lineTo(bird.x, bird.y + bird.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.x + bird.width / 4, bird.y + bird.height / 4, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipe(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '24px "Press Start 2P"';
    ctx.fillText('Очки: ' + score, 10, 30);
}

// --- Логіка гри ---

function update() {
    if (gameOver || !gameStarted) return;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Перевірка зіткнення з ВЕРХНІМ краєм канвасу (зупиняємо пташку на краю)
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
    // <<< КЛЮЧОВА ЗМІНА: Рядок, що викликав Game Over при падінні вниз, ВИДАЛЕНО/ЗАКОМЕНТОВАНО
    // if (bird.y + bird.height > canvas.height) { endGame(); return; }

    if (frame % pipeInterval === 0) {
        const minOffset = 70;
        const maxOffset = 70;

        const minCenterY = minOffset + (pipeGap / 2);
        const maxCenterY = canvas.height - maxOffset - (pipeGap / 2);

        if (minCenterY > maxCenterY) {
            console.warn("pipeGap занадто великий для поточної висоти екрану з відступами! Зменшіть pipeGap або відступи.");
            const fallbackCenterY = canvas.height / 2;
            const topPipeHeight = fallbackCenterY - (pipeGap / 2);
            if (topPipeHeight < 0) {
                pipes.push({
                    x: canvas.width, y: 0, width: pipeWidth, height: 0, passed: false, color: currentPipeColor
                });
                pipes.push({
                    x: canvas.width, y: pipeGap, width: pipeWidth, height: canvas.height - pipeGap, passed: false, color: currentPipeColor
                });
            } else {
                 pipes.push({
                    x: canvas.width, y: 0, width: pipeWidth, height: topPipeHeight, passed: false, color: currentPipeColor
                });
                pipes.push({
                    x: canvas.width, y: fallbackCenterY + (pipeGap / 2), width: pipeWidth, height: canvas.height - (fallbackCenterY + (pipeGap / 2)), passed: false, color: currentPipeColor
                });
            }
            currentPipeColor = pipeColors[Math.floor(Math.random() * pipeColors.length)];
            return;
        }

        const randomCenterY = Math.floor(Math.random() * (maxCenterY - minCenterY + 1)) + minCenterY;

        const topPipeHeight = randomCenterY - (pipeGap / 2);

        currentPipeColor = pipeColors[Math.floor(Math.random() * pipeColors.length)];

        pipes.push({
            x: canvas.width,
            y: 0,
            width: pipeWidth,
            height: topPipeHeight,
            passed: false,
            color: currentPipeColor
        });
        pipes.push({
            x: canvas.width,
            y: randomCenterY + (pipeGap / 2),
            width: pipeWidth,
            height: canvas.height - (randomCenterY + (pipeGap / 2)),
            passed: false,
            color: currentPipeColor
        });
    }

    for (let i = 0; i < pipes.length; i += 2) {
        const topPipe = pipes[i];
        const bottomPipe = pipes[i + 1];

        topPipe.x -= pipeSpeed;
        bottomPipe.x -= pipeSpeed;

        if (
            bird.x < topPipe.x + topPipe.width &&
            bird.x + bird.width > topPipe.x &&
            bird.y < topPipe.y + topPipe.height &&
            bird.y + bird.height > topPipe.y
        ) {
            endGame();
            return;
        }

        if (
            bird.x < bottomPipe.x + bottomPipe.width &&
            bird.x + bird.width > bottomPipe.x &&
            bird.y < bottomPipe.y + bottomPipe.height &&
            bird.y + bird.height > bottomPipe.y
        ) {
            endGame();
            return;
        }

        if (!topPipe.passed && bird.x > topPipe.x + topPipe.width) {
            score++;
            topPipe.passed = true;
            bottomPipe.passed = true;
        }
    }

    if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
        pipes.shift();
        pipes.shift();
    }

    frame++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `hsl(${frame * 0.1 % 360}, 70%, 70%)`);
    gradient.addColorStop(1, `hsl(${(frame * 0.1 + 60) % 360}, 70%, 85%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBird();

    for (let i = 0; i < pipes.length; i++) {
        drawPipe(pipes[i].x, pipes[i].y, pipes[i].width, pipes[i].height, pipes[i].color);
    }

    drawScore();
}

let animationFrameId;

function gameLoop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    cancelAnimationFrame(animationFrameId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
    }
    showGameOverScreen();
}

function resetGame() {
    bird.y = canvas.height / 2 - bird.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    score = 0;
    gameOver = false;
    frame = 0;
    pipeSpeed = 1.0;

    gameOverScreen.style.display = 'none';
    canvas.style.display = 'block';
    gameLoop();
}

// --- Обробник подій ---
document.addEventListener('DOMContentLoaded', () => {
    showIntroScreen();

    document.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            if (!gameStarted) {
                hideIntroScreen();
            } else if (!gameOver) {
                bird.velocity = bird.lift;
            }
        }
        if (e.code === 'KeyR' && gameOver) {
            resetGame();
        }
    });
});