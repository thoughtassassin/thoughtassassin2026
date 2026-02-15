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

    context.fillStyle = 'rgba(255, 199, 119, 0.22)';
    context.fillRect(offsetX, horizonY - 18 + offsetY, GAME_WIDTH, 22);

    const cloudDrift = Math.sin(timeSeconds * 0.18) * 22;
    drawCloudBank(180 + cloudDrift + offsetX, 88 + offsetY, 92, 26);
    drawCloudBank(420 - cloudDrift * 0.6 + offsetX, 64 + offsetY, 118, 30);
    drawCloudBank(760 + cloudDrift * 0.8 + offsetX, 98 + offsetY, 104, 26);

    drawGroundTexture(horizonY + offsetY, offsetX, offsetY, timeSeconds);
  };

  const drawCloudBank = (x, y, width, height) => {
    context.fillStyle = 'rgba(214, 171, 153, 0.55)';
    context.beginPath();
    context.ellipse(x - width * 0.2, y + 2, width * 0.26, height * 0.42, 0, 0, Math.PI * 2);
    context.ellipse(x, y, width * 0.32, height * 0.5, 0, 0, Math.PI * 2);
    context.ellipse(x + width * 0.24, y + 4, width * 0.28, height * 0.4, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = 'rgba(245, 206, 172, 0.34)';
    context.beginPath();
    context.ellipse(x, y - 4, width * 0.24, height * 0.26, 0, 0, Math.PI * 2);
    context.fill();
  };

  const drawGroundTexture = (horizonY, offsetX, offsetY, timeSeconds) => {
    context.strokeStyle = 'rgba(111, 142, 70, 0.24)';
    context.lineWidth = 1;
    for (let i = 0; i < 22; i += 1) {
      const y = horizonY + 8 + i * 9;
      const wobble = Math.sin(timeSeconds * 0.4 + i * 0.38) * 6;
      context.beginPath();
      context.moveTo(offsetX + wobble, y);
      context.quadraticCurveTo(offsetX + GAME_WIDTH * 0.45, y + 4, offsetX + GAME_WIDTH + wobble * 0.6, y - 2);
      context.stroke();
    }

    context.fillStyle = 'rgba(82, 112, 50, 0.5)';
    for (let x = 18; x < GAME_WIDTH; x += 28) {
      const bladeHeight = 10 + ((x / 7) % 9);
      context.beginPath();
      context.moveTo(x + offsetX, GAME_HEIGHT + offsetY - 2);
      context.lineTo(x - 3 + offsetX, GAME_HEIGHT + offsetY - bladeHeight);
      context.lineTo(x + 2 + offsetX, GAME_HEIGHT + offsetY - bladeHeight * 0.55);
      context.closePath();
      context.fill();
    }
  };

  const drawCarrot = (x, y, size, offsetX, offsetY) => {
    const centerX = x + offsetX;
    const centerY = y + offsetY;

    const bodyGradient = context.createLinearGradient(centerX, centerY - size, centerX, centerY + size * 1.2);
    bodyGradient.addColorStop(0, '#ffb247');
    bodyGradient.addColorStop(0.58, '#f88d28');
    bodyGradient.addColorStop(1, '#d86716');
    context.fillStyle = bodyGradient;
    context.beginPath();
    context.moveTo(centerX, centerY + size * 1.1);
    context.lineTo(centerX - size * 0.52, centerY - size * 0.56);
    context.lineTo(centerX + size * 0.52, centerY - size * 0.56);
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(255, 208, 132, 0.7)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(centerX - size * 0.05, centerY - size * 0.44);
    context.lineTo(centerX - size * 0.12, centerY + size * 0.72);
    context.stroke();

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

    const shellGradient = context.createRadialGradient(
      -hazard.size * 0.2,
      -hazard.size * 0.3,
      hazard.size * 0.2,
      0,
      0,
      hazard.size * 1.1
    );
    shellGradient.addColorStop(0, '#7b7589');
    shellGradient.addColorStop(0.58, '#585464');
    shellGradient.addColorStop(1, '#363543');
    context.fillStyle = shellGradient;
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

      context.strokeStyle = '#de8f6e';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, hazard.size * 0.2, hazard.size * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
      context.stroke();
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

    let spriteDrawn = false;
    if (rabbitImage) {
      try {
        const animationSample = getRabbitAnimationSample(rabbitImage.width);
        const frameRect = animationSample.frameRect;
        const sourceX = frameRect.frameX;
        const sourceY = frameRect.frameY;
        const sourceWidth = frameRect.frameWidth;
        const sourceHeight = frameRect.frameHeight;
        const sourceIsValid =
          Number.isFinite(sourceX) &&
          Number.isFinite(sourceY) &&
          Number.isFinite(sourceWidth) &&
          Number.isFinite(sourceHeight) &&
          sourceWidth > 0 &&
          sourceHeight > 0 &&
          sourceX >= 0 &&
          sourceY >= 0 &&
          (sourceX + sourceWidth) <= rabbitImage.width &&
          (sourceY + sourceHeight) <= rabbitImage.height;

        if (sourceIsValid) {
          const drawX = player.x + offsetX;
          const drawY = player.y + offsetY;

          context.save();
          context.translate(drawX, drawY);

          if (player.facing < 0) {
            context.scale(-1, 1);
          }

          context.drawImage(
            rabbitImage,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            -player.drawWidth / 2,
            -player.drawHeight / 2,
            player.drawWidth,
            player.drawHeight
          );

          context.restore();
          spriteDrawn = true;
        }
      } catch {
        spriteDrawn = false;
      }
    }

    if (!spriteDrawn) {
      drawProceduralRabbit(player, offsetX, offsetY);
      return;
    }

    context.strokeStyle = 'rgba(255, 248, 226, 0.45)';
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(player.x + offsetX, player.y + offsetY, player.drawWidth * 0.33, player.drawHeight * 0.43, 0, 0, Math.PI * 2);
    context.stroke();
  };

  const drawProceduralRabbit = (player, offsetX, offsetY) => {
    const x = player.x + offsetX;
    const y = player.y + offsetY;
    const facing = player.facing < 0 ? -1 : 1;

    context.save();
    context.translate(x, y);
    if (facing < 0) {
      context.scale(-1, 1);
    }

    context.fillStyle = '#cfc8bf';
    context.beginPath();
    context.ellipse(0, 4, player.drawWidth * 0.34, player.drawHeight * 0.38, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#e6ddd1';
    context.beginPath();
    context.ellipse(player.drawWidth * 0.16, -player.drawHeight * 0.06, player.drawWidth * 0.2, player.drawHeight * 0.22, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ddd3c7';
    context.beginPath();
    context.ellipse(player.drawWidth * 0.12, -player.drawHeight * 0.36, player.drawWidth * 0.07, player.drawHeight * 0.2, 0.05, 0, Math.PI * 2);
    context.ellipse(player.drawWidth * 0.22, -player.drawHeight * 0.34, player.drawWidth * 0.06, player.drawHeight * 0.18, -0.03, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ffc1ba';
    context.beginPath();
    context.ellipse(player.drawWidth * 0.12, -player.drawHeight * 0.36, player.drawWidth * 0.03, player.drawHeight * 0.14, 0.05, 0, Math.PI * 2);
    context.ellipse(player.drawWidth * 0.22, -player.drawHeight * 0.34, player.drawWidth * 0.028, player.drawHeight * 0.13, -0.03, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#16151b';
    context.beginPath();
    context.arc(player.drawWidth * 0.2, -player.drawHeight * 0.08, 2.2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#f09b8e';
    context.beginPath();
    context.arc(player.drawWidth * 0.28, -player.drawHeight * 0.02, 2.4, 0, Math.PI * 2);
    context.fill();

    context.restore();
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

    context.fillStyle = 'rgba(255, 238, 151, 0.7)';
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const px = effect.x + offsetX + Math.cos(angle) * (radius * 0.5);
      const py = effect.y + offsetY + Math.sin(angle) * (radius * 0.5);
      context.fillRect(px - 1, py - 1, 2, 2);
    }
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
