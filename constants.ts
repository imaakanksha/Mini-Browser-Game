
export const COLORS = {
  SNAKE_HEAD: '#00f2ff', // Neon Cyan
  SNAKE_BODY: '#00a8ff',
  FOOD: '#ff00ff',      // Neon Pink
  POWERUP: '#ffff00',   // Bright Yellow
  BACKGROUND: '#050505',
  GRID: '#111111',
  TEXT_NEON: '#00f2ff',
  PARTICLES: ['#00f2ff', '#ff00ff', '#ffff00', '#39ff14']
};

export const GAME_CONFIG = {
  INITIAL_SPEED: 140, // ms per tick
  MIN_SPEED: 50,
  SPEED_INCREMENT: 3,
  TILE_COUNT: 20, // Grid size
  POWERUP_DURATION: 5000, // 5 seconds
  COMBO_WINDOW: 3000, // 3 seconds
  PARTICLE_COUNT: 12
};
