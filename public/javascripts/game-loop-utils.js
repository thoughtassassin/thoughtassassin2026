export function intersects(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.size + b.size;
}

export function bounceCircle(entity, dt, { GAME_WIDTH, GAME_HEIGHT, clamp }) {
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
