import {
  GAME_DURATION_SECONDS,
  PLAYER_DRAW_HEIGHT_BASE,
  PLAYER_DRAW_WIDTH_BASE
} from './game-constants.js';

export const state = {
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
    spawnArmorTimer: 0,
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
  playerDeathEffectActive: false,
  screenShakeTime: 0,
  screenShakeStrength: 0,
  sessionJournal: [],
  keys: new Set(),
  lastTime: 0,
  simulationAccumulator: 0,
  countdownAccumulator: 0
};
