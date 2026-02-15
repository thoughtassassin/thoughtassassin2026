const canvas = document.getElementById('gameCanvas');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');
const statusEl = document.getElementById('status');
const fxLayerEl = document.getElementById('fxLayer');
const stageWrapEl = document.querySelector('.stage-wrap');
const gamePageEl = document.querySelector('.game-page');
const musicToggleEl = document.getElementById('musicToggle');
const difficultyToggleEl = document.getElementById('difficultyToggle');
const fullscreenToggleEl = document.getElementById('fullscreenToggle');
const touchControlsEl = document.getElementById('touchControls');
const gameOverlayEl = document.getElementById('gameOverlay');
const overlayTitleEl = document.getElementById('overlayTitle');
const overlayMessageEl = document.getElementById('overlayMessage');
const overlayButtonEl = document.getElementById('overlayButton');

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const GAME_DURATION_SECONDS = 60;
const FIXED_TIMESTEP = 1 / 60;
const GROUND_SKY_SEAM_Y = 345;
const PLAYER_JUMP_VELOCITY = -520;
const PLAYER_GRAVITY = 1400;
const FIRE_COOLDOWN_SECONDS = 0.14;
const FIRE_SPEED = 760;
const FIRE_LIFETIME = 0.22;
const FIRE_MAX_LENGTH = 34;
const FIRE_THICKNESS = 4;
const HAZARD_FALL_GRAVITY = 1600;
const HAZARD_RESPAWN_DELAY = 0.6;
const HAZARD_FALL_LAUNCH_X_MIN = 180;
const HAZARD_FALL_LAUNCH_X_MAX = 280;
const HAZARD_FALL_LAUNCH_Y_MIN = -340;
const HAZARD_FALL_LAUNCH_Y_MAX = -240;
const HAZARD_TUMBLE_SPEED_MIN = 7.5;
const HAZARD_TUMBLE_SPEED_MAX = 12.5;
const HAZARD_KNOCKOUT_X_EYES_DURATION = 0.3;
const HIT_FLASH_DURATION = 1 / 60;
const HIT_STOP_DURATION = 3 / 60;
const STAGE_CARD_DURATION = 0.9;
const ENEMY_HIT_SCORE = 250;
const CARROT_COLLECT_SCORE = 100;
const WOLF_RENDER_SCALE = 1.55;
const CARROT_RENDER_SCALE = 1.85;
const CARROT_COLLECT_EFFECT_TTL = 0.45;
const ENEMY_KILL_EFFECT_TTL = 0.35;
const SOUNDTRACK_BPM = 132;
const SOUNDTRACK_STEP_SECONDS = 60 / SOUNDTRACK_BPM / 2;
const DIFFICULTY_MAX_MULTIPLIER = 1.85;
const EXTRA_WOLF_TRIGGER_TIME = 20;
const RABBIT_FRAME_WIDTH = 167;
const RABBIT_FRAME_HEIGHT = 283;
const RABBIT_FRAME_COLUMNS = 8;
const RABBIT_FRAME_X = [0, 167, 334, 505, 670, 835, 1005, 1172];
const PLAYER_DRAW_WIDTH_BASE = 84;
const PLAYER_DRAW_HEIGHT_BASE = 142;
const PLAYER_PERSPECTIVE_FAR_SCALE = 0.68;
const PLAYER_WALK_MIN_Y = GROUND_SKY_SEAM_Y - PLAYER_DRAW_HEIGHT_BASE / 2;
const PLAYER_WALK_MAX_Y = GAME_HEIGHT - PLAYER_DRAW_HEIGHT_BASE / 2;
const STORY_TYPE_INTERVAL_MS = 22;
const STORY_INTRO_LINES = [
  '> sunrise over the prairie should have meant peace,',
  '> but something old and hungry woke in the grass.',
  '',
  '> the thought-wolves are not flesh alone —',
  '> they are panic, doubt, and the voices that say you should stop.',
  '',
  '> the carrots are memory cores, scattered when the system fractured.',
  '> recover them before the fear-loop deepens and the field collapses.',
  '',
  '> you are RABBIT-01.',
  '> keep moving. keep breathing. keep firing.'
];
const HIGH_SCORE_STORAGE_KEY = 'thoughtassassin.webgpu.highscore';
const SETTINGS_STORAGE_KEY = 'thoughtassassin.webgpu.settings';
const SOUNDTRACK_MELODY = [659, null, 784, 659, 988, 784, 659, 523, 587, null, 659, 587, 523, 440, 392, null];
const SOUNDTRACK_BASS = [165, 165, 196, 196, 220, 220, 196, 196, 147, 147, 165, 165, 196, 196, 147, 147];
const DIFFICULTY_PROFILES = {
  easy: { label: 'Easy', maxMultiplier: 1.35, extraWolfTime: 38 },
  normal: { label: 'Normal', maxMultiplier: 1.85, extraWolfTime: 20 },
  hard: { label: 'Hard', maxMultiplier: 2.35, extraWolfTime: 8 }
};
const DIFFICULTY_SEQUENCE = ['easy', 'normal', 'hard'];

const RABBIT_ANIMATIONS = {
  idle: {
    fps: 2,
    right: [1],
    left: [1]
  },
  walk: {
    fps: 12,
    right: [1, 2, 3, 4, 5, 6, 7],
    left: [1, 2, 3, 4, 5, 6, 7]
  },
  hurt: {
    fps: 10,
    right: [1, 0],
    left: [1, 0]
  },
  jump: {
    fps: 1,
    right: [3],
    left: [3]
  }
};

const state = {
  running: false,
  paused: false,
  gamePhase: 'title',
  settings: {
    musicEnabled: true,
    difficulty: 'normal'
  },
  score: 0,
  highScore: 0,
  lives: 3,
  timeLeft: GAME_DURATION_SECONDS,
  elapsedTime: 0,
  player: {
    x: 80,
    y: 270,
    size: 26,
    speed: 300,
    facing: 1,
    animationState: 'idle',
    animationTime: 0,
    hurtTimer: 0,
    isJumping: false,
    jumpVelocityY: 0,
    jumpStartY: 0,
    jumpElapsed: 0,
    drawWidth: PLAYER_DRAW_WIDTH_BASE,
    drawHeight: PLAYER_DRAW_HEIGHT_BASE
  },
  target: {
    x: 720,
    y: 200,
    size: 20,
    speed: 95,
    vx: -1,
    vy: 1
  },
  hazards: [
    { x: 300, y: 120, size: 24, speed: 130, baseSpeed: 130, vx: 1, vy: 1, isFalling: false, fallVelocityX: 0, fallVelocityY: 0, fallSpin: 0, fallSpinSpeed: 0, respawnTimer: 0, knockoutEyesTimer: 0, hasGroundImpact: false, active: true },
    { x: 560, y: 350, size: 30, speed: 155, baseSpeed: 155, vx: -1, vy: -1, isFalling: false, fallVelocityX: 0, fallVelocityY: 0, fallSpin: 0, fallSpinSpeed: 0, respawnTimer: 0, knockoutEyesTimer: 0, hasGroundImpact: false, active: true },
    { x: 140, y: 200, size: 26, speed: 150, baseSpeed: 150, vx: 1, vy: -1, isFalling: false, fallVelocityX: 0, fallVelocityY: 0, fallSpin: 0, fallSpinSpeed: 0, respawnTimer: 0, knockoutEyesTimer: 0, hasGroundImpact: false, active: false }
  ],
  shots: [],
  collectEffects: [],
    enemyKillEffects: [],
  fireCooldown: 0,
  hitFlashTimer: 0,
  hitStopTimer: 0,
  stageCardTimer: 0,
  screenShakeTime: 0,
  screenShakeStrength: 0,
  keys: new Set(),
  lastTime: 0,
  simulationAccumulator: 0,
  countdownAccumulator: 0
};

let gpu = null;
let storyTypeTimer = null;
let storyFullText = '';
let storyTypedChars = 0;
let titleCountdownTimer = null;
let titleCountdownValue = 0;
const audio = {
  context: null,
  soundtrackTimer: null,
  soundtrackStep: 0,
  soundtrackActive: false,
  unlocked: false
};

function updateHud() {
  scoreEl.textContent = String(state.score);
  if (highScoreEl) {
    highScoreEl.textContent = String(state.highScore);
  }
  livesEl.textContent = String(state.lives);
  timeEl.textContent = String(state.timeLeft);
}

function fitStageToViewport() {
  if (!stageWrapEl || !gamePageEl) {
    return;
  }

  const aspect = GAME_WIDTH / GAME_HEIGHT;
  const pageStyle = window.getComputedStyle(gamePageEl);
  const pagePaddingTop = parseFloat(pageStyle.paddingTop) || 0;
  const pagePaddingBottom = parseFloat(pageStyle.paddingBottom) || 0;

  let controlsHeight = 0;
  if (touchControlsEl) {
    const controlsStyle = window.getComputedStyle(touchControlsEl);
    if (controlsStyle.display !== 'none') {
      controlsHeight = touchControlsEl.offsetHeight + 12;
    }
  }

  const horizontalMargin = 16;
  const verticalMargin = 14;
  const availableWidth = Math.max(280, window.innerWidth - horizontalMargin * 2 - pagePaddingTop);
  const availableHeight = Math.max(180, window.innerHeight - verticalMargin * 2 - pagePaddingTop - pagePaddingBottom - controlsHeight);

  let targetWidth = availableWidth;
  let targetHeight = targetWidth / aspect;

  if (targetHeight > availableHeight) {
    targetHeight = availableHeight;
    targetWidth = targetHeight * aspect;
  }

  stageWrapEl.style.width = `${Math.floor(targetWidth)}px`;
  stageWrapEl.style.height = `${Math.floor(targetHeight)}px`;
}

function updateSettingsUI() {
  if (musicToggleEl) {
    musicToggleEl.textContent = `Music: ${state.settings.musicEnabled ? 'ON' : 'OFF'} (M)`;
    musicToggleEl.classList.toggle('off', !state.settings.musicEnabled);
  }

  if (difficultyToggleEl) {
    const profile = DIFFICULTY_PROFILES[state.settings.difficulty] ?? DIFFICULTY_PROFILES.normal;
    difficultyToggleEl.textContent = `Difficulty: ${profile.label}`;
  }

  if (fullscreenToggleEl) {
    const isFullscreen = Boolean(document.fullscreenElement);
    fullscreenToggleEl.textContent = `Fullscreen: ${isFullscreen ? 'ON' : 'OFF'}`;
  }
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      if (stageWrapEl && stageWrapEl.requestFullscreen) {
        await stageWrapEl.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen toggle failed:', error);
  }

  fitStageToViewport();
  updateSettingsUI();
}

function saveSettings() {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
    return;
  }
}

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      updateSettingsUI();
      return;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.musicEnabled === 'boolean') {
      state.settings.musicEnabled = parsed.musicEnabled;
    }
    if (typeof parsed.difficulty === 'string' && DIFFICULTY_PROFILES[parsed.difficulty]) {
      state.settings.difficulty = parsed.difficulty;
    }
  } catch {
    // no-op: keep defaults
  }

  updateSettingsUI();
}

function getDifficultyProfile() {
  return DIFFICULTY_PROFILES[state.settings.difficulty] ?? DIFFICULTY_PROFILES.normal;
}

function setMusicEnabled(enabled) {
  state.settings.musicEnabled = enabled;
  if (!enabled) {
    setSoundtrackActive(false);
  } else if (state.running && !state.paused) {
    setSoundtrackActive(true);
  }

  saveSettings();
  updateSettingsUI();
}

function toggleMusic() {
  setMusicEnabled(!state.settings.musicEnabled);
}

function cycleDifficulty() {
  const currentIndex = DIFFICULTY_SEQUENCE.indexOf(state.settings.difficulty);
  const nextIndex = (currentIndex + 1) % DIFFICULTY_SEQUENCE.length;
  state.settings.difficulty = DIFFICULTY_SEQUENCE[nextIndex];
  saveSettings();
  updateSettingsUI();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showOverlay(title, message, buttonLabel) {
  if (!gameOverlayEl || !overlayTitleEl || !overlayMessageEl || !overlayButtonEl) {
    return;
  }

  overlayTitleEl.textContent = title;
  overlayMessageEl.textContent = message;
  overlayButtonEl.textContent = buttonLabel;
  gameOverlayEl.classList.remove('terminal-overlay');
  gameOverlayEl.classList.remove('hidden');
}

function hideOverlay() {
  if (!gameOverlayEl) {
    return;
  }

  gameOverlayEl.classList.add('hidden');
}

function clearStoryTypewriter() {
  if (storyTypeTimer !== null) {
    window.clearInterval(storyTypeTimer);
    storyTypeTimer = null;
  }
}

function clearTitleCountdown() {
  if (titleCountdownTimer !== null) {
    window.clearInterval(titleCountdownTimer);
    titleCountdownTimer = null;
  }
  titleCountdownValue = 0;
}

function updateTitleCountdownMessage() {
  if (!overlayMessageEl || state.gamePhase !== 'title') {
    return;
  }

  overlayMessageEl.textContent = `Collect carrots and avoid wolves. ${titleCountdownValue}`;
}

function beginTitleCountdown() {
  clearTitleCountdown();
  titleCountdownValue = 3;
  updateTitleCountdownMessage();

  titleCountdownTimer = window.setInterval(() => {
    if (state.gamePhase !== 'title') {
      clearTitleCountdown();
      return;
    }

    titleCountdownValue -= 1;
    if (titleCountdownValue <= 0) {
      clearTitleCountdown();
      resetGame();
      return;
    }

    updateTitleCountdownMessage();
  }, 1000);
}

function completeStoryTyping() {
  clearStoryTypewriter();
  storyTypedChars = storyFullText.length;
  if (overlayMessageEl) {
    overlayMessageEl.textContent = `${storyFullText}\n\n> press enter to continue`;
  }
  if (overlayButtonEl) {
    overlayButtonEl.textContent = 'Continue';
    overlayButtonEl.style.display = 'inline-block';
  }
}

function advanceStoryIntro() {
  if (state.gamePhase !== 'story') {
    return;
  }

  if (storyTypedChars < storyFullText.length) {
    completeStoryTyping();
    return;
  }

  clearStoryTypewriter();
  showTitleScreen();
}

function showStoryIntro() {
  clearTitleCountdown();
  state.gamePhase = 'story';
  state.running = false;
  state.paused = false;
  setSoundtrackActive(false);

  showOverlay('boot@thought-assassin:~$', '', 'Continue');
  if (gameOverlayEl) {
    gameOverlayEl.classList.add('terminal-overlay');
    gameOverlayEl.scrollTop = 0;
  }
  if (overlayButtonEl) {
    overlayButtonEl.style.display = 'none';
  }

  storyFullText = STORY_INTRO_LINES.join('\n');
  storyTypedChars = 0;
  if (overlayMessageEl) {
    overlayMessageEl.textContent = '';
  }

  clearStoryTypewriter();
  storyTypeTimer = window.setInterval(() => {
    if (state.gamePhase !== 'story') {
      clearStoryTypewriter();
      return;
    }

    storyTypedChars = Math.min(storyTypedChars + 1, storyFullText.length);
    if (overlayMessageEl) {
      overlayMessageEl.textContent = storyFullText.slice(0, storyTypedChars);
    }

    if (storyTypedChars >= storyFullText.length) {
      completeStoryTyping();
    }
  }, STORY_TYPE_INTERVAL_MS);

  setStatus('Initializing narrative feed...');
}

function showTitleScreen() {
  clearStoryTypewriter();
  clearTitleCountdown();
  state.gamePhase = 'title';
  state.running = false;
  state.paused = false;
  setSoundtrackActive(false);
  if (overlayButtonEl) {
    overlayButtonEl.style.display = 'none';
  }
  showOverlay('Thought Assassin', '', 'Start Game');
  beginTitleCountdown();
  setStatus('Get ready...');
}

function finishGame(reason) {
  clearTitleCountdown();
  state.running = false;
  state.paused = false;
  setSoundtrackActive(false);
  const title = reason === 'win' ? 'You Win!' : 'Game Over';
  const message = reason === 'win'
    ? `You survived with ${state.score} points.`
    : `Final score: ${state.score}. Wolves were too much this run.`;

  state.gamePhase = reason === 'win' ? 'win' : 'lose';
  showOverlay(title, message, 'Play Again');
  if (overlayButtonEl) {
    overlayButtonEl.style.display = 'inline-block';
  }
}

function getDifficultyMultiplier() {
  const progress = clamp(state.elapsedTime / GAME_DURATION_SECONDS, 0, 1);
  const profile = getDifficultyProfile();
  return 1 + (profile.maxMultiplier - 1) * progress;
}


function ensureAudioContext() {
  if (!audio.unlocked) {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!audio.context) {
    audio.context = new AudioContextCtor();
  }

  if (audio.context.state === 'suspended') {
    audio.context.resume().catch(() => {});
  }

  return audio.context;
}

function unlockAudioFromGesture() {
  if (audio.unlocked) {
    ensureAudioContext();
    return;
  }

  audio.unlocked = true;
  ensureAudioContext();
  if (audio.soundtrackActive) {
    startSoundtrack();
  }
}

function playToneAt(context, startTime, { frequency = 440, duration = 0.08, type = 'square', gain = 0.08, endFrequency = null }) {
  const osc = context.createOscillator();
  const amp = context.createGain();
  const endTime = startTime + duration;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), endTime);
  }

  amp.gain.setValueAtTime(gain, startTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, endTime);

  osc.connect(amp);
  amp.connect(context.destination);
  osc.start(startTime);
  osc.stop(endTime);
}

function playTone({ frequency = 440, duration = 0.08, type = 'square', gain = 0.08, endFrequency = null }) {
  if (!state.settings.musicEnabled) {
    return;
  }

  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  playToneAt(context, context.currentTime, { frequency, duration, type, gain, endFrequency });
}

function tickSoundtrack() {
  if (!audio.soundtrackActive) {
    return;
  }

  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const stepIndex = audio.soundtrackStep % SOUNDTRACK_MELODY.length;
  const melodyNote = SOUNDTRACK_MELODY[stepIndex];
  const bassNote = SOUNDTRACK_BASS[stepIndex];
  const now = context.currentTime;

  if (melodyNote) {
    playToneAt(context, now, {
      frequency: melodyNote,
      duration: SOUNDTRACK_STEP_SECONDS * 0.9,
      type: 'square',
      gain: 0.032
    });
  }

  if (bassNote) {
    playToneAt(context, now, {
      frequency: bassNote,
      duration: SOUNDTRACK_STEP_SECONDS * 0.95,
      type: 'triangle',
      gain: 0.022
    });
  }

  audio.soundtrackStep += 1;
}

function startSoundtrack() {
  if (audio.soundtrackTimer) {
    return;
  }

  audio.soundtrackStep = 0;
  audio.soundtrackTimer = window.setInterval(tickSoundtrack, SOUNDTRACK_STEP_SECONDS * 1000);
}

function stopSoundtrack() {
  if (!audio.soundtrackTimer) {
    return;
  }

  window.clearInterval(audio.soundtrackTimer);
  audio.soundtrackTimer = null;
}

function setSoundtrackActive(isActive) {
  audio.soundtrackActive = isActive;
  if (isActive && state.settings.musicEnabled) {
    if (audio.unlocked) {
      startSoundtrack();
    }
  } else {
    stopSoundtrack();
  }
}

function playJumpSfx() {
  playTone({ frequency: 280, endFrequency: 510, duration: 0.1, type: 'square', gain: 0.055 });
}

function playFireSfx() {
  playTone({ frequency: 920, endFrequency: 510, duration: 0.045, type: 'square', gain: 0.055 });
  playTone({ frequency: 1220, endFrequency: 680, duration: 0.035, type: 'square', gain: 0.03 });
}

function playHitSfx() {
  playTone({ frequency: 210, endFrequency: 85, duration: 0.12, type: 'square', gain: 0.085 });
  playTone({ frequency: 128, endFrequency: 64, duration: 0.14, type: 'triangle', gain: 0.05 });
}

function playCollectSfx() {
  playTone({ frequency: 660, endFrequency: 988, duration: 0.07, type: 'square', gain: 0.06 });
  playTone({ frequency: 880, endFrequency: 1244, duration: 0.08, type: 'square', gain: 0.05 });
  playTone({ frequency: 1048, endFrequency: 1568, duration: 0.09, type: 'triangle', gain: 0.04 });
}

function triggerScreenShake(duration, strength) {
  state.screenShakeTime = Math.max(state.screenShakeTime, duration);
  state.screenShakeStrength = Math.max(state.screenShakeStrength, strength);
}

function spawnCollectEffect(x, y) {
  state.collectEffects.push({
    x,
    y,
    ttl: CARROT_COLLECT_EFFECT_TTL,
    maxTtl: CARROT_COLLECT_EFFECT_TTL
  });
}

function spawnEnemyKillEffect(x, y) {
  state.enemyKillEffects.push({
    x,
    y,
    ttl: ENEMY_KILL_EFFECT_TTL,
    maxTtl: ENEMY_KILL_EFFECT_TTL
  });
}

function spawnScorePopup(x, y, scoreValue, kind = 'collect') {
  if (!fxLayerEl) {
    return;
  }

  const popup = document.createElement('div');
  popup.className = 'collect-popup';
  if (kind === 'enemy') {
    popup.classList.add('enemy-popup');
  }
  popup.textContent = `+${scoreValue}`;

  const rect = canvas.getBoundingClientRect();
  const relativeX = (x / GAME_WIDTH) * rect.width;
  const relativeY = (y / GAME_HEIGHT) * rect.height;

  popup.style.left = `${relativeX}px`;
  popup.style.top = `${relativeY}px`;
  fxLayerEl.appendChild(popup);

  window.setTimeout(() => {
    popup.remove();
  }, 760);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadHighScore() {
  try {
    const stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = Number(stored);
    state.highScore = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  } catch {
    state.highScore = 0;
  }
}

function saveHighScore() {
  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(state.highScore));
  } catch {
    return;
  }
}

function refreshHighScore() {
  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore();
  }
}

function pauseGame(reason) {
  if (!state.running || state.paused) {
    return;
  }

  state.paused = true;
  state.keys.clear();
  setSoundtrackActive(false);
  setStatus(reason || 'Paused');
}

function resumeGame() {
  if (!state.running || !state.paused) {
    return;
  }

  state.paused = false;
  setSoundtrackActive(true);
  setStatus('Collect targets and survive.');
}

function tryStartJump() {
  if (!state.running || state.paused || state.player.isJumping) {
    return;
  }

  state.player.isJumping = true;
  state.player.jumpVelocityY = PLAYER_JUMP_VELOCITY;
  state.player.jumpStartY = clamp(state.player.y, PLAYER_WALK_MIN_Y, PLAYER_WALK_MAX_Y);
  state.player.jumpElapsed = 0;
  playJumpSfx();
}

function tryFire() {
  if (!state.running || state.paused || state.fireCooldown > 0) {
    return;
  }

  const direction = state.player.facing < 0 ? -1 : 1;
  const muzzleOffsetX = direction < 0 ? -state.player.drawWidth * 0.4 : state.player.drawWidth * 0.4;
  const muzzleOffsetY = -state.player.drawHeight * 0.18;

  state.shots.push({
    x: state.player.x + muzzleOffsetX,
    y: state.player.y + muzzleOffsetY,
    direction,
    ttl: FIRE_LIFETIME,
    maxTtl: FIRE_LIFETIME
  });

  state.fireCooldown = FIRE_COOLDOWN_SECONDS;
  playFireSfx();
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function updatePlayerPerspectiveSize() {
  const depthSpan = Math.max(1, PLAYER_WALK_MAX_Y - PLAYER_WALK_MIN_Y);
  const depthT = clamp((state.player.y - PLAYER_WALK_MIN_Y) / depthSpan, 0, 1);
  const scale = PLAYER_PERSPECTIVE_FAR_SCALE + (1 - PLAYER_PERSPECTIVE_FAR_SCALE) * depthT;
  state.player.drawWidth = PLAYER_DRAW_WIDTH_BASE * scale;
  state.player.drawHeight = PLAYER_DRAW_HEIGHT_BASE * scale;
}

function respawnTarget() {
  state.target.x = randomRange(120, GAME_WIDTH - 80);
  state.target.y = randomRange(60, GAME_HEIGHT - 60);
  state.target.vx = Math.random() > 0.5 ? 1 : -1;
  state.target.vy = Math.random() > 0.5 ? 1 : -1;
}

function getShotLength(shot) {
  const lifeRatio = clamp(shot.ttl / shot.maxTtl, 0, 1);
  return clamp(FIRE_MAX_LENGTH * (1 - lifeRatio * 0.45), 10, FIRE_MAX_LENGTH);
}

function resetHazard(index, x, y, speed, vx, vy, size, active = true) {
  const hazard = state.hazards[index];
  hazard.x = x;
  hazard.y = y;
  hazard.baseSpeed = speed;
  hazard.speed = speed;
  hazard.vx = vx;
  hazard.vy = vy;
  hazard.size = size;
  hazard.active = active;
  hazard.isFalling = false;
  hazard.fallVelocityX = 0;
  hazard.fallVelocityY = 0;
  hazard.fallSpin = 0;
  hazard.fallSpinSpeed = 0;
  hazard.respawnTimer = 0;
  hazard.knockoutEyesTimer = 0;
  hazard.hasGroundImpact = false;
}

function respawnHazardAtTop(hazard) {
  hazard.active = true;
  hazard.x = randomRange(hazard.size + 20, GAME_WIDTH - hazard.size - 20);
  hazard.y = randomRange(hazard.size + 30, 220);
  hazard.vx = Math.random() > 0.5 ? 1 : -1;
  hazard.vy = Math.random() > 0.5 ? 1 : -1;
  hazard.isFalling = false;
  hazard.fallVelocityX = 0;
  hazard.fallVelocityY = 0;
  hazard.fallSpin = 0;
  hazard.fallSpinSpeed = 0;
  hazard.knockoutEyesTimer = 0;
  hazard.hasGroundImpact = false;
}

function hitHazardByShot(hazard, shotDirection = 1) {
  if (hazard.isFalling) {
    return;
  }

  hazard.isFalling = true;
  const direction = shotDirection < 0 ? -1 : 1;
  hazard.fallVelocityX = randomRange(HAZARD_FALL_LAUNCH_X_MIN, HAZARD_FALL_LAUNCH_X_MAX) * direction;
  hazard.fallVelocityY = randomRange(HAZARD_FALL_LAUNCH_Y_MIN, HAZARD_FALL_LAUNCH_Y_MAX);
  hazard.fallSpin = 0;
  const tumbleDirection = direction * (Math.random() > 0.5 ? 1 : -1);
  hazard.fallSpinSpeed = randomRange(HAZARD_TUMBLE_SPEED_MIN, HAZARD_TUMBLE_SPEED_MAX) * tumbleDirection;
  hazard.vx = 0;
  hazard.vy = 0;
  hazard.respawnTimer = HAZARD_RESPAWN_DELAY;
  hazard.knockoutEyesTimer = HAZARD_KNOCKOUT_X_EYES_DURATION;
  hazard.hasGroundImpact = false;
  state.hitFlashTimer = HIT_FLASH_DURATION;
  state.hitStopTimer = HIT_STOP_DURATION;
  triggerScreenShake(0.09, 5.5);
  state.score += ENEMY_HIT_SCORE;
  refreshHighScore();
  updateHud();
  spawnEnemyKillEffect(hazard.x, hazard.y);
  spawnScorePopup(hazard.x, hazard.y - 10, ENEMY_HIT_SCORE, 'enemy');
  playHitSfx();
}

function resetGame() {
  clearStoryTypewriter();
  clearTitleCountdown();
  hideOverlay();
  state.gamePhase = 'playing';
  state.score = 0;
  state.lives = 3;
  state.timeLeft = GAME_DURATION_SECONDS;
  state.elapsedTime = 0;
  state.player.x = 80;
  state.player.y = GAME_HEIGHT / 2;
  state.player.facing = 1;
  state.player.animationState = 'idle';
  state.player.animationTime = 0;
  state.player.hurtTimer = 0;
  state.player.isJumping = false;
  state.player.jumpVelocityY = 0;
  state.player.drawWidth = PLAYER_DRAW_WIDTH_BASE;
  state.player.drawHeight = PLAYER_DRAW_HEIGHT_BASE;
  state.player.y = clamp(state.player.y, PLAYER_WALK_MIN_Y, PLAYER_WALK_MAX_Y);
  updatePlayerPerspectiveSize();
  state.player.jumpStartY = state.player.y;
  state.player.jumpElapsed = 0;
  respawnTarget();
  resetHazard(0, 300, 120, 130, 1, 1, 24, true);
  resetHazard(1, 560, 350, 155, -1, -1, 30, true);
  resetHazard(2, 140, 200, 150, 1, -1, 26, false);
  state.shots = [];
  state.collectEffects = [];
    state.enemyKillEffects = [];
  if (fxLayerEl) {
    fxLayerEl.replaceChildren();
  }
  state.fireCooldown = 0;
  state.hitFlashTimer = 0;
  state.hitStopTimer = 0;
  state.stageCardTimer = 0;
  state.screenShakeTime = 0;
  state.screenShakeStrength = 0;
  state.lastTime = 0;
  state.simulationAccumulator = 0;
  state.countdownAccumulator = 0;
  state.running = true;
  state.paused = false;
  setSoundtrackActive(true);
  updateHud();
  setStatus('Collect targets and survive.');
}

function setupInput() {
  const normalizeControlKey = (event) => {
    if (event.code === 'ArrowUp') return 'ArrowUp';
    if (event.code === 'ArrowDown') return 'ArrowDown';
    if (event.code === 'ArrowLeft') return 'ArrowLeft';
    if (event.code === 'ArrowRight') return 'ArrowRight';
    if (event.code === 'Space') return 'Space';
    return null;
  };

  window.addEventListener('keydown', (event) => {
    unlockAudioFromGesture();

    const controlKey = normalizeControlKey(event);

    if (controlKey || event.key.toLowerCase() === 'f' || event.key.toLowerCase() === 'm') {
      event.preventDefault();
    }

    if (event.key.toLowerCase() === 'm') {
      toggleMusic();
      return;
    }

    if (event.key.toLowerCase() === 'd') {
      cycleDifficulty();
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      resetGame();
      return;
    }

    if ((event.key === 'Enter' || event.code === 'Space') && state.gamePhase === 'story') {
      advanceStoryIntro();
      return;
    }

    if ((event.key === 'Enter' || event.code === 'Space') && !state.running && state.gamePhase !== 'playing' && state.gamePhase !== 'title') {
      resetGame();
      return;
    }

    if (controlKey === 'Space') {
      tryStartJump();
    }

    if (event.key.toLowerCase() === 'f') {
      tryFire();
    }

    if (controlKey && controlKey !== 'Space') {
      state.keys.add(controlKey);
    }
  });

  if (overlayButtonEl) {
    overlayButtonEl.addEventListener('click', () => {
      unlockAudioFromGesture();
      if (state.gamePhase === 'story') {
        advanceStoryIntro();
        return;
      }
      resetGame();
    });
  }

  if (musicToggleEl) {
    musicToggleEl.addEventListener('click', () => {
      unlockAudioFromGesture();
      toggleMusic();
    });
  }

  if (difficultyToggleEl) {
    difficultyToggleEl.addEventListener('click', () => {
      cycleDifficulty();
    });
  }

  if (fullscreenToggleEl) {
    fullscreenToggleEl.addEventListener('click', () => {
      toggleFullscreen();
    });
  }

  if (touchControlsEl) {
    const setKeyState = (key, isDown) => {
      if (isDown) {
        if (key === 'ArrowUp') state.keys.delete('ArrowDown');
        if (key === 'ArrowDown') state.keys.delete('ArrowUp');
        if (key === 'ArrowLeft') state.keys.delete('ArrowRight');
        if (key === 'ArrowRight') state.keys.delete('ArrowLeft');
        state.keys.add(key);
      } else {
        state.keys.delete(key);
      }
    };

    const bindHoldButton = (button, key) => {
      if (!button) {
        return;
      }

      const press = (event) => {
        event.preventDefault();
        unlockAudioFromGesture();
        setKeyState(key, true);
      };
      const release = (event) => {
        event.preventDefault();
        setKeyState(key, false);
      };

      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
      button.addEventListener('touchstart', press, { passive: false });
      button.addEventListener('touchend', release, { passive: false });
      button.addEventListener('touchcancel', release, { passive: false });
    };

    const bindActionButton = (button, actionName) => {
      if (!button) {
        return;
      }

      let repeatTimer = null;

      const fireAction = () => {
        if (actionName === 'jump') {
          tryStartJump();
        } else if (actionName === 'fire') {
          tryFire();
        }
      };

      const press = (event) => {
        event.preventDefault();
        unlockAudioFromGesture();
        fireAction();

        if (actionName === 'fire' && !repeatTimer) {
          repeatTimer = window.setInterval(() => {
            fireAction();
          }, 120);
        }
      };

      const release = (event) => {
        event.preventDefault();
        if (repeatTimer) {
          window.clearInterval(repeatTimer);
          repeatTimer = null;
        }
      };

      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
      button.addEventListener('touchstart', press, { passive: false });
      button.addEventListener('touchend', release, { passive: false });
      button.addEventListener('touchcancel', release, { passive: false });
    };

    bindHoldButton(touchControlsEl.querySelector('[data-touch="ArrowLeft"]'), 'ArrowLeft');
    bindHoldButton(touchControlsEl.querySelector('[data-touch="ArrowRight"]'), 'ArrowRight');
    bindHoldButton(touchControlsEl.querySelector('[data-touch="ArrowUp"]'), 'ArrowUp');
    bindHoldButton(touchControlsEl.querySelector('[data-touch="ArrowDown"]'), 'ArrowDown');
    bindActionButton(touchControlsEl.querySelector('[data-action="jump"]'), 'jump');
    bindActionButton(touchControlsEl.querySelector('[data-action="fire"]'), 'fire');
  }

  window.addEventListener('pointerdown', unlockAudioFromGesture, { passive: true });
  window.addEventListener('touchstart', unlockAudioFromGesture, { passive: true });

  window.addEventListener('keyup', (event) => {
    const controlKey = normalizeControlKey(event);
    if (controlKey && controlKey !== 'Space') {
      state.keys.delete(controlKey);
    }
  });

  const clearDirectionalKeys = () => {
    state.keys.delete('ArrowLeft');
    state.keys.delete('ArrowRight');
    state.keys.delete('ArrowUp');
    state.keys.delete('ArrowDown');
  };

  window.addEventListener('pointerup', clearDirectionalKeys);
  window.addEventListener('touchend', clearDirectionalKeys, { passive: true });
  window.addEventListener('touchcancel', clearDirectionalKeys, { passive: true });

  window.addEventListener('blur', () => {
    pauseGame('Paused (window not focused)');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseGame('Paused (tab hidden)');
    } else {
      resumeGame();
    }
  });
}

function intersects(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.size + b.size;
}

function bounceCircle(entity, dt) {
  entity.x += entity.vx * entity.speed * dt;
  entity.y += entity.vy * entity.speed * dt;

  if (entity.x <= entity.size || entity.x >= GAME_WIDTH - entity.size) {
    entity.vx *= -1;
    entity.x = clamp(entity.x, entity.size, GAME_WIDTH - entity.size);
  }

  if (entity.y <= entity.size || entity.y >= GAME_HEIGHT - entity.size) {
    entity.vy *= -1;
    entity.y = clamp(entity.y, entity.size, GAME_HEIGHT - entity.size);
  }
}

function update(dt) {
  if (!state.running || state.paused) {
    return;
  }

  if (state.hitStopTimer > 0) {
    state.hitStopTimer = Math.max(0, state.hitStopTimer - dt);
    return;
  }

  state.elapsedTime += dt;

  let moving = false;

  if (state.keys.has('ArrowLeft')) {
    state.player.x -= state.player.speed * dt;
    state.player.facing = -1;
    moving = true;
  }
  if (state.keys.has('ArrowRight')) {
    state.player.x += state.player.speed * dt;
    state.player.facing = 1;
    moving = true;
  }
  if (state.keys.has('ArrowUp')) {
    if (!state.player.isJumping) {
      state.player.y -= state.player.speed * dt;
      moving = true;
    }
  }
  if (state.keys.has('ArrowDown')) {
    if (!state.player.isJumping) {
      state.player.y += state.player.speed * dt;
      moving = true;
    }
  }

  if (state.player.isJumping) {
    state.player.jumpElapsed += dt;
    state.player.jumpVelocityY += PLAYER_GRAVITY * dt;
    state.player.y += state.player.jumpVelocityY * dt;
  } else {
    state.player.jumpElapsed = 0;
  }

  state.player.hurtTimer = Math.max(0, state.player.hurtTimer - dt);
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  state.hitFlashTimer = Math.max(0, state.hitFlashTimer - dt);
  state.screenShakeTime = Math.max(0, state.screenShakeTime - dt);

  const halfBaseDrawWidth = PLAYER_DRAW_WIDTH_BASE / 2;
  const halfBaseDrawHeight = PLAYER_DRAW_HEIGHT_BASE / 2;
  const minPlayerCenterY = state.player.isJumping ? halfBaseDrawHeight : PLAYER_WALK_MIN_Y;
  const maxPlayerCenterY = PLAYER_WALK_MAX_Y;
  state.player.x = clamp(state.player.x, halfBaseDrawWidth, GAME_WIDTH - halfBaseDrawWidth);
  state.player.y = clamp(state.player.y, minPlayerCenterY, maxPlayerCenterY);

  if (state.player.isJumping && state.player.jumpVelocityY >= 0 && state.player.y >= state.player.jumpStartY - 0.5) {
    state.player.y = state.player.jumpStartY;
    state.player.jumpVelocityY = 0;
    state.player.isJumping = false;
    state.player.jumpElapsed = 0;
  }

  if (state.player.y >= maxPlayerCenterY) {
    state.player.y = maxPlayerCenterY;
    if (state.player.isJumping) {
      state.player.jumpVelocityY = 0;
      state.player.isJumping = false;
      state.player.jumpElapsed = 0;
    }
  }

  if (state.player.isJumping && state.player.jumpElapsed > 1.4) {
    state.player.isJumping = false;
    state.player.jumpVelocityY = 0;
    state.player.jumpElapsed = 0;
    state.player.y = clamp(state.player.y, PLAYER_WALK_MIN_Y, maxPlayerCenterY);
  }

  updatePlayerPerspectiveSize();

  bounceCircle(state.target, dt);
  const difficultyMultiplier = getDifficultyMultiplier();

  if (state.elapsedTime >= getDifficultyProfile().extraWolfTime && !state.hazards[2].active) {
    state.hazards[2].active = true;
    respawnHazardAtTop(state.hazards[2]);
  }

  state.hazards.forEach((hazard) => {
    if (!hazard.active) {
      return;
    }

    if (hazard.isFalling) {
      if (hazard.knockoutEyesTimer > 0) {
        hazard.knockoutEyesTimer = Math.max(0, hazard.knockoutEyesTimer - dt);
        return;
      }

      hazard.fallVelocityY += HAZARD_FALL_GRAVITY * dt;
      hazard.fallVelocityX *= 0.992;
      hazard.x += hazard.fallVelocityX * dt;
      hazard.y += hazard.fallVelocityY * dt;
      hazard.fallSpin += hazard.fallSpinSpeed * dt;

      if (!hazard.hasGroundImpact && hazard.y + hazard.size >= GAME_HEIGHT) {
        hazard.hasGroundImpact = true;
      }

      if (hazard.y - hazard.size > GAME_HEIGHT + 10) {
        hazard.respawnTimer -= dt;
        if (hazard.respawnTimer <= 0) {
          respawnHazardAtTop(hazard);
        }
      }
      return;
    }

    hazard.speed = hazard.baseSpeed * difficultyMultiplier;
    bounceCircle(hazard, dt);
  });

  for (let i = state.shots.length - 1; i >= 0; i -= 1) {
    const shot = state.shots[i];
    shot.x += shot.direction * FIRE_SPEED * dt;
    shot.ttl -= dt;

    const shotLength = getShotLength(shot);
    const shotLeft = shot.direction > 0 ? shot.x : shot.x - shotLength;
    const shotRight = shot.direction > 0 ? shot.x + shotLength : shot.x;

    let hitDetected = false;
    for (const hazard of state.hazards) {
      if (!hazard.active || hazard.isFalling) {
        continue;
      }

      const overlapsX = shotRight >= (hazard.x - hazard.size) && shotLeft <= (hazard.x + hazard.size);
      const overlapsY = Math.abs(shot.y - hazard.y) <= (hazard.size + FIRE_THICKNESS);
      if (overlapsX && overlapsY) {
        hitHazardByShot(hazard, shot.direction);
        hitDetected = true;
        break;
      }
    }

    const isOffscreen = shot.x < -FIRE_MAX_LENGTH || shot.x > GAME_WIDTH + FIRE_MAX_LENGTH;
    if (hitDetected || shot.ttl <= 0 || isOffscreen) {
      state.shots.splice(i, 1);
    }
  }

  for (let i = state.collectEffects.length - 1; i >= 0; i -= 1) {
    const effect = state.collectEffects[i];
    effect.ttl -= dt;
    if (effect.ttl <= 0) {
      state.collectEffects.splice(i, 1);
    }
  }

  for (let i = state.enemyKillEffects.length - 1; i >= 0; i -= 1) {
    const effect = state.enemyKillEffects[i];
    effect.ttl -= dt;
    if (effect.ttl <= 0) {
      state.enemyKillEffects.splice(i, 1);
    }
  }

  if (intersects(state.player, state.target)) {
    const collectedX = state.target.x;
    const collectedY = state.target.y;
    state.score += CARROT_COLLECT_SCORE;
    refreshHighScore();
    spawnCollectEffect(collectedX, collectedY);
    spawnScorePopup(collectedX, collectedY, CARROT_COLLECT_SCORE, 'collect');
    playCollectSfx();
    respawnTarget();
    updateHud();
  }

  for (const hazard of state.hazards) {
    if (!hazard.active || hazard.isFalling) {
      continue;
    }

    if (intersects(state.player, hazard)) {
      state.lives -= 1;
      state.player.x = 80;
      state.player.y = GAME_HEIGHT / 2;
      state.player.hurtTimer = 0.35;
      updateHud();

      if (state.lives <= 0) {
        finishGame('lose');
      }

      break;
    }
  }

  let nextAnimationState = 'idle';
  if (state.player.hurtTimer > 0) {
    nextAnimationState = 'hurt';
  } else if (state.player.isJumping) {
    nextAnimationState = 'jump';
  } else if (moving) {
    nextAnimationState = 'walk';
  }

  if (nextAnimationState !== state.player.animationState) {
    state.player.animationState = nextAnimationState;
    state.player.animationTime = 0;
  } else {
    state.player.animationTime += dt;
  }

  state.countdownAccumulator += dt;
  if (state.countdownAccumulator >= 1) {
    state.timeLeft -= 1;
    state.countdownAccumulator = 0;
    updateHud();
  }

  if (state.timeLeft <= 0 && state.running) {
    finishGame('win');
  }
}

async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPU is not available in this browser.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('Unable to acquire a GPU adapter.');
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: 'opaque'
  });

  const colorShaderModule = device.createShaderModule({
    code: `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@vertex
fn vertexMain(
  @location(0) position : vec2f,
  @location(1) color : vec4f
) -> VertexOut {
  var out : VertexOut;
  out.position = vec4f(position, 0.0, 1.0);
  out.color = color;
  return out;
}

@fragment
fn fragmentMain(in : VertexOut) -> @location(0) vec4f {
  return in.color;
}
`
  });

  const colorPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: colorShaderModule,
      entryPoint: 'vertexMain',
      buffers: [
        {
          arrayStride: 24,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x4' }
          ]
        }
      ]
    },
    fragment: {
      module: colorShaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format }]
    },
    primitive: {
      topology: 'triangle-list'
    }
  });

  const maxVertices = 6 * 24576;
  const vertexData = new Float32Array(maxVertices * 6);
  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });

  const spriteShaderModule = device.createShaderModule({
    code: `
struct SpriteVertexOut {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
};

@group(0) @binding(0) var rabbitTexture : texture_2d<f32>;
@group(0) @binding(1) var rabbitSampler : sampler;

@vertex
fn spriteVertexMain(
  @location(0) position : vec2f,
  @location(1) uv : vec2f
) -> SpriteVertexOut {
  var out : SpriteVertexOut;
  out.position = vec4f(position, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn spriteFragmentMain(in : SpriteVertexOut) -> @location(0) vec4f {
  return textureSample(rabbitTexture, rabbitSampler, in.uv);
}
`
  });

  const spritePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: spriteShaderModule,
      entryPoint: 'spriteVertexMain',
      buffers: [
        {
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x2' }
          ]
        }
      ]
    },
    fragment: {
      module: spriteShaderModule,
      entryPoint: 'spriteFragmentMain',
      targets: [
        {
          format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
          }
        }
      ]
    },
    primitive: {
      topology: 'triangle-list'
    }
  });

  const spriteTextureInfo = await loadTexture(device, 'images/rabbit_frames.png');
  const spriteSampler = device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest'
  });

  const spriteBindGroup = device.createBindGroup({
    layout: spritePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: spriteTextureInfo.texture.createView() },
      { binding: 1, resource: spriteSampler }
    ]
  });

  const spriteVertexData = new Float32Array(6 * 4);
  const spriteVertexBuffer = device.createBuffer({
    size: spriteVertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });

  return {
    device,
    context,
    colorPipeline,
    vertexBuffer,
    vertexData,
    spritePipeline,
    spriteBindGroup,
    spriteVertexData,
    spriteVertexBuffer,
    spriteTextureWidth: spriteTextureInfo.width,
    spriteTextureHeight: spriteTextureInfo.height
  };
}

async function loadTexture(device, sourcePath) {
  const response = await fetch(sourcePath);
  if (!response.ok) {
    throw new Error(`Unable to load sprite sheet: ${sourcePath}`);
  }

  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height]
  );

  const width = imageBitmap.width;
  const height = imageBitmap.height;
  imageBitmap.close();
  return { texture, width, height };
}

function writeRect(vertexData, offset, centerX, centerY, size, color, offsetX = 0, offsetY = 0) {
  const finalCenterX = centerX + offsetX;
  const finalCenterY = centerY + offsetY;
  const x1 = (finalCenterX - size) / GAME_WIDTH * 2 - 1;
  const y1 = 1 - (finalCenterY - size) / GAME_HEIGHT * 2;
  const x2 = (finalCenterX + size) / GAME_WIDTH * 2 - 1;
  const y2 = 1 - (finalCenterY + size) / GAME_HEIGHT * 2;

  const [r, g, b, a] = color;

  const vertices = [
    x1, y1, r, g, b, a,
    x2, y1, r, g, b, a,
    x2, y2, r, g, b, a,
    x1, y1, r, g, b, a,
    x2, y2, r, g, b, a,
    x1, y2, r, g, b, a
  ];

  if (offset + vertices.length > vertexData.length) {
    return offset;
  }

  vertexData.set(vertices, offset);
  return offset + vertices.length;
}

function writeRectWH(vertexData, offset, centerX, centerY, width, height, color, offsetX = 0, offsetY = 0) {
  const finalCenterX = centerX + offsetX;
  const finalCenterY = centerY + offsetY;
  const x1 = (finalCenterX - width / 2) / GAME_WIDTH * 2 - 1;
  const y1 = 1 - (finalCenterY - height / 2) / GAME_HEIGHT * 2;
  const x2 = (finalCenterX + width / 2) / GAME_WIDTH * 2 - 1;
  const y2 = 1 - (finalCenterY + height / 2) / GAME_HEIGHT * 2;

  const [r, g, b, a] = color;
  const vertices = [
    x1, y1, r, g, b, a,
    x2, y1, r, g, b, a,
    x2, y2, r, g, b, a,
    x1, y1, r, g, b, a,
    x2, y2, r, g, b, a,
    x1, y2, r, g, b, a
  ];

  if (offset + vertices.length > vertexData.length) {
    return offset;
  }

  vertexData.set(vertices, offset);
  return offset + vertices.length;
}

function drawArcadeStageCard(vertexData, offset, timer, offsetX = 0, offsetY = 0) {
  const progress = clamp(1 - timer / STAGE_CARD_DURATION, 0, 1);
  const fadeIn = clamp(progress / 0.18, 0, 1);
  const fadeOut = clamp((1 - progress) / 0.2, 0, 1);
  const alpha = Math.min(fadeIn, fadeOut);
  if (alpha <= 0) {
    return offset;
  }

  const panel = [0.05, 0.05, 0.09, alpha * 0.92];
  const edge = [0.51, 0.43, 0.61, alpha * 0.82];
  const text = [0.95, 0.88, 0.62, alpha * 0.95];
  const accent = [0.98, 0.74, 0.32, alpha * 0.9];

  offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, 124, 356, 74, panel, offsetX, offsetY);
  offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, 89, 356, 3, edge, offsetX, offsetY);
  offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, 159, 356, 3, edge, offsetX, offsetY);

  const glyph = {
    A: ['0110', '1001', '1111', '1001', '1001'],
    D: ['1110', '1001', '1001', '1001', '1110'],
    E: ['1111', '1000', '1110', '1000', '1111'],
    G: ['0111', '1000', '1011', '1001', '0111'],
    R: ['1110', '1001', '1110', '1010', '1001'],
    S: ['0111', '1000', '0110', '0001', '1110'],
    T: ['11111', '00100', '00100', '00100', '00100'],
    Y: ['1001', '1001', '0110', '0010', '0010'],
    '1': ['010', '110', '010', '010', '111'],
    ' ': ['0', '0', '0', '0', '0']
  };

  const drawText = (word, x, y, scale, color) => {
    let cursorX = x;
    for (const char of word) {
      const rows = glyph[char] || glyph[' '];
      const glyphWidth = rows[0].length;
      for (let ry = 0; ry < rows.length; ry += 1) {
        for (let rx = 0; rx < rows[ry].length; rx += 1) {
          if (rows[ry][rx] === '1') {
            offset = writeRectWH(
              vertexData,
              offset,
              cursorX + rx * scale,
              y + ry * scale,
              scale,
              scale,
              color,
              offsetX,
              offsetY
            );
          }
        }
      }
      cursorX += (glyphWidth + 1.5) * scale;
    }
  };

  drawText('STAGE 1', 354, 102, 4, text);
  const readyPulse = 0.65 + 0.35 * Math.sin(progress * Math.PI * 7.5);
  const readyColor = [accent[0], accent[1], accent[2], accent[3] * readyPulse];
  drawText('READY', 396, 128, 4, readyColor);

  return offset;
}

function drawPixelPasture(vertexData, offset, offsetX = 0, offsetY = 0, timeSeconds = 0) {
  const skyTop = [0.32, 0.28, 0.49, 1.0];
  const skyMid = [0.56, 0.36, 0.44, 1.0];
  const horizonGlow = [0.92, 0.72, 0.33, 1.0];
  const skyBlue = [0.35, 0.44, 0.63, 1.0];
  const skyViolet = [0.53, 0.36, 0.57, 1.0];
  const skyPeach = [0.85, 0.54, 0.39, 1.0];
  const skyHaze = [0.74, 0.57, 0.49, 1.0];
  const sunCore = [0.98, 0.93, 0.65, 1.0];
  const sunInner = [0.9, 0.75, 0.58, 1.0];
  const sunHalo = [0.73, 0.58, 0.62, 1.0];
  const sunOuter = [0.62, 0.5, 0.6, 1.0];
  const sunRay = [0.58, 0.5, 0.63, 1.0];
  const cloudDark = [0.36, 0.29, 0.45, 1.0];
  const cloudLit = [0.69, 0.51, 0.46, 1.0];
  const horizonDark = [0.16, 0.11, 0.08, 1.0];
  const horizonMid = [0.26, 0.18, 0.12, 1.0];
  const mountainFar = [0.49, 0.4, 0.53, 1.0];
  const mountainMid = [0.42, 0.33, 0.45, 1.0];
  const mountainNear = [0.34, 0.27, 0.35, 1.0];
  const mountainRim = [0.58, 0.49, 0.62, 1.0];
  const mountainAtmos = [0.62, 0.51, 0.6, 1.0];
  const fieldFar = [0.61, 0.56, 0.33, 1.0];
  const fieldMid = [0.53, 0.5, 0.3, 1.0];
  const fieldNear = [0.45, 0.46, 0.27, 1.0];
  const grassDry = [0.66, 0.61, 0.38, 1.0];
  const grassDark = [0.34, 0.39, 0.22, 1.0];
  const grassNearGlow = [0.5, 0.6, 0.33, 1.0];
  const grassDust = [0.57, 0.53, 0.33, 1.0];
  const shrubDark = [0.32, 0.29, 0.16, 1.0];
  const shrubLight = [0.38, 0.35, 0.2, 1.0];

  const quantizeColor = (color, levels = 18) => {
    const toStep = (value) => Math.round(clamp(value, 0, 1) * (levels - 1)) / (levels - 1);
    return [toStep(color[0]), toStep(color[1]), toStep(color[2]), 1.0];
  };
  const mixColor = (a, b, t) => quantizeColor([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    1.0
  ]);
  const smoothStep = (t) => {
    const clamped = clamp(t, 0, 1);
    return clamped * clamped * (3 - 2 * clamped);
  };

  const skyTopY = 24;
  const skyBottomY = 304;
  const skyBandCount = 30;
  for (let i = 0; i < skyBandCount; i += 1) {
    const t = i / (skyBandCount - 1);
    const softT = smoothStep(t);
    const blend = softT < 0.56
      ? mixColor(skyTop, skyMid, smoothStep(softT / 0.56))
      : mixColor(skyMid, horizonGlow, smoothStep((softT - 0.56) / 0.44));
    const y1 = skyTopY + ((skyBottomY - skyTopY) * i) / skyBandCount;
    const y2 = skyTopY + ((skyBottomY - skyTopY) * (i + 1)) / skyBandCount;
    offset = writeRectWH(
      vertexData,
      offset,
      GAME_WIDTH / 2,
      (y1 + y2) / 2,
      GAME_WIDTH,
      Math.max(4, y2 - y1 + 1),
      blend,
      offsetX,
      offsetY
    );
  }

  const hazeTone = mixColor(skyMid, horizonGlow, 0.32);
  for (let y = 74; y <= 246; y += 22) {
    for (let x = 26; x <= GAME_WIDTH - 26; x += 30) {
      if (((x * 3 + y * 2) % 31) < 4) {
        offset = writeRectWH(vertexData, offset, x, y, 4, 2, hazeTone, offsetX, offsetY);
      }
    }
  }

  const sunX = 642;
  const sunY = 66;
  const sunFeather = mixColor(sunOuter, skyHaze, 0.86);
  const sunMist = mixColor(sunHalo, skyMid, 0.82);
  const sunRaySoft = mixColor(sunRay, skyViolet, 0.94);
  const sunOuterSkyTone = mixColor(skyViolet, skyMid, 0.62);
  const sunPulse = 0.5 + 0.5 * Math.sin(timeSeconds * 1.35);
  const sunPulseWide = 0.5 + 0.5 * Math.sin(timeSeconds * 1.35 + 1.2);
  const sunFeatherPulse = mixColor(sunFeather, sunOuterSkyTone, 0.8 + sunPulse * 0.05);
  const sunMistPulse = mixColor(sunMist, sunOuterSkyTone, 0.66 + sunPulseWide * 0.05);
  const sunOuterPulse = mixColor(mixColor(sunOuter, sunHalo, 0.28), sunOuterSkyTone, 0.5 + sunPulse * 0.035);
  const sunRayPulse = mixColor(sunRaySoft, skyViolet, 0.88 + sunPulseWide * 0.04);
  const sunRayEdgeTone = mixColor(skyViolet, skyMid, 0.68);
  const drawDisc = (centerX, centerY, radius, color, pixelSize = 3, verticalScale = 1) => {
    for (let px = -radius; px <= radius; px += pixelSize) {
      for (let py = -radius; py <= radius; py += pixelSize) {
        const normX = px / radius;
        const normY = (py / verticalScale) / radius;
        if ((normX * normX) + (normY * normY) <= 1) {
          offset = writeRectWH(
            vertexData,
            offset,
            centerX + px,
            centerY + py,
            pixelSize,
            pixelSize,
            color,
            offsetX,
            offsetY
          );
        }
      }
    }
  };

  drawDisc(sunX, sunY + 2, 46 + sunPulse * 0.8, sunFeatherPulse, 2, 0.94);
  drawDisc(sunX, sunY + 2, 40 + sunPulseWide * 0.66, mixColor(sunFeatherPulse, sunMistPulse, 0.6), 2, 0.95);
  drawDisc(sunX, sunY + 1, 33 + sunPulse * 0.46, mixColor(sunMistPulse, sunOuterPulse, 0.56), 2, 0.96);
  drawDisc(sunX, sunY + 1, 27 + sunPulseWide * 0.3, mixColor(sunOuterPulse, mixColor(sunHalo, skyHaze, 0.36), 0.56), 2, 0.97);
  drawDisc(sunX, sunY, 17, sunInner, 3, 0.98);
  drawDisc(sunX, sunY, 11, sunCore, 2, 1);

  const rayAngles = [
    -0.38, -0.12, 0.16, 0.44, 0.72, 1.0, 1.28, 1.56, 1.84, 2.12, 2.4, 2.68, 2.96, 3.24, 3.52, 3.8, 4.08, 4.36, 4.64, 4.92, 5.2, 5.48, 5.76, 6.04
  ];
  for (const angle of rayAngles) {
    for (let step = 1; step < 6; step += 1) {
      const outward = step / 5;
      const radius = 24 + step * 7;
      const pulseRadius = radius + sunPulse * (0.65 + outward * 0.55);
      const spread = step < 2 ? 0.04 : 0.02;
      const branches = step < 2 ? [-spread, 0, spread] : [0];
      for (const branch of branches) {
        const rayAngle = angle + branch;
        const px = sunX + Math.cos(rayAngle) * pulseRadius;
        const py = sunY + Math.sin(rayAngle) * pulseRadius;
        const sparkleSize = 1;
        const rayFade = 0.8 + outward * 0.16 + Math.abs(branch) * 0.25;
        const rayColor = mixColor(sunRayPulse, sunRayEdgeTone, rayFade);
        offset = writeRectWH(vertexData, offset, px, py, sparkleSize, sparkleSize, rayColor, offsetX, offsetY);
      }
    }
  }

  const cloudBands = [
    [598, 46, 248, 18], [696, 40, 214, 16], [756, 66, 172, 12], [486, 86, 144, 14], [722, 104, 204, 15]
  ];
  const drawCloudPuffs = (x, y, w, h, baseColor, litColor) => {
    const shadowColor = mixColor(baseColor, cloudDark, 0.3);
    const edgeFade = mixColor(baseColor, skyViolet, 0.62);

    for (let row = 0; row < h; row += 2) {
      const rowT = row / Math.max(1, h - 1);
      const arch = Math.sin(rowT * Math.PI);
      const width = w * (0.48 + arch * 0.58);
      const yDrift = (rowT - 0.5) * h * 0.66;
      const xDrift = Math.sin((row + x * 0.02) * 0.37) * (w * 0.024);
      const rowBase = mixColor(baseColor, edgeFade, Math.abs(rowT - 0.5) * 1.18);

      for (let segment = 0; segment < 14; segment += 1) {
        const segT = segment / 13;
        const taper = Math.sin(segT * Math.PI);
        const segX = x - width / 2 + segT * width + Math.sin((segment * 1.4 + row * 0.3) + x * 0.01) * 2.4;
        const segY = y + yDrift + Math.sin((segment * 0.95) + row * 0.14) * 0.95;
        const segW = Math.max(3, (w / 14) * (0.54 + taper * 0.62));
        const segH = Math.max(2, 2 + taper * 1.3);
        offset = writeRectWH(vertexData, offset, segX + xDrift, segY, segW, segH, rowBase, offsetX, offsetY);

        if (rowT < 0.62) {
          const highlightMix = clamp(0.36 + (0.62 - rowT) * 0.64 - Math.abs(segT - 0.44) * 0.38, 0, 0.9);
          const highlight = mixColor(rowBase, litColor, highlightMix);
          offset = writeRectWH(vertexData, offset, segX + xDrift - 1.2, segY - 1.1, Math.max(2, segW * 0.52), 1, highlight, offsetX, offsetY);
        }
      }
    }

    for (let row = 0; row < Math.max(4, Math.floor(h * 0.5)); row += 2) {
      const rowT = row / Math.max(1, h * 0.5 - 1);
      const width = w * (0.5 + (1 - rowT) * 0.38);
      const yOffset = h * 0.24 + row * 0.7;
      const shade = mixColor(shadowColor, baseColor, rowT * 0.4);
      for (let segment = 0; segment < 7; segment += 1) {
        const segT = segment / 6;
        const segX = x - width / 2 + segT * width + Math.sin((segment + row) * 0.9) * 1.3;
        const segW = Math.max(4, (w / 7) * (0.64 + Math.sin(segT * Math.PI) * 0.28));
        offset = writeRectWH(vertexData, offset, segX, y + yOffset, segW, 1, shade, offsetX, offsetY);
      }
    }
  };

  cloudBands.forEach(([x, y, w, h]) => {
    const farFactor = smoothStep(clamp((116 - y) / 88, 0, 1));
    const baseCloud = mixColor(cloudDark, skyViolet, 0.3 + farFactor * 0.2);
    const litCloud = mixColor(cloudLit, skyHaze, 0.54 + farFactor * 0.28);
    drawCloudPuffs(x, y, w, h, baseCloud, litCloud);
  });

  const drawRidge = (centerX, crestY, baseWidth, height, color, crestColor, drift = 0.2, rough = 0.18) => {
    for (let row = 0; row < height; row += 1) {
      const t = row / Math.max(1, height - 1);
      const eased = Math.pow(t, 0.78);
      const widthNoise = 1 + Math.sin((row + centerX * 0.01) * 0.21) * rough;
      const width = Math.max(10, Math.round(baseWidth * eased * widthNoise));
      const xShift = Math.sin((row + centerX * 0.02) * 0.17) * drift * row;
      const y = crestY + row;
      const rowColor = row < 4 ? mixColor(crestColor, color, smoothStep(row / 4)) : color;
      offset = writeRectWH(vertexData, offset, centerX + xShift, y, width, 1, rowColor, offsetX, offsetY);
    }
  };

  const drawRidgeTexture = (centerX, crestY, baseWidth, height, baseColor, crestColor, drift = 0.2, rough = 0.18, depth = 1) => {
    const textureDark = mixColor(baseColor, horizonDark, 0.34 + depth * 0.08);
    const textureMid = mixColor(baseColor, horizonMid, 0.2 + depth * 0.06);
    const textureLight = mixColor(crestColor, skyHaze, 0.22);

    for (let row = 3; row < height - 1; row += 2) {
      const t = row / Math.max(1, height - 1);
      const eased = Math.pow(t, 0.78);
      const widthNoise = 1 + Math.sin((row + centerX * 0.01) * 0.21) * rough;
      const width = Math.max(12, Math.round(baseWidth * eased * widthNoise));
      const xShift = Math.sin((row + centerX * 0.02) * 0.17) * drift * row;
      const y = crestY + row;
      const left = centerX + xShift - width / 2;

      const seamCount = Math.max(5, Math.floor(width / 48));
      for (let seam = 0; seam < seamCount; seam += 1) {
        const seamT = seamCount <= 1 ? 0.5 : seam / (seamCount - 1);
        const seamWave = Math.sin((row * 0.23) + seam * 1.7 + centerX * 0.01) * 5;
        const seamX = left + seamT * width + seamWave;
        const seamW = Math.max(2, width / (seamCount * 2.4));
        const seamH = 1;
        const seamShade = mixColor(textureMid, textureDark, clamp(0.14 + seamT * 0.42 + t * 0.2, 0, 0.8));
        offset = writeRectWH(vertexData, offset, seamX, y, seamW, seamH, seamShade, offsetX, offsetY);

        if (row < height * 0.34 && (seam % 2) === 0) {
          const highlight = mixColor(textureLight, baseColor, 0.36 + seamT * 0.24);
          offset = writeRectWH(vertexData, offset, seamX - 1, y - 1, Math.max(1, seamW * 0.55), 1, highlight, offsetX, offsetY);
        }
      }

      if ((row % 6) === 1) {
        const shelfWidth = width * (0.24 + Math.sin(row * 0.11 + centerX * 0.02) * 0.06);
        const shelfX = centerX + xShift - width * 0.18 + Math.sin(row * 0.19) * 4;
        const shelfColor = mixColor(textureDark, textureMid, 0.34 + t * 0.28);
        offset = writeRectWH(vertexData, offset, shelfX, y + 0.2, Math.max(10, shelfWidth), 1, shelfColor, offsetX, offsetY);
      }
    }
  };

  const warmHorizonTint = mixColor(horizonGlow, skyHaze, 0.44);
  const farRidge = mixColor(mixColor(mountainFar, skyViolet, 0.74), warmHorizonTint, 0.4);
  const midRidge = mixColor(mixColor(mountainMid, skyViolet, 0.62), warmHorizonTint, 0.34);
  const nearRidge = mixColor(mixColor(mountainNear, skyMid, 0.5), warmHorizonTint, 0.28);
  const crestSoftFar = mixColor(farRidge, skyHaze, 0.46);
  const crestSoftMid = mixColor(midRidge, skyHaze, 0.4);
  const crestSoftNear = mixColor(nearRidge, skyHaze, 0.32);

  drawRidge(152, 236, 260, 38, farRidge, crestSoftFar, 0.08, 0.08);
  drawRidge(352, 230, 370, 48, midRidge, crestSoftMid, 0.1, 0.1);
  drawRidge(610, 224, 470, 56, nearRidge, crestSoftNear, 0.12, 0.11);
  drawRidge(846, 238, 280, 40, midRidge, crestSoftMid, 0.09, 0.09);
  drawRidgeTexture(152, 236, 260, 38, farRidge, crestSoftFar, 0.08, 0.08, 0.48);
  drawRidgeTexture(352, 230, 370, 48, midRidge, crestSoftMid, 0.1, 0.1, 0.82);
  drawRidgeTexture(610, 224, 470, 56, nearRidge, crestSoftNear, 0.12, 0.11, 1.22);
  drawRidgeTexture(846, 238, 280, 40, midRidge, crestSoftMid, 0.09, 0.09, 0.76);

  const farHazeBase = mixColor(mountainAtmos, skyViolet, 0.6);
  const farHaze = mixColor(farHazeBase, warmHorizonTint, 0.42);
  const midHaze = mixColor(farHaze, mixColor(skyMid, warmHorizonTint, 0.28), 0.3);
  const lowHaze = mixColor(midHaze, mixColor(skyHaze, warmHorizonTint, 0.5), 0.34);

  const drawAtmosBand = (centerY, bandHeight, bandWidth, bandColor, tintColor, drift = 0.16) => {
    for (let row = 0; row < bandHeight; row += 1) {
      const t = row / Math.max(1, bandHeight - 1);
      const softT = smoothStep(t);
      const rowWidth = bandWidth * (0.86 + t * 0.22);
      const widthNoise = 1 + Math.sin((row + centerY) * 0.23) * 0.04;
      const xShift = Math.sin((row + centerY) * 0.17) * drift * row;
      const color = mixColor(bandColor, tintColor, softT * 0.22);
      offset = writeRectWH(
        vertexData,
        offset,
        GAME_WIDTH / 2 + xShift,
        centerY - bandHeight / 2 + row,
        Math.max(80, rowWidth * widthNoise),
        1,
        color,
        offsetX,
        offsetY
      );
    }
  };

  drawAtmosBand(261, 20, GAME_WIDTH * 0.96, farHaze, skyViolet, 0.07);
  drawAtmosBand(273, 14, GAME_WIDTH * 0.9, midHaze, skyMid, 0.08);
  drawAtmosBand(282, 8, GAME_WIDTH * 0.84, lowHaze, skyHaze, 0.09);

  const drawFoothillTexture = (centerY, bandHeight, bandWidth, baseColor, shadowColor, highlightColor, detail = 1) => {
    const rowStep = 2;
    for (let row = 0; row < bandHeight; row += rowStep) {
      const t = row / Math.max(1, bandHeight - 1);
      const softT = smoothStep(t);
      const rowWidth = bandWidth * (0.78 + softT * 0.34);
      const y = centerY - bandHeight / 2 + row;
      const xBase = GAME_WIDTH / 2 + Math.sin((row + centerY) * 0.2) * (3 + detail * 2);
      const seamCount = Math.max(12, Math.floor((rowWidth / 80) * detail));
      for (let seam = 0; seam < seamCount; seam += 1) {
        const seamT = seamCount <= 1 ? 0.5 : seam / (seamCount - 1);
        const seamWave = Math.sin((row * 0.33) + seam * 1.28 + centerY * 0.01) * (2.8 + detail * 1.2);
        const seamX = xBase - rowWidth / 2 + seamT * rowWidth + seamWave;
        const seamW = Math.max(3, rowWidth / (seamCount * 2.2));
        const seamShade = mixColor(baseColor, shadowColor, clamp(0.2 + seamT * 0.45 + softT * 0.24, 0, 0.82));
        offset = writeRectWH(vertexData, offset, seamX, y, seamW, 1, seamShade, offsetX, offsetY);

        if (row < bandHeight * 0.42 && (seam % 2) === 0) {
          const seamHighlight = mixColor(baseColor, highlightColor, clamp(0.22 + (0.42 - t) * 0.62, 0, 0.72));
          offset = writeRectWH(vertexData, offset, seamX - 1, y - 1, Math.max(2, seamW * 0.45), 1, seamHighlight, offsetX, offsetY);
        }
      }

      if ((row % 6) === 2) {
        const shelfWidth = rowWidth * (0.14 + Math.sin((row + centerY) * 0.14) * 0.05);
        const shelfX = xBase + Math.sin(row * 0.27 + centerY * 0.03) * 12;
        const shelfColor = mixColor(shadowColor, baseColor, 0.4 + softT * 0.2);
        offset = writeRectWH(vertexData, offset, shelfX, y + 0.1, Math.max(20, shelfWidth), 1, shelfColor, offsetX, offsetY);
      }
    }
  };

  const foothillBaseFar = mixColor(farHaze, midHaze, 0.34);
  const foothillBaseMid = mixColor(midHaze, lowHaze, 0.36);
  const foothillShadow = mixColor(horizonMid, farHaze, 0.54);
  const foothillHighlight = mixColor(lowHaze, skyHaze, 0.42);
  drawFoothillTexture(263, 18, GAME_WIDTH * 0.92, foothillBaseFar, foothillShadow, foothillHighlight, 0.95);
  drawFoothillTexture(275, 12, GAME_WIDTH * 0.86, foothillBaseMid, mixColor(foothillShadow, horizonDark, 0.28), foothillHighlight, 1.1);

  const centerWarm = mixColor(warmHorizonTint, skyHaze, 0.54);
  const centerWarmSoft = mixColor(centerWarm, lowHaze, 0.56);
  offset = writeRectWH(vertexData, offset, GAME_WIDTH * 0.57, 266, GAME_WIDTH * 0.42, 10, centerWarmSoft, offsetX, offsetY);
  offset = writeRectWH(vertexData, offset, GAME_WIDTH * 0.57, 272, GAME_WIDTH * 0.34, 8, mixColor(centerWarmSoft, midHaze, 0.52), offsetX, offsetY);
  offset = writeRectWH(vertexData, offset, GAME_WIDTH * 0.57, 277, GAME_WIDTH * 0.26, 6, mixColor(centerWarmSoft, lowHaze, 0.5), offsetX, offsetY);

  for (let y = 252; y <= 286; y += 4) {
    for (let x = 26; x <= GAME_WIDTH - 26; x += 18) {
      const n = (x * 13 + y * 17) % 61;
      if (n < 1) {
        const fleckColor = y < 266 ? farHaze : (y < 278 ? midHaze : lowHaze);
        const warmFleck = mixColor(fleckColor, skyViolet, 0.22);
        const fleckWidth = 2;
        offset = writeRectWH(vertexData, offset, x, y, fleckWidth, 1, warmFleck, offsetX, offsetY);
      }
    }
  }

  offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, 287, GAME_WIDTH * 0.9, 2, mixColor(lowHaze, horizonMid, 0.45), offsetX, offsetY);

  const groundTopY = 284;
  const groundBottomY = 540;
  const groundBandCount = 24;
  for (let i = 0; i < groundBandCount; i += 1) {
    const t = i / (groundBandCount - 1);
    const blend = t < 0.46
      ? mixColor(fieldFar, fieldMid, t / 0.46)
      : mixColor(fieldMid, fieldNear, (t - 0.46) / 0.54);
    const y1 = groundTopY + ((groundBottomY - groundTopY) * i) / groundBandCount;
    const y2 = groundTopY + ((groundBottomY - groundTopY) * (i + 1)) / groundBandCount;
    offset = writeRectWH(
      vertexData,
      offset,
      GAME_WIDTH / 2,
      (y1 + y2) / 2,
      GAME_WIDTH,
      Math.max(4, y2 - y1 + 1),
      blend,
      offsetX,
      offsetY
    );
  }

  for (let y = 304; y <= 392; y += 14) {
    for (let x = 20; x <= GAME_WIDTH - 20; x += 20) {
      const value = (x * 5 + y * 9) % 29;
      if (value < 3) {
        offset = writeRectWH(vertexData, offset, x, y, 2, 3, grassDry, offsetX, offsetY);
      }
    }
  }

  for (let y = 396; y <= 470; y += 12) {
    for (let x = 16; x <= GAME_WIDTH - 16; x += 16) {
      const value = (x * 7 + y * 11) % 31;
      if (value < 4) {
        offset = writeRectWH(vertexData, offset, x, y, 2, 5, grassDry, offsetX, offsetY);
      } else if (value > 28) {
        offset = writeRectWH(vertexData, offset, x, y, 2, 4, grassDark, offsetX, offsetY);
      }
    }
  }

  for (let y = 474; y <= 536; y += 10) {
    for (let x = 12; x <= GAME_WIDTH - 12; x += 12) {
      const value = (x * 9 + y * 13) % 33;
      if (value < 5) {
        offset = writeRectWH(vertexData, offset, x, y, 2, 6, grassNearGlow, offsetX, offsetY);
      } else if (value > 29) {
        offset = writeRectWH(vertexData, offset, x, y, 2, 5, grassDark, offsetX, offsetY);
      }
    }
  }

  for (let y = 332; y <= 536; y += 11) {
    for (let x = 14; x <= GAME_WIDTH - 14; x += 14) {
      if (((x * 3 + y * 7) % 41) < 5) {
        offset = writeRectWH(vertexData, offset, x, y, 3, 3, grassDust, offsetX, offsetY);
      }
    }
  }

  const shrubs = [
    [88, 430], [132, 448], [176, 420], [222, 446], [264, 432], [620, 412], [686, 428],
    [752, 442], [826, 420], [892, 438], [714, 510], [788, 498], [858, 520]
  ];
  for (const [x, y] of shrubs) {
    offset = writeRectWH(vertexData, offset, x, y + 3, 15, 8, shrubDark, offsetX, offsetY);
    offset = writeRectWH(vertexData, offset, x, y, 19, 10, shrubLight, offsetX, offsetY);
  }

  return offset;
}

function drawWolfSkull(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0, tumbleAngle = 0) {
  const unit = Math.max(2, Math.round((size * WOLF_RENDER_SCALE) / 10));
  const boneDeep = [0.66, 0.64, 0.6, 1.0];
  const boneShade = [0.76, 0.74, 0.7, 1.0];
  const bone = [0.86, 0.84, 0.79, 1.0];
  const boneLight = [0.93, 0.91, 0.87, 1.0];
  const voidColor = [0.07, 0.07, 0.08, 1.0];
  const tooth = [0.95, 0.94, 0.9, 1.0];

  const pixels = [
    [-3, -6, boneDeep], [-2, -6, boneShade], [2, -6, boneShade], [3, -6, boneDeep],
    [-4, -5, boneDeep], [-3, -5, boneShade], [-2, -5, bone], [-1, -5, bone], [0, -5, boneLight], [1, -5, bone], [2, -5, bone], [3, -5, boneShade], [4, -5, boneDeep],
    [-5, -4, boneDeep], [-4, -4, boneShade], [-3, -4, bone], [-2, -4, bone], [-1, -4, boneLight], [0, -4, boneLight], [1, -4, boneLight], [2, -4, bone], [3, -4, bone], [4, -4, boneShade], [5, -4, boneDeep],
    [-6, -3, boneDeep], [-5, -3, boneShade], [-4, -3, bone], [-3, -3, bone], [-2, -3, voidColor], [-1, -3, voidColor], [0, -3, boneLight], [1, -3, voidColor], [2, -3, voidColor], [3, -3, bone], [4, -3, bone], [5, -3, boneShade], [6, -3, boneDeep],
    [-6, -2, boneDeep], [-5, -2, boneShade], [-4, -2, bone], [-3, -2, voidColor], [-2, -2, voidColor], [-1, -2, voidColor], [0, -2, bone], [1, -2, voidColor], [2, -2, voidColor], [3, -2, voidColor], [4, -2, bone], [5, -2, boneShade], [6, -2, boneDeep],
    [-5, -1, boneShade], [-4, -1, bone], [-3, -1, bone], [-2, -1, bone], [-1, -1, bone], [0, -1, voidColor], [1, -1, bone], [2, -1, bone], [3, -1, bone], [4, -1, bone], [5, -1, boneShade],
    [-5, 0, boneShade], [-4, 0, bone], [-3, 0, bone], [-2, 0, bone], [-1, 0, voidColor], [0, 0, voidColor], [1, 0, voidColor], [2, 0, bone], [3, 0, bone], [4, 0, bone], [5, 0, boneShade],
    [-4, 1, boneShade], [-3, 1, bone], [-2, 1, bone], [-1, 1, bone], [0, 1, bone], [1, 1, bone], [2, 1, bone], [3, 1, bone], [4, 1, boneShade],
    [-3, 2, boneShade], [-2, 2, bone], [-1, 2, tooth], [0, 2, bone], [1, 2, tooth], [2, 2, bone], [3, 2, boneShade],
    [-2, 3, boneShade], [-1, 3, tooth], [0, 3, boneDeep], [1, 3, tooth], [2, 3, boneShade],
    [-1, 4, boneShade], [0, 4, boneDeep], [1, 4, boneShade]
  ];

  const cosA = Math.cos(tumbleAngle);
  const sinA = Math.sin(tumbleAngle);

  for (const [gridX, gridY, color] of pixels) {
    const rotatedX = gridX * cosA - gridY * sinA;
    const rotatedY = gridX * sinA + gridY * cosA;
    offset = writeRectWH(
      vertexData,
      offset,
      centerX + rotatedX * unit,
      centerY + rotatedY * unit,
      unit,
      unit,
      color,
      offsetX,
      offsetY
    );
  }

  return offset;
}

function drawWolfHead(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0, isFalling = false, tumbleAngle = 0, showKnockoutEyes = false, knockoutProgress = 0) {
  if (isFalling && !showKnockoutEyes) {
    return drawWolfSkull(vertexData, offset, centerX, centerY, size, offsetX, offsetY, tumbleAngle);
  }

  const baseUnit = Math.max(2, Math.round((size * WOLF_RENDER_SCALE) / 13));
  const popPulse = Math.pow(Math.sin(clamp(knockoutProgress, 0, 1) * Math.PI), 0.75);
  const popScale = showKnockoutEyes ? (1 + 0.14 * popPulse) : 1;
  const unit = baseUnit * popScale;
  const outline = [0.12, 0.16, 0.25, 1.0];
  const deep = [0.2, 0.26, 0.39, 1.0];
  const dark = [0.28, 0.35, 0.5, 1.0];
  const mid = [0.39, 0.47, 0.65, 1.0];
  const light = [0.53, 0.6, 0.78, 1.0];
  const pale = [0.7, 0.73, 0.9, 1.0];
  const earInner = [0.18, 0.22, 0.34, 1.0];
  const earInnerRim = [0.45, 0.52, 0.7, 1.0];
  const stripe = [0.16, 0.2, 0.3, 1.0];
  const muzzle = [0.66, 0.69, 0.86, 1.0];
  const muzzleShade = [0.5, 0.55, 0.72, 1.0];
  const eyeAmber = [0.95, 0.68, 0.2, 1.0];
  const eyeGlow = [1.0, 0.93, 0.64, 1.0];
  const eyeLid = [0.11, 0.14, 0.2, 1.0];
  const pupil = [0.06, 0.07, 0.09, 1.0];
  const xEye = [0.12, 0.07, 0.09, 1.0];
  const nose = [0.02, 0.03, 0.05, 1.0];
  const noseSoft = [0.14, 0.16, 0.2, 1.0];
  const pixels = [
    [-8, -11, outline], [8, -11, outline],
    [-9, -10, outline], [-8, -10, earInner], [-7, -10, outline], [-1, -10, dark], [0, -10, stripe], [1, -10, dark], [7, -10, outline], [8, -10, earInner], [9, -10, outline],
    [-9, -9, deep], [-8, -9, earInner], [-7, -9, earInnerRim], [7, -9, earInnerRim], [8, -9, earInner], [9, -9, deep],
    [-4, -9, outline], [-3, -9, deep], [-2, -9, dark], [-1, -9, stripe], [0, -9, stripe], [1, -9, stripe], [2, -9, dark], [3, -9, deep], [4, -9, outline],
    [-9, -8, deep], [-8, -8, earInnerRim], [-7, -8, earInner], [-6, -8, outline], [-5, -8, deep], [-4, -8, dark], [-3, -8, mid], [-2, -8, dark], [-1, -8, stripe], [0, -8, stripe], [1, -8, stripe], [2, -8, dark], [3, -8, mid], [4, -8, dark], [5, -8, deep], [6, -8, outline], [7, -8, earInner], [8, -8, earInnerRim], [9, -8, deep],
    [-8, -7, outline], [-7, -7, earInnerRim], [-6, -7, deep], [-5, -7, dark], [-4, -7, mid], [-3, -7, light], [-2, -7, mid], [-1, -7, dark], [0, -7, stripe], [1, -7, dark], [2, -7, mid], [3, -7, light], [4, -7, mid], [5, -7, dark], [6, -7, deep], [7, -7, earInnerRim], [8, -7, outline],
    [-8, -6, outline], [-7, -6, deep], [-6, -6, dark], [-5, -6, mid], [-4, -6, light], [-3, -6, pale], [-2, -6, light], [-1, -6, dark], [0, -6, stripe], [1, -6, dark], [2, -6, light], [3, -6, pale], [4, -6, light], [5, -6, mid], [6, -6, dark], [7, -6, deep], [8, -6, outline],
    [-9, -5, outline], [-8, -5, deep], [-7, -5, dark], [-6, -5, mid], [-5, -5, light], [-4, -5, pale], [-3, -5, light], [-2, -5, pale], [-1, -5, dark], [0, -5, stripe], [1, -5, dark], [2, -5, pale], [3, -5, light], [4, -5, pale], [5, -5, light], [6, -5, mid], [7, -5, dark], [8, -5, deep], [9, -5, outline],
    [-10, -4, outline], [-9, -4, deep], [-8, -4, dark], [-7, -4, mid], [-6, -4, light], [-5, -4, pale], [-4, -4, eyeLid], [-3, -4, eyeGlow], [-2, -4, eyeAmber], [-1, -4, eyeGlow], [0, -4, stripe], [1, -4, eyeGlow], [2, -4, eyeAmber], [3, -4, eyeGlow], [4, -4, eyeLid], [5, -4, pale], [6, -4, light], [7, -4, mid], [8, -4, dark], [9, -4, deep], [10, -4, outline],
    [-10, -3, outline], [-9, -3, deep], [-8, -3, dark], [-7, -3, mid], [-6, -3, light], [-5, -3, pale], [-4, -3, dark], [-3, -3, eyeAmber], [-2, -3, pupil], [-1, -3, eyeGlow], [0, -3, stripe], [1, -3, eyeGlow], [2, -3, pupil], [3, -3, eyeAmber], [4, -3, dark], [5, -3, pale], [6, -3, light], [7, -3, mid], [8, -3, dark], [9, -3, deep], [10, -3, outline],
    [-10, -2, outline], [-9, -2, deep], [-8, -2, dark], [-7, -2, mid], [-6, -2, light], [-5, -2, dark], [-4, -2, muzzleShade], [-3, -2, pale], [-2, -2, eyeGlow], [-1, -2, pale], [0, -2, stripe], [1, -2, pale], [2, -2, eyeGlow], [3, -2, pale], [4, -2, muzzleShade], [5, -2, dark], [6, -2, light], [7, -2, mid], [8, -2, dark], [9, -2, deep], [10, -2, outline],
    [-9, -1, outline], [-8, -1, deep], [-7, -1, dark], [-6, -1, mid], [-5, -1, light], [-4, -1, muzzleShade], [-3, -1, muzzle], [-2, -1, muzzle], [-1, -1, muzzle], [0, -1, nose], [1, -1, muzzle], [2, -1, muzzle], [3, -1, muzzle], [4, -1, muzzleShade], [5, -1, light], [6, -1, mid], [7, -1, dark], [8, -1, deep], [9, -1, outline],
    [-9, 0, outline], [-8, 0, deep], [-7, 0, dark], [-6, 0, mid], [-5, 0, light], [-4, 0, muzzleShade], [-3, 0, muzzle], [-2, 0, muzzle], [-1, 0, noseSoft], [0, 0, nose], [1, 0, noseSoft], [2, 0, muzzle], [3, 0, muzzle], [4, 0, muzzleShade], [5, 0, light], [6, 0, mid], [7, 0, dark], [8, 0, deep], [9, 0, outline],
    [-8, 1, outline], [-7, 1, deep], [-6, 1, dark], [-5, 1, mid], [-4, 1, muzzleShade], [-3, 1, muzzle], [-2, 1, muzzle], [-1, 1, muzzle], [0, 1, nose], [1, 1, muzzle], [2, 1, muzzle], [3, 1, muzzle], [4, 1, muzzleShade], [5, 1, mid], [6, 1, dark], [7, 1, deep], [8, 1, outline],
    [-7, 2, outline], [-6, 2, deep], [-5, 2, dark], [-4, 2, mid], [-3, 2, muzzleShade], [-2, 2, muzzle], [-1, 2, muzzle], [0, 2, dark], [1, 2, muzzle], [2, 2, muzzle], [3, 2, muzzleShade], [4, 2, mid], [5, 2, dark], [6, 2, deep], [7, 2, outline],
    [-6, 3, outline], [-5, 3, deep], [-4, 3, dark], [-3, 3, mid], [-2, 3, muzzleShade], [-1, 3, muzzle], [0, 3, outline], [1, 3, muzzle], [2, 3, muzzleShade], [3, 3, mid], [4, 3, dark], [5, 3, deep], [6, 3, outline],
    [-4, 4, deep], [-3, 4, dark], [-2, 4, muzzleShade], [-1, 4, muzzle], [0, 4, outline], [1, 4, muzzle], [2, 4, muzzleShade], [3, 4, dark], [4, 4, deep],
    [-3, 5, deep], [-2, 5, muzzleShade], [-1, 5, muzzle], [0, 5, muzzle], [1, 5, muzzle], [2, 5, muzzleShade], [3, 5, deep],
    [-2, 6, deep], [-1, 6, muzzleShade], [0, 6, muzzle], [1, 6, muzzleShade], [2, 6, deep],
    [-1, 7, deep], [0, 7, dark], [1, 7, deep],
    [0, 8, outline],
    [0, 9, outline],
    [-8, -7, outline], [8, -7, outline],
    [-9, -4, outline], [9, -4, outline],
    [-7, 1, outline], [7, 1, outline]
  ];

  for (const [gridX, gridY, color] of pixels) {
    offset = writeRectWH(
      vertexData,
      offset,
      centerX + gridX * unit,
      centerY + gridY * unit,
      unit,
      unit,
      color,
      offsetX,
      offsetY
    );
  }

  if (showKnockoutEyes) {
    const xEyePixels = [
      [-3, -4], [-2, -3], [-1, -2], [-3, -2], [-1, -4],
      [1, -4], [2, -3], [3, -2], [1, -2], [3, -4]
    ];

    for (const [gridX, gridY] of xEyePixels) {
      offset = writeRectWH(
        vertexData,
        offset,
        centerX + gridX * unit,
        centerY + gridY * unit,
        unit,
        unit,
        xEye,
        offsetX,
        offsetY
      );
    }
  }

  return offset;
}

function drawCarrot(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0) {
  const unit = Math.max(2, Math.round((size * CARROT_RENDER_SCALE) / 9));
  const leafDark = [0.15, 0.48, 0.2, 1.0];
  const leafMid = [0.21, 0.63, 0.27, 1.0];
  const leafBright = [0.34, 0.8, 0.36, 1.0];
  const stem = [0.52, 0.38, 0.21, 1.0];
  const carrotDark = [0.73, 0.3, 0.06, 1.0];
  const carrotMid = [0.88, 0.43, 0.1, 1.0];
  const carrotLight = [0.99, 0.62, 0.24, 1.0];
  const carrotHighlight = [1.0, 0.76, 0.4, 1.0];
  const carrotOutline = [0.48, 0.2, 0.03, 1.0];

  const pixels = [
    [0, -6, leafBright],
    [-1, -5, leafMid], [0, -5, leafBright], [1, -5, leafMid],
    [-2, -4, leafDark], [-1, -4, leafMid], [0, -4, leafBright], [1, -4, leafMid], [2, -4, leafDark],
    [-2, -3, leafDark], [-1, -3, leafMid], [0, -3, stem], [1, -3, leafMid], [2, -3, leafDark],
    [-3, -2, carrotOutline], [3, -2, carrotOutline],
    [-2, -2, carrotDark], [-1, -2, carrotMid], [0, -2, carrotLight], [1, -2, carrotMid], [2, -2, carrotDark],
    [-3, -1, carrotOutline], [3, -1, carrotOutline],
    [-2, -1, carrotDark], [-1, -1, carrotMid], [0, -1, carrotHighlight], [1, -1, carrotMid], [2, -1, carrotDark],
    [-3, 0, carrotOutline], [3, 0, carrotOutline],
    [-2, 0, carrotDark], [-1, 0, carrotMid], [0, 0, carrotLight], [1, 0, carrotMid], [2, 0, carrotDark],
    [-3, 1, carrotOutline], [3, 1, carrotOutline],
    [-2, 1, carrotDark], [-1, 1, carrotMid], [0, 1, carrotHighlight], [1, 1, carrotMid], [2, 1, carrotDark],
    [-2, 2, carrotOutline], [2, 2, carrotOutline],
    [-1, 2, carrotDark], [0, 2, carrotMid], [1, 2, carrotDark],
    [-2, 3, carrotOutline], [2, 3, carrotOutline],
    [-1, 3, carrotDark], [0, 3, carrotMid], [1, 3, carrotDark],
    [0, 4, carrotMid],
    [0, 5, carrotDark],
    [0, 6, carrotDark]
  ];

  for (const [gridX, gridY, color] of pixels) {
    offset = writeRectWH(
      vertexData,
      offset,
      centerX + gridX * unit,
      centerY + gridY * unit,
      unit,
      unit,
      color,
      offsetX,
      offsetY
    );
  }

  return offset;
}

function getRabbitAnimationSample(textureWidth) {
  const directionKey = state.player.facing < 0 ? 'left' : 'right';
  const animation = RABBIT_ANIMATIONS[state.player.animationState] ?? RABBIT_ANIMATIONS.idle;
  const frames = animation[directionKey] ?? animation.right;
  const frameListLength = frames.length || 1;
  const frameListIndex = Math.floor(state.player.animationTime * animation.fps) % frameListLength;
  const frameColumn = frames[frameListIndex] ?? 0;
  const boundedColumn = clamp(frameColumn, 0, RABBIT_FRAME_COLUMNS - 1);
  const frameX = RABBIT_FRAME_X[boundedColumn];
  const nextFrameX = RABBIT_FRAME_X[boundedColumn + 1];
  const frameWidth = nextFrameX ? (nextFrameX - frameX) : (textureWidth - frameX);
  const frameY = state.player.facing < 0 ? RABBIT_FRAME_HEIGHT : 0;
  return {
    directionKey,
    frameListIndex,
    frameColumn: boundedColumn,
    frameRect: {
      frameX,
      frameY,
      frameWidth: Math.max(1, frameWidth || RABBIT_FRAME_WIDTH),
      frameHeight: RABBIT_FRAME_HEIGHT
    }
  };
}

function writeSprite(vertexData, centerX, centerY, drawWidth, drawHeight, frameRect, textureWidth, textureHeight, offsetX = 0, offsetY = 0) {
  const finalCenterX = centerX + offsetX;
  const finalCenterY = centerY + offsetY;
  const halfWidth = drawWidth / 2;
  const halfHeight = drawHeight / 2;
  const x1 = (finalCenterX - halfWidth) / GAME_WIDTH * 2 - 1;
  const y1 = 1 - (finalCenterY - halfHeight) / GAME_HEIGHT * 2;
  const x2 = (finalCenterX + halfWidth) / GAME_WIDTH * 2 - 1;
  const y2 = 1 - (finalCenterY + halfHeight) / GAME_HEIGHT * 2;

  const u1 = frameRect.frameX / textureWidth;
  const v1 = frameRect.frameY / textureHeight;
  const u2 = (frameRect.frameX + frameRect.frameWidth) / textureWidth;
  const v2 = (frameRect.frameY + frameRect.frameHeight) / textureHeight;

  vertexData.set([
    x1, y1, u1, v1,
    x2, y1, u2, v1,
    x2, y2, u2, v2,
    x1, y1, u1, v1,
    x2, y2, u2, v2,
    x1, y2, u1, v2
  ]);
}

function render(timestamp) {
  if (!gpu) {
    return;
  }

  const rawDt = state.lastTime ? (timestamp - state.lastTime) / 1000 : 0;
  state.lastTime = timestamp;

  const clampedDt = Math.min(rawDt, 0.25);
  state.simulationAccumulator += clampedDt;
  while (state.simulationAccumulator >= FIXED_TIMESTEP) {
    update(FIXED_TIMESTEP);
    state.simulationAccumulator -= FIXED_TIMESTEP;
  }

  const shakeDecay = state.screenShakeTime > 0 ? state.screenShakeTime / 0.18 : 0;
  const shakeMagnitude = state.screenShakeStrength * clamp(shakeDecay, 0, 1);
  const shakeX = shakeMagnitude > 0 ? randomRange(-shakeMagnitude, shakeMagnitude) : 0;
  const shakeY = shakeMagnitude > 0 ? randomRange(-shakeMagnitude, shakeMagnitude) : 0;

  let offset = 0;

  offset = drawPixelPasture(gpu.vertexData, offset, shakeX, shakeY, timestamp * 0.001);
  if (offset === 0) {
    offset = writeRectWH(gpu.vertexData, offset, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, [0.55, 0.38, 0.2, 1.0], shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, GAME_WIDTH / 2, 180, GAME_WIDTH, 250, [0.8, 0.48, 0.22, 1.0], shakeX, shakeY);
  }
  offset = drawCarrot(gpu.vertexData, offset, state.target.x, state.target.y, state.target.size, shakeX, shakeY);

  for (const hazard of state.hazards) {
    if (!hazard.active) {
      continue;
    }

    offset = drawWolfHead(
      gpu.vertexData,
      offset,
      hazard.x,
      hazard.y,
      hazard.size,
      shakeX,
      shakeY,
      hazard.isFalling,
      hazard.fallSpin || 0,
      (hazard.knockoutEyesTimer || 0) > 0,
      1 - clamp((hazard.knockoutEyesTimer || 0) / HAZARD_KNOCKOUT_X_EYES_DURATION, 0, 1)
    );
  }

  for (const shot of state.shots) {
    const lifeRatio = clamp(shot.ttl / shot.maxTtl, 0, 1);
    const lineLength = getShotLength(shot);
    const lineCenterX = shot.x + (shot.direction * lineLength) / 2;
    const lineColor = lifeRatio > 0.4 ? [1.0, 0.95, 0.55, 1.0] : [1.0, 0.72, 0.35, 1.0];
    offset = writeRectWH(gpu.vertexData, offset, lineCenterX, shot.y, lineLength, FIRE_THICKNESS, lineColor, shakeX, shakeY);
  }

  if (state.hitFlashTimer > 0) {
    const flashAlpha = clamp(state.hitFlashTimer / HIT_FLASH_DURATION, 0, 1) * 0.22;
    offset = writeRectWH(
      gpu.vertexData,
      offset,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      [1.0, 0.96, 0.84, flashAlpha],
      shakeX,
      shakeY
    );
  }

  for (const effect of state.collectEffects) {
    const life = clamp(effect.ttl / effect.maxTtl, 0, 1);
    const growth = 1 - life;
    const coreSize = 8 + growth * 18;
    const ringSize = 14 + growth * 42;
    const armLength = 12 + growth * 26;
    const armThickness = 2 + life * 3;
    const glow = [1.0, 0.96, 0.62, 1.0];
    const sparkle = [1.0, 0.72, 0.2, 1.0];
    const ember = [1.0, 0.48, 0.12, 1.0];

    offset = writeRectWH(gpu.vertexData, offset, effect.x, effect.y, coreSize, coreSize, glow, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x, effect.y - ringSize * 0.5, ringSize, armThickness, sparkle, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x, effect.y + ringSize * 0.5, ringSize, armThickness, sparkle, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x - ringSize * 0.5, effect.y, armThickness, ringSize, sparkle, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x + ringSize * 0.5, effect.y, armThickness, ringSize, sparkle, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x - armLength * 0.5, effect.y, armLength, armThickness, sparkle, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x, effect.y - armLength * 0.5, armThickness, armLength, sparkle, shakeX, shakeY);

    const particleRadius = 10 + growth * 34;
    const particleSize = 2 + life * 3;
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 + growth * 0.35;
      const px = effect.x + Math.cos(angle) * particleRadius;
      const py = effect.y + Math.sin(angle) * particleRadius;
      const particleColor = index % 2 === 0 ? sparkle : ember;
      offset = writeRectWH(gpu.vertexData, offset, px, py, particleSize, particleSize, particleColor, shakeX, shakeY);
    }
  }

  for (const effect of state.enemyKillEffects) {
    const life = clamp(effect.ttl / effect.maxTtl, 0, 1);
    const growth = 1 - life;
    const ringSize = 16 + growth * 32;
    const armThickness = 2 + life * 2;
    const ember = [1.0, 0.42, 0.2, 1.0];
    const flash = [1.0, 0.82, 0.45, 1.0];

    offset = writeRectWH(gpu.vertexData, offset, effect.x, effect.y, ringSize, armThickness, flash, shakeX, shakeY);
    offset = writeRectWH(gpu.vertexData, offset, effect.x, effect.y, armThickness, ringSize, flash, shakeX, shakeY);

    const radius = 10 + growth * 24;
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const px = effect.x + Math.cos(angle) * radius;
      const py = effect.y + Math.sin(angle) * radius;
      offset = writeRectWH(gpu.vertexData, offset, px, py, 3 + life * 2, 3 + life * 2, ember, shakeX, shakeY);
    }
  }

  const vertexCount = offset / 6;
  gpu.device.queue.writeBuffer(gpu.vertexBuffer, 0, gpu.vertexData, 0, offset);

  const encoder = gpu.device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: gpu.context.getCurrentTexture().createView(),
        clearValue: { r: 0.03, g: 0.05, b: 0.12, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }
    ]
  });

  pass.setPipeline(gpu.colorPipeline);
  pass.setVertexBuffer(0, gpu.vertexBuffer);
  pass.draw(vertexCount);

  const animationSample = getRabbitAnimationSample(gpu.spriteTextureWidth);

  writeSprite(
    gpu.spriteVertexData,
    state.player.x,
    state.player.y,
    state.player.drawWidth,
    state.player.drawHeight,
    animationSample.frameRect,
    gpu.spriteTextureWidth,
    gpu.spriteTextureHeight,
    shakeX,
    shakeY
  );
  gpu.device.queue.writeBuffer(gpu.spriteVertexBuffer, 0, gpu.spriteVertexData);

  pass.setPipeline(gpu.spritePipeline);
  pass.setBindGroup(0, gpu.spriteBindGroup);
  pass.setVertexBuffer(0, gpu.spriteVertexBuffer);
  pass.draw(6);
  pass.end();

  gpu.device.queue.submit([encoder.finish()]);
  requestAnimationFrame(render);
}

async function start() {
  setupInput();
  loadHighScore();
  loadSettings();
  updateHud();
  fitStageToViewport();

  window.addEventListener('resize', fitStageToViewport);
  window.addEventListener('orientationchange', fitStageToViewport);
  document.addEventListener('fullscreenchange', () => {
    fitStageToViewport();
    updateSettingsUI();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitStageToViewport);
  }

  try {
    gpu = await initWebGPU();
    showStoryIntro();
    requestAnimationFrame(render);
  } catch (error) {
    console.error(error);
    setStatus('WebGPU unavailable. Use a WebGPU-enabled browser (Chrome/Edge).');
  }
}

start();
