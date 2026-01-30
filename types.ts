
/**
 * Represents a 2D coordinate on the grid.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Entity properties for the Object Pool management.
 */
export interface IParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  active: boolean;
  color: string;
  size: number;
}

/**
 * Multiplier state for consecutive captures.
 */
export interface ComboState {
  count: number;
  lastTime: number;
  x: number;
  y: number;
  opacity: number;
}

/**
 * Valid movement directions.
 */
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

/**
 * Finite State Machine states for the App.
 */
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

/**
 * Leaderboard Entry structure.
 */
export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  timestamp: number;
}
