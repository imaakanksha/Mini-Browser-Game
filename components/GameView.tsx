
import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Point, Direction, IParticle, ComboState } from '../types';
import { GAME_CONFIG } from '../constants';

interface GameViewProps {
  isActive: boolean;
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
}

export interface GameViewHandle {
  changeDirection: (dir: Direction) => void;
}

/**
 * ObjectPool manages reusable particle objects.
 * Performance optimization: Prevents GC thrashing.
 */
class ParticlePool {
  private pool: IParticle[] = [];

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createNew());
    }
  }

  private createNew(): IParticle {
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, active: false, color: '', size: 0 };
  }

  public get(): IParticle | null {
    const p = this.pool.find(i => !i.active);
    if (p) return p;
    return null; // Cap reached
  }

  public release(p: IParticle) {
    p.active = false;
  }

  public getActive(): IParticle[] {
    return this.pool.filter(p => p.active);
  }
}

const GameView = forwardRef<GameViewHandle, GameViewProps>(({ isActive, onGameOver, onScoreChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poolRef = useRef<ParticlePool>(new ParticlePool(GAME_CONFIG.PARTICLES.POOL_SIZE));
  
  // Encapsulated game state reference
  const stateRef = useRef({
    snake: [] as Point[],
    food: { x: 0, y: 0 } as Point,
    powerUp: null as Point | null,
    powerUpExpiry: 0,
    direction: Direction.RIGHT,
    nextDirection: Direction.RIGHT,
    score: 0,
    lastTick: 0,
    startTime: 0,
    speed: GAME_CONFIG.SNAKE.INITIAL_SPEED as number,
    combo: null as ComboState | null,
    frameCount: 0
  });

  // Expose direction control to the parent App component
  useImperativeHandle(ref, () => ({
    changeDirection: (dir: Direction) => {
      const cur = stateRef.current.direction;
      if (dir === Direction.UP && cur !== Direction.DOWN) stateRef.current.nextDirection = Direction.UP;
      if (dir === Direction.DOWN && cur !== Direction.UP) stateRef.current.nextDirection = Direction.DOWN;
      if (dir === Direction.LEFT && cur !== Direction.RIGHT) stateRef.current.nextDirection = Direction.LEFT;
      if (dir === Direction.RIGHT && cur !== Direction.LEFT) stateRef.current.nextDirection = Direction.RIGHT;
    }
  }));

  const generatePoint = (snake: Point[]): Point => {
    let point: Point;
    let attempts = 0;
    const maxAttempts = 100;
    while (attempts < maxAttempts) {
      point = {
        x: Math.floor(Math.random() * GAME_CONFIG.GRID.TILE_COUNT),
        y: Math.floor(Math.random() * GAME_CONFIG.GRID.TILE_COUNT)
      };
      if (!snake.some(s => s.x === point.x && s.y === point.y)) return point;
      attempts++;
    }
    return { x: 0, y: 0 }; // Fallback
  };

  const spawnExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < GAME_CONFIG.PARTICLES.COUNT_PER_EXPLOSION; i++) {
      const p = poolRef.current.get();
      if (p) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 8;
        p.vy = (Math.random() - 0.5) * 8;
        p.life = 1.0;
        p.color = color;
        p.size = Math.random() * 4 + 2;
      }
    }
  };

  const resetGame = useCallback(() => {
    const initialSnake: Point[] = [];
    for (let i = 0; i < GAME_CONFIG.SNAKE.INITIAL_LENGTH; i++) {
      initialSnake.push({ 
        x: GAME_CONFIG.SNAKE.INITIAL_POS.x - i, 
        y: GAME_CONFIG.SNAKE.INITIAL_POS.y 
      });
    }

    stateRef.current = {
      snake: initialSnake,
      food: generatePoint(initialSnake),
      powerUp: null,
      powerUpExpiry: 0,
      direction: Direction.RIGHT,
      nextDirection: Direction.RIGHT,
      score: 0,
      lastTick: performance.now(),
      startTime: Date.now(),
      speed: GAME_CONFIG.SNAKE.INITIAL_SPEED,
      combo: null,
      frameCount: 0
    };
    onScoreChange(0);
  }, [onScoreChange]);

  const update = useCallback(() => {
    const s = stateRef.current;
    s.direction = s.nextDirection;
    const head = { ...s.snake[0] };

    switch (s.direction) {
      case Direction.UP: head.y -= 1; break;
      case Direction.DOWN: head.y += 1; break;
      case Direction.LEFT: head.x -= 1; break;
      case Direction.RIGHT: head.x += 1; break;
    }

    if (head.x < 0 || head.x >= GAME_CONFIG.GRID.TILE_COUNT || head.y < 0 || head.y >= GAME_CONFIG.GRID.TILE_COUNT ||
        s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      onGameOver(s.score);
      return;
    }

    const newSnake = [head, ...s.snake];
    const now = performance.now();

    if (head.x === s.food.x && head.y === s.food.y) {
      let basePoints = 10;
      if (s.combo && now - s.combo.lastTime < GAME_CONFIG.UI.COMBO_WINDOW) {
        s.combo.count++;
        s.combo.opacity = 1.0;
        basePoints += s.combo.count * 5;
      } else {
        s.combo = { count: 1, lastTime: now, x: head.x, y: head.y, opacity: 1.0 };
      }
      s.combo.lastTime = now;

      s.score += basePoints;
      onScoreChange(s.score);
      spawnExplosion(s.food.x, s.food.y, GAME_CONFIG.COLORS.FOOD);
      s.food = generatePoint(newSnake);
      s.speed = Math.max(GAME_CONFIG.SNAKE.MIN_SPEED, s.speed - GAME_CONFIG.SNAKE.SPEED_INCREMENT);

      if (s.score % GAME_CONFIG.POWERUPS.SPAWN_SCORE_INTERVAL === 0 && Math.random() < GAME_CONFIG.POWERUPS.PROBABILITY) {
        s.powerUp = generatePoint(newSnake);
        s.powerUpExpiry = now + GAME_CONFIG.POWERUPS.DURATION;
      }
    } else if (s.powerUp && head.x === s.powerUp.x && head.y === s.powerUp.y) {
      s.score += 50;
      onScoreChange(s.score);
      spawnExplosion(s.powerUp.x, s.powerUp.y, GAME_CONFIG.COLORS.POWERUP);
      if (newSnake.length > 5) newSnake.splice(-3);
      s.speed += 20; 
      s.powerUp = null;
    } else {
      newSnake.pop();
    }

    s.snake = newSnake;
    if (s.powerUp && now > s.powerUpExpiry) s.powerUp = null;
  }, [onGameOver, onScoreChange]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    const s = stateRef.current;
    const tileSize = size / GAME_CONFIG.GRID.TILE_COUNT;
    
    ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = GAME_CONFIG.COLORS.GRID;
    ctx.lineWidth = GAME_CONFIG.GRID.LINE_WIDTH;
    for (let i = 0; i <= GAME_CONFIG.GRID.TILE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0); ctx.lineTo(i * tileSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * tileSize); ctx.lineTo(size, i * tileSize);
      ctx.stroke();
    }

    poolRef.current.getActive().forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x * tileSize + tileSize/2, p.y * tileSize + tileSize/2, p.size, p.size);
      p.x += p.vx * 0.02;
      p.y += p.vy * 0.02;
      p.life -= GAME_CONFIG.PARTICLES.FADE_SPEED;
      if (p.life <= 0) poolRef.current.release(p);
    });
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 15;
    ctx.shadowColor = GAME_CONFIG.COLORS.FOOD;
    ctx.fillStyle = GAME_CONFIG.COLORS.FOOD;
    ctx.beginPath();
    ctx.arc(s.food.x * tileSize + tileSize/2, s.food.y * tileSize + tileSize/2, tileSize/3, 0, Math.PI * 2);
    ctx.fill();

    if (s.powerUp) {
      ctx.shadowColor = GAME_CONFIG.COLORS.POWERUP;
      ctx.fillStyle = GAME_CONFIG.COLORS.POWERUP;
      ctx.beginPath();
      ctx.arc(s.powerUp.x * tileSize + tileSize/2, s.powerUp.y * tileSize + tileSize/2, tileSize/2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    s.snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      ctx.shadowBlur = isHead ? 20 : 5;
      const color = isHead ? GAME_CONFIG.COLORS.SNAKE_HEAD : GAME_CONFIG.COLORS.SNAKE_BODY;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(seg.x * tileSize + 2, seg.y * tileSize + 2, tileSize - 4, tileSize - 4, isHead ? 8 : 4);
      ctx.fill();
    });

    if (s.combo && s.combo.opacity > 0) {
      ctx.fillStyle = `rgba(0, 242, 255, ${s.combo.opacity})`;
      ctx.font = '700 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${s.combo.count}`, s.combo.x * tileSize + tileSize/2, (s.combo.y - 1) * tileSize);
      s.combo.opacity -= 0.01;
    }

    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dim = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.7);
      canvas.width = dim;
      canvas.height = dim;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleKey = (e: KeyboardEvent) => {
      const cur = stateRef.current.direction;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (cur !== Direction.DOWN) stateRef.current.nextDirection = Direction.UP; break;
        case 'ArrowDown': case 's': if (cur !== Direction.UP) stateRef.current.nextDirection = Direction.DOWN; break;
        case 'ArrowLeft': case 'a': if (cur !== Direction.RIGHT) stateRef.current.nextDirection = Direction.LEFT; break;
        case 'ArrowRight': case 'd': if (cur !== Direction.LEFT) stateRef.current.nextDirection = Direction.RIGHT; break;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);

    if (isActive) resetGame();

    let ani: number;
    const loop = (t: number) => {
      if (isActive) {
        if (t - stateRef.current.lastTick >= stateRef.current.speed) {
          update();
          stateRef.current.lastTick = t;
        }
      }
      draw(ctx, canvas.width);
      ani = requestAnimationFrame(loop);
    };
    ani = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(ani);
    };
  }, [isActive, update, draw, resetGame]);

  return (
    <div className="relative p-2 rounded-[2rem] border-4 border-cyan-500/30 bg-black">
      <canvas 
        ref={canvasRef} 
        tabIndex={0} 
        aria-label="Neon Slither Snake Game Area" 
        className="block rounded-3xl"
      />
    </div>
  );
});

export default GameView;
