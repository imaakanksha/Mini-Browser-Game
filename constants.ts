
/**
 * Global Game Configuration
 * Adheres to "No Magic Numbers" principle.
 */
export const GAME_CONFIG = {
  DEBUG: true, // Enable TestSuite integration tests
  GRID: {
    TILE_COUNT: 20,
    LINE_WIDTH: 1,
  },
  SNAKE: {
    INITIAL_SPEED: 140, // ms per tick
    MIN_SPEED: 45,
    SPEED_INCREMENT: 3,
    INITIAL_LENGTH: 3,
    INITIAL_POS: { x: 5, y: 10 },
  },
  POWERUPS: {
    DURATION: 5000,
    SPAWN_SCORE_INTERVAL: 100,
    PROBABILITY: 0.8,
  },
  PARTICLES: {
    POOL_SIZE: 100,
    COUNT_PER_EXPLOSION: 15,
    FADE_SPEED: 0.02,
  },
  UI: {
    COMBO_WINDOW: 3000,
  },
  COLORS: {
    SNAKE_HEAD: '#00f2ff',
    SNAKE_BODY: '#00a8ff',
    FOOD: '#ff00ff',
    POWERUP: '#ffff00',
    BACKGROUND: '#050505',
    GRID: '#111111',
    ACCENT: '#00f2ff',
    PARTICLES: ['#00f2ff', '#ff00ff', '#ffff00', '#39ff14'],
  }
} as const;
