const DEFAULT_GAME_WIDTH = 960;
const DEFAULT_GAME_HEIGHT = 540;

export function writeRect(
  vertexData,
  offset,
  centerX,
  centerY,
  size,
  color,
  offsetX = 0,
  offsetY = 0,
  gameWidth = DEFAULT_GAME_WIDTH,
  gameHeight = DEFAULT_GAME_HEIGHT
) {
  const finalCenterX = centerX + offsetX;
  const finalCenterY = centerY + offsetY;
  const x1 = (finalCenterX - size) / gameWidth * 2 - 1;
  const y1 = 1 - (finalCenterY - size) / gameHeight * 2;
  const x2 = (finalCenterX + size) / gameWidth * 2 - 1;
  const y2 = 1 - (finalCenterY + size) / gameHeight * 2;

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

export function writeRectWH(
  vertexData,
  offset,
  centerX,
  centerY,
  width,
  height,
  color,
  offsetX = 0,
  offsetY = 0,
  gameWidth = DEFAULT_GAME_WIDTH,
  gameHeight = DEFAULT_GAME_HEIGHT
) {
  const finalCenterX = centerX + offsetX;
  const finalCenterY = centerY + offsetY;
  const x1 = (finalCenterX - width / 2) / gameWidth * 2 - 1;
  const y1 = 1 - (finalCenterY - height / 2) / gameHeight * 2;
  const x2 = (finalCenterX + width / 2) / gameWidth * 2 - 1;
  const y2 = 1 - (finalCenterY + height / 2) / gameHeight * 2;

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

export function writeSprite(
  vertexData,
  centerX,
  centerY,
  drawWidth,
  drawHeight,
  frameRect,
  textureWidth,
  textureHeight,
  offsetX = 0,
  offsetY = 0,
  gameWidth = DEFAULT_GAME_WIDTH,
  gameHeight = DEFAULT_GAME_HEIGHT
) {
  const finalCenterX = centerX + offsetX;
  const finalCenterY = centerY + offsetY;
  const halfWidth = drawWidth / 2;
  const halfHeight = drawHeight / 2;
  const x1 = (finalCenterX - halfWidth) / gameWidth * 2 - 1;
  const y1 = 1 - (finalCenterY - halfHeight) / gameHeight * 2;
  const x2 = (finalCenterX + halfWidth) / gameWidth * 2 - 1;
  const y2 = 1 - (finalCenterY + halfHeight) / gameHeight * 2;

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
