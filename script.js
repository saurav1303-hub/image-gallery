// Flying Birds - script.js
// Beginner-friendly game logic using DOM, no libraries.

/* Basic physics and control parameters */
const GRAVITY = 0.5;        // downward acceleration
const FLAP_STRENGTH = -8;   // upward velocity when player flaps
const H_SPEED = 2.2;        // horizontal speed (bird slowly moves right)
const PIPE_SPEED = 2.2;     // leftward speed of pipes (kept same as H_SPEED)
const PIPE_INTERVAL = 1600; // ms between pipes
const GAP_SIZE = 160;       // vertical gap between top and bottom pipe

/* DOM references */
const game = document.getElementById('game');
const birdEl = document.getElementById('bird');
const scoreEl = document.getElementById('score');
const message = document.getElementById('message');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restart');

let gameWidth, gameHeight;
let lastPipeTime = 0;
let pipes = [];
let score = 0;
let running = false;
let rafId = null;

// Bird state
const bird = {
  x: 80,
  y: 200,
  vy: 0,
  width: 48,
  height: 34,
};

function resize() {
  gameWidth = game.clientWidth;
  gameHeight = game.clientHeight;
}

window.addEventListener('resize', resize);
resize();

/* Input handlers: spacebar or mouse click to flap. */
function flap() {
  if (!running) return start();
  bird.vy = FLAP_STRENGTH;
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    flap();
  }
});
window.addEventListener('mousedown', (e) => {
  flap();
});

restartBtn.addEventListener('click', restart);

/* Create a pipe pair (top and bottom). We store logical x and DOM nodes. */
function createPipe() {
  const gapTop = 60 + Math.random() * (gameHeight - GAP_SIZE - 140);
  const pipeWidth = 60;

  const top = document.createElement('div');
  top.className = 'pipe top';
  top.style.height = `${gapTop}px`;
  top.style.left = `${gameWidth}px`;
  top.style.top = `0px`;

  const bottom = document.createElement('div');
  bottom.className = 'pipe bottom';
  bottom.style.height = `${gameHeight - gapTop - GAP_SIZE}px`;
  bottom.style.left = `${gameWidth}px`;
  bottom.style.top = `${gapTop + GAP_SIZE}px`;

  game.appendChild(top);
  game.appendChild(bottom);

  pipes.push({ x: gameWidth, width: pipeWidth, topEl: top, bottomEl: bottom, scored: false });
}

/* Collision detection between two DOM rects. */
function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

/* Main game update loop */
function update(ts) {
  if (!running) return;

  // spawn pipes periodically
  if (!lastPipeTime || ts - lastPipeTime > PIPE_INTERVAL) {
    createPipe();
    lastPipeTime = ts;
  }

  // physics: gravity
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.x += H_SPEED; // bird moves slightly to the right continuously

  // update bird DOM
  birdEl.style.left = `${bird.x}px`;
  birdEl.style.top = `${bird.y}px`;

  // move pipes left and update their DOM
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;
    p.topEl.style.left = `${p.x}px`;
    p.bottomEl.style.left = `${p.x}px`;

    // scoring: when the pipe passes the bird
    if (!p.scored && (p.x + p.width) < bird.x) {
      p.scored = true;
      score += 1;
      scoreEl.textContent = `Score: ${score}`;
    }

    // remove offscreen pipes
    if (p.x + p.width < -50) {
      p.topEl.remove();
      p.bottomEl.remove();
      pipes.splice(i, 1);
    }
  }

  // collisions
  const birdRect = birdEl.getBoundingClientRect();

  // check bounds (top/bottom)
  if (birdRect.top < 0 || birdRect.bottom > game.getBoundingClientRect().bottom) {
    return gameOver();
  }

  // check each pipe
  for (const p of pipes) {
    const topRect = p.topEl.getBoundingClientRect();
    const bottomRect = p.bottomEl.getBoundingClientRect();
    if (rectsOverlap(birdRect, topRect) || rectsOverlap(birdRect, bottomRect)) {
      return gameOver();
    }
  }

  // loop wrap: if bird reaches far right, wrap to left for continuous flying feel
  if (bird.x > gameWidth - bird.width - 20) {
    bird.x = 20; // wrap to left
  }

  rafId = requestAnimationFrame(update);
}

function start() {
  // reset game state
  resize();
  bird.x = 80;
  bird.y = Math.min(200, gameHeight/2);
  bird.vy = 0;
  score = 0;
  scoreEl.textContent = `Score: ${score}`;

  // remove existing pipes
  for (const p of pipes) { p.topEl.remove(); p.bottomEl.remove(); }
  pipes = [];
  lastPipeTime = 0;
  running = true;
  message.classList.add('hidden');
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(update);
  return true;
}

function gameOver() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  finalScore.textContent = `Your score: ${score}`;
  message.classList.remove('hidden');
}

function restart() {
  message.classList.add('hidden');
  start();
}

// Start paused. Click or press Space to begin.
message.classList.remove('hidden');
finalScore.textContent = 'Press Space or Click to start';

// Allow click on overlay to start as well
message.addEventListener('mousedown', (e) => {
  if (!running) start();
});
