import { createGamePhaseMachine } from './game-phase-machine.js';
import { clamp, randomRange } from './math-utils.js';
import { writeRectWH, writeSprite } from './render-primitives.js';
import { createUiSystem } from './ui-system.js';
import { createAudioSystem } from './audio-system.js';
import { bounceCircle, intersects } from './game-loop-utils.js';
import { createGameFlowController } from './game-flow-controller.js';
import { createGameEffectsController } from './game-effects-controller.js';
import { createCanvasFallbackRenderer } from './canvas-fallback-renderer.js';
import {
  drawCarrot as renderDrawCarrot,
  drawPixelPasture as renderDrawPixelPasture,
  getRabbitAnimationSample as renderGetRabbitAnimationSample,
  drawWolfHead as renderDrawWolfHead
} from './game-renderer.js';
import {
  canvas,
  clearJournalButtonEl,
  difficultyToggleEl,
  fullscreenToggleEl,
  fxLayerEl,
  gameOverlayEl,
  gamePageEl,
  highScoreEl,
  journalListEl,
  livesEl,
  musicToggleEl,
  overlayButtonEl,
  overlayMessageEl,
  overlayTitleEl,
  scoreEl,
  stageWrapEl,
  statusEl,
  timeEl,
  touchControlsEl
} from './game-dom.js';
import {
  CARROT_COLLECT_EFFECT_TTL,
  CARROT_COLLECT_SCORE,
  ENEMY_HIT_SCORE,
  ENEMY_KILL_EFFECT_TTL,
  FINAL_MESSAGE_THEME_STEP_SECONDS,
  FIRE_COOLDOWN_SECONDS,
  FIRE_LIFETIME,
  FIRE_MAX_LENGTH,
  FIRE_SPEED,
  FIRE_THICKNESS,
  FIXED_TIMESTEP,
  GAME_DURATION_SECONDS,
  GAME_HEIGHT,
  GAME_WIDTH,
  HAZARD_FALL_GRAVITY,
  HAZARD_FALL_LAUNCH_X_MAX,
  HAZARD_FALL_LAUNCH_X_MIN,
  HAZARD_FALL_LAUNCH_Y_MAX,
  HAZARD_FALL_LAUNCH_Y_MIN,
  HAZARD_KNOCKOUT_X_EYES_DURATION,
  HAZARD_RESPAWN_DELAY,
  HAZARD_TUMBLE_SPEED_MAX,
  HAZARD_TUMBLE_SPEED_MIN,
  HIGH_SCORE_STORAGE_KEY,
  HIT_FLASH_DURATION,
  HIT_STOP_DURATION,
  PLAYER_DRAW_HEIGHT_BASE,
  PLAYER_DRAW_WIDTH_BASE,
  PLAYER_GRAVITY,
  PLAYER_JUMP_VELOCITY,
  PLAYER_PERSPECTIVE_FAR_SCALE,
  PLAYER_SPAWN_ARMOR_DURATION,
  PLAYER_WALK_MAX_Y,
  PLAYER_WALK_MIN_Y,
  RABBIT_DEATH_ANIMATION_DURATION_MS,
  SESSION_JOURNAL_MAX_ENTRIES,
  SESSION_JOURNAL_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SOUNDTRACK_STEP_SECONDS,
  STORY_TYPE_INTERVAL_MS
} from './game-constants.js';
import {
  DIFFICULTY_PROFILES,
  DIFFICULTY_SEQUENCE,
  FINAL_MESSAGE_THEME_BASS,
  FINAL_MESSAGE_THEME_MELODY,
  GAME_OVER_KOANS,
  getContemplativePolishProfile,
  KOAN_CHAPTER_TAGS,
  RESPAWN_REFLECTIONS,
  SOUNDTRACK_BASS,
  SOUNDTRACK_MELODY,
  STORY_INTRO_LINES,
  WIN_AFFIRMATIONS,
  WIN_CHAPTER_TAGS
} from './game-content.js';
import { state } from './game-state.js';

let gpu = null;
let canvasFallbackRenderer = null;
let fallbackModeBadgeEl = null;
const contemplativeQuotePools = {
  respawn: [],
  gameOver: [],
  chapter: [],
  win: [],
  winChapter: []
};
const phaseMachine = createGamePhaseMachine({
  initialPhase: state.gamePhase,
  onInvalidTransition: ({ from, to }) => {
    console.warn(`[phase-machine] blocked transition ${from} -> ${to}`);
  }
});

const uiSystem = createUiSystem({
  state,
  elements: {
    scoreEl,
    highScoreEl,
    livesEl,
    timeEl,
    statusEl,
    stageWrapEl,
    gamePageEl,
    touchControlsEl,
    musicToggleEl,
    difficultyToggleEl,
    fullscreenToggleEl,
    journalListEl
  },
  GAME_WIDTH,
  GAME_HEIGHT,
  DIFFICULTY_PROFILES,
  SESSION_JOURNAL_MAX_ENTRIES,
  SETTINGS_STORAGE_KEY,
  SESSION_JOURNAL_STORAGE_KEY
});

const audioSystem = createAudioSystem({
  state,
  getContemplativePolishProfile,
  SOUNDTRACK_MELODY,
  SOUNDTRACK_BASS,
  SOUNDTRACK_STEP_SECONDS,
  FINAL_MESSAGE_THEME_MELODY,
  FINAL_MESSAGE_THEME_BASS,
  FINAL_MESSAGE_THEME_STEP_SECONDS
});

const flowController = createGameFlowController({
  state,
  elements: {
    gameOverlayEl,
    overlayTitleEl,
    overlayMessageEl,
    overlayButtonEl
  },
  STORY_INTRO_LINES,
  STORY_TYPE_INTERVAL_MS,
  WIN_CHAPTER_TAGS,
  WIN_AFFIRMATIONS,
  GAME_OVER_KOANS,
  KOAN_CHAPTER_TAGS,
  RESPAWN_REFLECTIONS,
  callbacks: {
    setGamePhase,
    showOverlay,
    hideOverlay,
    setStatus,
    setContemplativeMode,
    setFinalMessageThemeActive,
    setSoundtrackActive,
    setContemplativeTypeCursorActive,
    appendSessionJournalEntry: (chapter, koan, score, outcome = 'loss') => {
      uiSystem.appendSessionJournalEntry(chapter, koan, score, outcome);
    },
    drawWithoutImmediateRepeat,
    getContemplativePolishProfile,
    onTitleCountdownComplete: () => resetGame()
  }
});

const effectsController = createGameEffectsController({
  state,
  elements: {
    canvas,
    fxLayerEl
  },
  constants: {
    GAME_WIDTH,
    GAME_HEIGHT,
    CARROT_COLLECT_EFFECT_TTL,
    ENEMY_KILL_EFFECT_TTL,
    RABBIT_DEATH_ANIMATION_DURATION_MS,
    PLAYER_SPAWN_ARMOR_DURATION
  },
  callbacks: {
    clamp,
    clearRespawnCountdown,
    clearRespawnReflectionSequence,
    clearWinAffirmationSequence,
    setContemplativeMode,
    setFinalMessageThemeActive,
    setSoundtrackActive,
    setStatus,
    finishGame,
    beginRespawnCountdown
  }
});

function setGamePhase(nextPhase) {
  state.gamePhase = phaseMachine.transition(nextPhase);
  return state.gamePhase;
}

function shuffleArray(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = values[index];
    values[index] = values[swapIndex];
    values[swapIndex] = temp;
  }
  return values;
}

function drawWithoutImmediateRepeat(source, poolKey) {
  const pool = contemplativeQuotePools[poolKey];
  if (!pool || source.length === 0) {
    return source[0] || '';
  }

  if (pool.length === 0) {
    pool.push(...shuffleArray(source.map((_, index) => index)));
  }

  const pickedIndex = pool.shift();
  return source[pickedIndex] ?? source[0];
}

function setContemplativeTypeCursorActive(isActive) {
  if (!overlayMessageEl) {
    return;
  }

  overlayMessageEl.classList.toggle('contemplative-typing', isActive);
}

function updateHud() {
  uiSystem.updateHud();
}

function fitStageToViewport() {
  uiSystem.fitStageToViewport();
}

function updateSettingsUI() {
  uiSystem.updateSettingsUI();
}

function saveSettings() {
  uiSystem.saveSettings();
}

function getDifficultyProfile() {
  return DIFFICULTY_PROFILES[state.settings.difficulty] ?? DIFFICULTY_PROFILES.normal;
}

function setMusicEnabled(enabled) {
  state.settings.musicEnabled = enabled;
  if (!enabled) {
    setSoundtrackActive(false);
    stopContemplativeDrone();
    stopFinalMessageTheme();
  } else if (state.running && !state.paused) {
    setSoundtrackActive(true);
  } else if (audioSystem.isFinalThemeActive() && audioSystem.isUnlocked()) {
    startFinalMessageTheme();
  } else if (audioSystem.isContemplativeActive() && audioSystem.isUnlocked()) {
    startContemplativeDrone();
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
  uiSystem.setStatus(message);
}

function showOverlay(title, message, buttonLabel) {
  if (!gameOverlayEl || !overlayTitleEl || !overlayMessageEl || !overlayButtonEl) {
    return;
  }

  gameOverlayEl.classList.remove('existential-koan');
  gameOverlayEl.classList.remove('existential-pulse');
  overlayTitleEl.style.opacity = '';
  overlayTitleEl.style.transition = '';
  overlayMessageEl.style.opacity = '';
  overlayMessageEl.style.transition = '';
  overlayMessageEl.classList.remove('contemplative-typing');
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
  setContemplativeTypeCursorActive(false);
}

function clearStoryTypewriter() {
  flowController.clearStoryTypewriter();
}

function clearTitleCountdown() {
  flowController.clearTitleCountdown();
}

function clearRespawnCountdown() {
  flowController.clearRespawnCountdown();
}

function clearRespawnReflectionSequence() {
  flowController.clearRespawnReflectionSequence();
}

function clearWinAffirmationSequence() {
  flowController.clearWinAffirmationSequence();
}

function clearGameOverKoanSequence() {
  flowController.clearGameOverKoanSequence();
}

function advanceStoryIntro() {
  flowController.advanceStoryIntro();
}

function showStoryIntro() {
  flowController.showStoryIntro();
}

function finishGame(reason) {
  flowController.finishGame(reason);
}

function getDifficultyMultiplier() {
  const progress = clamp(state.elapsedTime / GAME_DURATION_SECONDS, 0, 1);
  const profile = getDifficultyProfile();
  return 1 + (profile.maxMultiplier - 1) * progress;
}


function stopContemplativeDrone() {
  audioSystem.stopContemplativeDrone();
}

function startContemplativeDrone() {
  audioSystem.startContemplativeDrone();
}

function setContemplativeMode(isActive) {
  audioSystem.setContemplativeMode(isActive);
}

function startFinalMessageTheme() {
  audioSystem.startFinalMessageTheme();
}

function stopFinalMessageTheme() {
  audioSystem.stopFinalMessageTheme();
}

function setFinalMessageThemeActive(isActive) {
  audioSystem.setFinalMessageThemeActive(isActive);
}

function unlockAudioFromGesture() {
  audioSystem.unlockAudioFromGesture();
}

function setSoundtrackActive(isActive) {
  audioSystem.setSoundtrackActive(isActive);
}

function playJumpSfx() {
  audioSystem.playJumpSfx();
}

function playFireSfx() {
  audioSystem.playFireSfx();
}

function playHitSfx() {
  audioSystem.playHitSfx();
}

function playCollectSfx() {
  audioSystem.playCollectSfx();
}

function triggerScreenShake(duration, strength) {
  effectsController.triggerScreenShake(duration, strength);
}

function spawnCollectEffect(x, y) {
  effectsController.spawnCollectEffect(x, y);
}

function spawnEnemyKillEffect(x, y) {
  effectsController.spawnEnemyKillEffect(x, y);
}

function spawnScorePopup(x, y, scoreValue, kind = 'collect') {
  effectsController.spawnScorePopup(x, y, scoreValue, kind);
}

function clearRabbitDeathAnimation() {
  effectsController.clearRabbitDeathAnimation();
}

function beginRespawnCountdown(livesLeft) {
  flowController.beginRespawnCountdown(livesLeft);
}

function triggerRabbitDeathSequence(isFinalElimination = false) {
  effectsController.triggerRabbitDeathSequence(isFinalElimination);
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
  clearRabbitDeathAnimation();
  clearGameOverKoanSequence();
  clearWinAffirmationSequence();
  clearStoryTypewriter();
  clearTitleCountdown();
  clearRespawnCountdown();
  setFinalMessageThemeActive(false);
  hideOverlay();
  setGamePhase('playing');
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
  state.player.spawnArmorTimer = PLAYER_SPAWN_ARMOR_DURATION;
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
  state.playerDeathEffectActive = false;
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

  const setDirectionalKeyDown = (key) => {
    if (key === 'ArrowUp') state.keys.delete('ArrowDown');
    if (key === 'ArrowDown') state.keys.delete('ArrowUp');
    if (key === 'ArrowLeft') state.keys.delete('ArrowRight');
    if (key === 'ArrowRight') state.keys.delete('ArrowLeft');
    state.keys.add(key);
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

    if ((event.key === 'Enter' || event.code === 'Space') && !state.running && state.gamePhase !== 'playing' && state.gamePhase !== 'title' && state.gamePhase !== 'respawn' && state.gamePhase !== 'respawn-reflection' && state.gamePhase !== 'lose-koan' && state.gamePhase !== 'win-affirmation') {
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
      setDirectionalKeyDown(controlKey);
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
      uiSystem.toggleFullscreen();
    });
  }

  if (clearJournalButtonEl) {
    clearJournalButtonEl.addEventListener('click', () => {
      uiSystem.clearSessionJournal();
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
  state.player.spawnArmorTimer = Math.max(0, state.player.spawnArmorTimer - dt);
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

  bounceCircle(state.target, dt, { GAME_WIDTH, GAME_HEIGHT, clamp });
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
    bounceCircle(hazard, dt, { GAME_WIDTH, GAME_HEIGHT, clamp });
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

    if (state.player.spawnArmorTimer > 0) {
      continue;
    }

    if (intersects(state.player, hazard)) {
      state.lives -= 1;
      updateHud();

      triggerRabbitDeathSequence(state.lives <= 0);

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

function drawPixelPasture(vertexData, offset, offsetX = 0, offsetY = 0, timeSeconds = 0) {
  return renderDrawPixelPasture(vertexData, offset, offsetX, offsetY, timeSeconds);
}


function drawWolfHead(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0, isFalling = false, tumbleAngle = 0, showKnockoutEyes = false, knockoutProgress = 0) {
  return renderDrawWolfHead(vertexData, offset, centerX, centerY, size, offsetX, offsetY, isFalling, tumbleAngle, showKnockoutEyes, knockoutProgress);
}


function drawCarrot(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0) {
  return renderDrawCarrot(vertexData, offset, centerX, centerY, size, offsetX, offsetY);
}


function getRabbitAnimationSample(textureWidth) {
  return renderGetRabbitAnimationSample(state, textureWidth);
}


function render(timestamp) {
  if (!gpu && !canvasFallbackRenderer) {
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

  if (canvasFallbackRenderer) {
    canvasFallbackRenderer.drawFrame({
      state,
      timeSeconds: timestamp * 0.001,
      shakeX,
      shakeY,
      getShotLength,
      getRabbitAnimationSample
    });

    requestAnimationFrame(render);
    return;
  }

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

  if (!state.playerDeathEffectActive) {
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
  }
  pass.end();

  gpu.device.queue.submit([encoder.finish()]);
  requestAnimationFrame(render);
}

function showGraphicsUnsupportedState(error) {
  console.error(error);

  const unsupportedMessage = [
    'This browser does not support WebGPU yet.',
    '',
    'Try Chrome or Edge on desktop with WebGPU enabled.'
  ].join('\n');

  showOverlay('Graphics Backend Unsupported', unsupportedMessage, 'Unavailable');
  if (overlayButtonEl) {
    overlayButtonEl.style.display = 'none';
  }

  setStatus('WebGPU unavailable in this browser.');
}

function setFallbackModeBadgeVisible(isVisible) {
  if (!stageWrapEl) {
    return;
  }

  if (!fallbackModeBadgeEl) {
    fallbackModeBadgeEl = document.createElement('div');
    fallbackModeBadgeEl.className = 'setting-btn';
    fallbackModeBadgeEl.textContent = 'Renderer: Canvas Compatibility';
    fallbackModeBadgeEl.style.position = 'absolute';
    fallbackModeBadgeEl.style.top = '10px';
    fallbackModeBadgeEl.style.right = '10px';
    fallbackModeBadgeEl.style.zIndex = '6';
    fallbackModeBadgeEl.style.pointerEvents = 'none';
    fallbackModeBadgeEl.style.opacity = '0.92';
    stageWrapEl.appendChild(fallbackModeBadgeEl);
  }

  fallbackModeBadgeEl.style.display = isVisible ? 'inline-flex' : 'none';
}

async function start() {
  setupInput();
  loadHighScore();
  uiSystem.loadSettings();
  uiSystem.loadSessionJournal();
  uiSystem.renderSessionJournal();
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
    canvasFallbackRenderer = null;
    setFallbackModeBadgeVisible(false);
    showStoryIntro();
    requestAnimationFrame(render);
  } catch (error) {
    try {
      canvasFallbackRenderer = await createCanvasFallbackRenderer({ canvas });
      gpu = null;
      setFallbackModeBadgeVisible(true);
      setStatus('WebGPU unavailable. Running Canvas compatibility mode.');
      showStoryIntro();
      requestAnimationFrame(render);
    } catch {
      setFallbackModeBadgeVisible(false);
      showGraphicsUnsupportedState(error);
    }
  }
}

start();
