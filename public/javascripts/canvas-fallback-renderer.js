import { clamp } from './math-utils.js';
import {
  drawCarrot as renderDrawCarrot,
  drawPixelPasture as renderDrawPixelPasture,
  drawWolfHead as renderDrawWolfHead
} from './game-renderer.js';
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

  const maxVertices = 6 * 24576;
  const geometryVertexData = new Float32Array(maxVertices * 6);

  let rabbitImage = null;
  try {
    rabbitImage = await loadImage('images/rabbit_frames.png');
  } catch {
    rabbitImage = null;
  }

  const drawBackground = (timeSeconds, offsetX, offsetY) => {
    drawRendererGeometry((vertexData, offset) => renderDrawPixelPasture(vertexData, offset, offsetX, offsetY, timeSeconds));
  };

  const drawCarrot = (x, y, size, offsetX, offsetY) => {
    drawRendererGeometry((vertexData, offset) => renderDrawCarrot(vertexData, offset, x, y, size, offsetX, offsetY));
  };

  const drawHazard = (hazard, offsetX, offsetY) => {
    const knockoutEyesTimer = hazard.knockoutEyesTimer || 0;
    drawRendererGeometry((vertexData, offset) => renderDrawWolfHead(
      vertexData,
      offset,
      hazard.x,
      hazard.y,
      hazard.size,
      offsetX,
      offsetY,
      hazard.isFalling,
      hazard.fallSpin || 0,
      knockoutEyesTimer > 0,
      1 - clamp(knockoutEyesTimer / HAZARD_KNOCKOUT_X_EYES_DURATION, 0, 1)
    ));
  };

  const drawRendererGeometry = (drawCallback) => {
    let offset = 0;
    offset = drawCallback(geometryVertexData, offset);

    for (let index = 0; index < offset; index += 18) {
      const x1 = clipToCanvasX(geometryVertexData[index]);
      const y1 = clipToCanvasY(geometryVertexData[index + 1]);
      const x2 = clipToCanvasX(geometryVertexData[index + 6]);
      const y2 = clipToCanvasY(geometryVertexData[index + 7]);
      const x3 = clipToCanvasX(geometryVertexData[index + 12]);
      const y3 = clipToCanvasY(geometryVertexData[index + 13]);

      const r = geometryVertexData[index + 2];
      const g = geometryVertexData[index + 3];
      const b = geometryVertexData[index + 4];
      const a = geometryVertexData[index + 5];

      context.fillStyle = `rgba(${Math.round(clamp(r, 0, 1) * 255)}, ${Math.round(clamp(g, 0, 1) * 255)}, ${Math.round(clamp(b, 0, 1) * 255)}, ${clamp(a, 0, 1)})`;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineTo(x3, y3);
      context.closePath();
      context.fill();
    }
  };

  const clipToCanvasX = (x) => ((x + 1) * 0.5) * GAME_WIDTH;
  const clipToCanvasY = (y) => ((1 - y) * 0.5) * GAME_HEIGHT;

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

    return;
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
    context.fillStyle = 'rgb(8, 13, 31)';
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

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
