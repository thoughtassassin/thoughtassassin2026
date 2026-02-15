export function createGameEffectsController({
  state,
  elements,
  constants,
  callbacks
}) {
  const { canvas, fxLayerEl } = elements;
  const {
    GAME_WIDTH,
    GAME_HEIGHT,
    CARROT_COLLECT_EFFECT_TTL,
    ENEMY_KILL_EFFECT_TTL,
    RABBIT_DEATH_ANIMATION_DURATION_MS,
    PLAYER_SPAWN_ARMOR_DURATION
  } = constants;

  const {
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
  } = callbacks;

  let rabbitDeathTimer = null;

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

  function mapWorldToFxLayer(x, y) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (x / GAME_WIDTH) * rect.width,
      y: (y / GAME_HEIGHT) * rect.height,
      width: rect.width
    };
  }

  function clearRabbitDeathAnimation() {
    if (rabbitDeathTimer !== null) {
      window.clearTimeout(rabbitDeathTimer);
      rabbitDeathTimer = null;
    }

    clearRespawnCountdown();
    clearRespawnReflectionSequence();
    clearWinAffirmationSequence();
    setContemplativeMode(false);
    setFinalMessageThemeActive(false);

    state.playerDeathEffectActive = false;
    if (fxLayerEl) {
      fxLayerEl.querySelectorAll('.rabbit-death-sequence').forEach((node) => node.remove());
    }
  }

  function spawnRabbitDeathAnimation(x, y, drawWidth) {
    if (!fxLayerEl) {
      return;
    }

    const mapped = mapWorldToFxLayer(x, y);
    const sequence = document.createElement('div');
    sequence.className = 'rabbit-death-sequence';
    sequence.style.left = `${mapped.x}px`;
    sequence.style.top = `${mapped.y}px`;
    const scaledWidth = (drawWidth / GAME_WIDTH) * mapped.width;
    sequence.style.setProperty('--rabbit-size', `${clamp(scaledWidth, 26, 74)}px`);
    sequence.innerHTML = '<div class="rabbit-death-sprite" aria-hidden="true">🐇</div><div class="rabbit-death-poof" aria-hidden="true">💨</div><div class="rabbit-death-angel" aria-hidden="true">👼</div>';
    fxLayerEl.appendChild(sequence);

    window.setTimeout(() => {
      sequence.remove();
    }, RABBIT_DEATH_ANIMATION_DURATION_MS + 120);
  }

  function triggerRabbitDeathSequence(isFinalElimination = false) {
    if (state.playerDeathEffectActive) {
      return;
    }

    state.playerDeathEffectActive = true;
    state.running = false;
    state.paused = false;
    state.keys.clear();
    setSoundtrackActive(false);
    spawnRabbitDeathAnimation(state.player.x, state.player.y, state.player.drawWidth);
    setStatus('Rabbit down...');

    rabbitDeathTimer = window.setTimeout(() => {
      rabbitDeathTimer = null;
      state.playerDeathEffectActive = false;
      if (isFinalElimination) {
        finishGame('lose');
        return;
      }

      state.player.x = 80;
      state.player.y = GAME_HEIGHT / 2;
      state.player.jumpVelocityY = 0;
      state.player.isJumping = false;
      state.player.jumpElapsed = 0;
      state.player.jumpStartY = state.player.y;
      state.player.hurtTimer = 0.35;
      state.player.spawnArmorTimer = PLAYER_SPAWN_ARMOR_DURATION;
      state.player.animationState = 'hurt';
      state.player.animationTime = 0;
      state.hitStopTimer = 0;
      beginRespawnCountdown(state.lives);
    }, RABBIT_DEATH_ANIMATION_DURATION_MS);
  }

  return {
    triggerScreenShake,
    spawnCollectEffect,
    spawnEnemyKillEffect,
    spawnScorePopup,
    clearRabbitDeathAnimation,
    triggerRabbitDeathSequence
  };
}
