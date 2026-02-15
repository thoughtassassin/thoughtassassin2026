import { clamp } from './math-utils.js';
import { writeRectWH } from './render-primitives.js';
import {
  CARROT_RENDER_SCALE,
  GAME_HEIGHT,
  GAME_WIDTH,
  RABBIT_FRAME_COLUMNS,
  RABBIT_FRAME_HEIGHT,
  RABBIT_FRAME_WIDTH,
  RABBIT_FRAME_X,
  STAGE_CARD_DURATION,
  WOLF_RENDER_SCALE
} from './game-constants.js';
import { RABBIT_ANIMATIONS } from './game-content.js';

export function drawArcadeStageCard(vertexData, offset, timer, offsetX = 0, offsetY = 0) {
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

export function drawPixelPasture(vertexData, offset, offsetX = 0, offsetY = 0, timeSeconds = 0) {
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
    offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, (y1 + y2) / 2, GAME_WIDTH, Math.max(4, y2 - y1 + 1), blend, offsetX, offsetY);
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
          offset = writeRectWH(vertexData, offset, centerX + px, centerY + py, pixelSize, pixelSize, color, offsetX, offsetY);
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

  const rayAngles = [-0.38, -0.12, 0.16, 0.44, 0.72, 1.0, 1.28, 1.56, 1.84, 2.12, 2.4, 2.68, 2.96, 3.24, 3.52, 3.8, 4.08, 4.36, 4.64, 4.92, 5.2, 5.48, 5.76, 6.04];
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
        const rayFade = 0.8 + outward * 0.16 + Math.abs(branch) * 0.25;
        const rayColor = mixColor(sunRayPulse, sunRayEdgeTone, rayFade);
        offset = writeRectWH(vertexData, offset, px, py, 1, 1, rayColor, offsetX, offsetY);
      }
    }
  }

  const cloudBands = [[598, 46, 248, 18], [696, 40, 214, 16], [756, 66, 172, 12], [486, 86, 144, 14], [722, 104, 204, 15]];
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
        const seamShade = mixColor(textureMid, textureDark, clamp(0.14 + seamT * 0.42 + t * 0.2, 0, 0.8));
        offset = writeRectWH(vertexData, offset, seamX, y, seamW, 1, seamShade, offsetX, offsetY);

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
      offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2 + xShift, centerY - bandHeight / 2 + row, Math.max(80, rowWidth * widthNoise), 1, color, offsetX, offsetY);
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
        offset = writeRectWH(vertexData, offset, x, y, 2, 1, warmFleck, offsetX, offsetY);
      }
    }
  }

  offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, 287, GAME_WIDTH * 0.9, 2, mixColor(lowHaze, horizonMid, 0.45), offsetX, offsetY);

  const groundTopY = 284;
  const groundBottomY = 540;
  const groundBandCount = 24;
  for (let i = 0; i < groundBandCount; i += 1) {
    const t = i / (groundBandCount - 1);
    const blend = t < 0.46 ? mixColor(fieldFar, fieldMid, t / 0.46) : mixColor(fieldMid, fieldNear, (t - 0.46) / 0.54);
    const y1 = groundTopY + ((groundBottomY - groundTopY) * i) / groundBandCount;
    const y2 = groundTopY + ((groundBottomY - groundTopY) * (i + 1)) / groundBandCount;
    offset = writeRectWH(vertexData, offset, GAME_WIDTH / 2, (y1 + y2) / 2, GAME_WIDTH, Math.max(4, y2 - y1 + 1), blend, offsetX, offsetY);
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

  const shrubs = [[88, 430], [132, 448], [176, 420], [222, 446], [264, 432], [620, 412], [686, 428], [752, 442], [826, 420], [892, 438], [714, 510], [788, 498], [858, 520]];
  for (const [x, y] of shrubs) {
    offset = writeRectWH(vertexData, offset, x, y + 3, 15, 8, shrubDark, offsetX, offsetY);
    offset = writeRectWH(vertexData, offset, x, y, 19, 10, shrubLight, offsetX, offsetY);
  }

  return offset;
}

export function drawWolfSkull(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0, tumbleAngle = 0) {
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
    offset = writeRectWH(vertexData, offset, centerX + rotatedX * unit, centerY + rotatedY * unit, unit, unit, color, offsetX, offsetY);
  }

  return offset;
}

export function drawWolfHead(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0, isFalling = false, tumbleAngle = 0, showKnockoutEyes = false, knockoutProgress = 0) {
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
    [0, 8, outline], [0, 9, outline],
    [-8, -7, outline], [8, -7, outline],
    [-9, -4, outline], [9, -4, outline],
    [-7, 1, outline], [7, 1, outline]
  ];

  for (const [gridX, gridY, color] of pixels) {
    offset = writeRectWH(vertexData, offset, centerX + gridX * unit, centerY + gridY * unit, unit, unit, color, offsetX, offsetY);
  }

  if (showKnockoutEyes) {
    const xEyePixels = [[-3, -4], [-2, -3], [-1, -2], [-3, -2], [-1, -4], [1, -4], [2, -3], [3, -2], [1, -2], [3, -4]];
    for (const [gridX, gridY] of xEyePixels) {
      offset = writeRectWH(vertexData, offset, centerX + gridX * unit, centerY + gridY * unit, unit, unit, xEye, offsetX, offsetY);
    }
  }

  return offset;
}

export function drawCarrot(vertexData, offset, centerX, centerY, size, offsetX = 0, offsetY = 0) {
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
    offset = writeRectWH(vertexData, offset, centerX + gridX * unit, centerY + gridY * unit, unit, unit, color, offsetX, offsetY);
  }

  return offset;
}

export function getRabbitAnimationSample(state, textureWidth) {
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
