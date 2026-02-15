import { clamp } from './math-utils.js';
import {
  FIRE_THICKNESS,
  GAME_HEIGHT,
  GAME_WIDTH,
  HAZARD_KNOCKOUT_X_EYES_DURATION,
  HIT_FLASH_DURATION
} from './game-constants.js';

export async function createCanvasFallbackRenderer({ canvas }) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Canvas 2D rendering context unavailable.');
  }

  context.imageSmoothingEnabled = false;

  let rabbitImage = null;
  try {
    rabbitImage = await loadImage('images/rabbit_frames.png');
  } catch {
    rabbitImage = null;
  }

  const drawBackground = (timeSeconds, offsetX, offsetY) => {
    const horizonY = GAME_HEIGHT * 0.63;

    const skyGradient = context.createLinearGradient(0, offsetY, 0, horizonY + offsetY);
    skyGradient.addColorStop(0, '#4f4a7a');
    skyGradient.addColorStop(0.56, '#8b5a64');
    skyGradient.addColorStop(1, '#dd9b5a');
    context.fillStyle = skyGradient;
    context.fillRect(offsetX, offsetY, GAME_WIDTH, horizonY);

    const groundGradient = context.createLinearGradient(0, horizonY + offsetY, 0, GAME_HEIGHT + offsetY);
    groundGradient.addColorStop(0, '#72683d');
    groundGradient.addColorStop(1, '#473f26');
    context.fillStyle = groundGradient;
    context.fillRect(offsetX, horizonY + offsetY, GAME_WIDTH, GAME_HEIGHT - horizonY);

    const sunX = 640 + offsetX;
    const sunY = 76 + offsetY;
    const sunPulse = 1 + Math.sin(timeSeconds * 1.3) * 0.04;
    context.fillStyle = '#ffe39a';
    context.beginPath();
    context.arc(sunX, sunY, 42 * sunPulse, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ffd17d';
    context.beginPath();
    context.arc(sunX, sunY, 24, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#57496f';
    context.beginPath();
    context.moveTo(offsetX, horizonY + 10 + offsetY);
    context.lineTo(180 + offsetX, 196 + offsetY);
    context.lineTo(350 + offsetX, horizonY + 10 + offsetY);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(250 + offsetX, horizonY + 14 + offsetY);
    context.lineTo(470 + offsetX, 182 + offsetY);
    context.lineTo(690 + offsetX, horizonY + 14 + offsetY);
    context.closePath();
    context.fill();

    context.fillStyle = '#68557d';
    context.beginPath();
    context.moveTo(520 + offsetX, horizonY + 8 + offsetY);
    context.lineTo(760 + offsetX, 198 + offsetY);
    context.lineTo(980 + offsetX, horizonY + 8 + offsetY);
    context.closePath();
    context.fill();
  };

  const drawCarrot = (x, y, size, offsetX, offsetY) => {
    const centerX = x + offsetX;
    const centerY = y + offsetY;

    context.fillStyle = '#f7941d';
    context.beginPath();
    context.moveTo(centerX, centerY + size * 1.1);
    context.lineTo(centerX - size * 0.52, centerY - size * 0.56);
    context.lineTo(centerX + size * 0.52, centerY - size * 0.56);
    context.closePath();
    context.fill();

    context.fillStyle = '#90c94c';
    context.fillRect(centerX - 2, centerY - size * 0.95, 4, size * 0.4);
    context.fillRect(centerX - size * 0.38, centerY - size * 1.04, size * 0.2, size * 0.38);
    context.fillRect(centerX + size * 0.18, centerY - size * 1.04, size * 0.2, size * 0.38);
  };

  const drawHazard = (hazard, offsetX, offsetY) => {
    const x = hazard.x + offsetX;
    const y = hazard.y + offsetY;

    context.save();
    context.translate(x, y);
    context.rotate(hazard.isFalling ? (hazard.fallSpin || 0) : 0);

    context.fillStyle = '#4d4d57';
    context.beginPath();
    context.arc(0, 0, hazard.size, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#6a6678';
    context.beginPath();
    context.arc(-hazard.size * 0.24, -hazard.size * 0.2, hazard.size * 0.42, 0, Math.PI * 2);
    context.fill();

    const showKnockoutEyes = (hazard.knockoutEyesTimer || 0) > 0;
    if (showKnockoutEyes) {
      context.strokeStyle = '#f5ecde';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-hazard.size * 0.44, -hazard.size * 0.24);
      context.lineTo(-hazard.size * 0.2, hazard.size * 0.02);
      context.moveTo(-hazard.size * 0.44, hazard.size * 0.02);
      context.lineTo(-hazard.size * 0.2, -hazard.size * 0.24);
      context.moveTo(hazard.size * 0.2, -hazard.size * 0.24);
      context.lineTo(hazard.size * 0.44, hazard.size * 0.02);
      context.moveTo(hazard.size * 0.2, hazard.size * 0.02);
      context.lineTo(hazard.size * 0.44, -hazard.size * 0.24);
      context.stroke();

      const knockoutProgress = 1 - clamp((hazard.knockoutEyesTimer || 0) / HAZARD_KNOCKOUT_X_EYES_DURATION, 0, 1);
      context.strokeStyle = '#ffb05c';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, hazard.size * 0.25, hazard.size * 0.2 + knockoutProgress * 2, 0.2 * Math.PI, 0.8 * Math.PI);
      context.stroke();
    } else {
      context.fillStyle = '#f7f0df';
      context.beginPath();
      context.arc(-hazard.size * 0.28, -hazard.size * 0.1, hazard.size * 0.14, 0, Math.PI * 2);
      context.arc(hazard.size * 0.28, -hazard.size * 0.1, hazard.size * 0.14, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#131218';
      context.beginPath();
      context.arc(-hazard.size * 0.27, -hazard.size * 0.08, hazard.size * 0.07, 0, Math.PI * 2);
      context.arc(hazard.size * 0.27, -hazard.size * 0.08, hazard.size * 0.07, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  };

  const drawShot = (shot, getShotLength, offsetX, offsetY) => {
    const lifeRatio = clamp(shot.ttl / shot.maxTtl, 0, 1);
    const lineLength = getShotLength(shot);
    const x1 = shot.direction > 0 ? shot.x + offsetX : shot.x - lineLength + offsetX;
    const x2 = shot.direction > 0 ? shot.x + lineLength + offsetX : shot.x + offsetX;
    const y = shot.y + offsetY;

    context.strokeStyle = lifeRatio > 0.4 ? '#fff390' : '#ffa759';
    context.lineWidth = FIRE_THICKNESS;
    context.beginPath();
    context.moveTo(x1, y);
    context.lineTo(x2, y);
    context.stroke();
  };

  const drawRabbit = (state, getRabbitAnimationSample, offsetX, offsetY) => {
    if (state.playerDeathEffectActive) {
      return;
    }

    const player = state.player;

    if (rabbitImage) {
      const animationSample = getRabbitAnimationSample(rabbitImage.width);
      const frameRect = animationSample.frameRect;
      const drawX = player.x + offsetX;
      const drawY = player.y + offsetY;

      context.save();
      context.translate(drawX, drawY);

      if (player.facing < 0) {
        context.scale(-1, 1);
      }

      context.drawImage(
        rabbitImage,
        frameRect.x,
        frameRect.y,
        frameRect.width,
        frameRect.height,
        -player.drawWidth / 2,
        -player.drawHeight / 2,
        player.drawWidth,
        player.drawHeight
      );

      context.restore();
      return;
    }

    context.fillStyle = '#f5f2ea';
    context.beginPath();
    context.ellipse(player.x + offsetX, player.y + offsetY, player.drawWidth * 0.34, player.drawHeight * 0.46, 0, 0, Math.PI * 2);
    context.fill();
  };

  const drawCollectEffect = (effect, offsetX, offsetY) => {
    const life = clamp(effect.ttl / effect.maxTtl, 0, 1);
    const growth = 1 - life;
    const radius = 8 + growth * 28;

    context.strokeStyle = '#ffd466';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(effect.x + offsetX, effect.y + offsetY, radius, 0, Math.PI * 2);
    context.stroke();
  };

  const drawEnemyKillEffect = (effect, offsetX, offsetY) => {
    const life = clamp(effect.ttl / effect.maxTtl, 0, 1);
    const growth = 1 - life;
    const radius = 10 + growth * 20;

    context.strokeStyle = '#ff9f54';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(effect.x - radius + offsetX, effect.y + offsetY);
    context.lineTo(effect.x + radius + offsetX, effect.y + offsetY);
    context.moveTo(effect.x + offsetX, effect.y - radius + offsetY);
    context.lineTo(effect.x + offsetX, effect.y + radius + offsetY);
    context.stroke();
  };

  const drawHitFlash = (state, offsetX, offsetY) => {
    if (state.hitFlashTimer <= 0) {
      return;
    }

    const alpha = clamp(state.hitFlashTimer / HIT_FLASH_DURATION, 0, 1) * 0.22;
    context.fillStyle = `rgba(255, 245, 214, ${alpha})`;
    context.fillRect(offsetX, offsetY, GAME_WIDTH, GAME_HEIGHT);
  };

  const drawFrame = ({
    state,
    timeSeconds,
    shakeX,
    shakeY,
    getShotLength,
    getRabbitAnimationSample
  }) => {
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawBackground(timeSeconds, shakeX, shakeY);
    drawCarrot(state.target.x, state.target.y, state.target.size, shakeX, shakeY);

    for (const hazard of state.hazards) {
      if (!hazard.active) {
        continue;
      }
      drawHazard(hazard, shakeX, shakeY);
    }

    for (const shot of state.shots) {
      drawShot(shot, getShotLength, shakeX, shakeY);
    }

    for (const effect of state.collectEffects) {
      drawCollectEffect(effect, shakeX, shakeY);
    }

    for (const effect of state.enemyKillEffects) {
      drawEnemyKillEffect(effect, shakeX, shakeY);
    }

    drawRabbit(state, getRabbitAnimationSample, shakeX, shakeY);
    drawHitFlash(state, shakeX, shakeY);
  };

  return {
    drawFrame
  };
}

function loadImage(sourcePath) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${sourcePath}`));
    image.src = sourcePath;
  });
}
