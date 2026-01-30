
import React, { useRef, useEffect, useCallback } from 'react';
import { Point, Direction, Particle, Combo } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';

interface GameViewProps {
  isActive: boolean;
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
}

const GameView: React.FC<GameViewProps> = ({ isActive, onGameOver, onScoreChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [] as Point[],
    food: { x: 0, y: 0 } as Point,
    powerUp: null as Point | null,
    powerUpTimer: 0,
    direction: Direction.RIGHT,
    nextDirection: Direction.RIGHT,
    score: 0,
    lastTick: 0,
    speed: GAME_CONFIG.INITIAL_SPEED,
    particles: [] as Particle[],
    combo: null as Combo | null,
    frameCount: 0
  });

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
      stateRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const generatePoint = useCallback((snake: Point[]): Point => {
    let point: Point;
    while (true) {
      point = {
        x: Math.floor(Math.random() * GAME_CONFIG.TILE_COUNT),
        y: Math.floor(Math.random() * GAME_CONFIG.TILE_COUNT)
      };
      const onSnake = snake.some(segment => segment.x === point.x && segment.y === point.y);
      if (!onSnake) break;
    }
    return point;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    stateRef.current = {
      snake: initialSnake,
      food: generatePoint(initialSnake),
      powerUp: null,
      powerUpTimer: 0,
      direction: Direction.RIGHT,
      nextDirection: Direction.RIGHT,
      score: 0,
      lastTick: performance.now(),
      speed: GAME_CONFIG.INITIAL_SPEED,
      particles: [],
      combo: null,
      frameCount: 0
    };
    onScoreChange(0);
  }, [generatePoint, onScoreChange]);

  const update = useCallback(() => {
    const state = stateRef.current;
    state.direction = state.nextDirection;
    const head = { ...state.snake[0] };

    switch (state.direction) {
      case Direction.UP: head.y -= 1; break;
      case Direction.DOWN: head.y += 1; break;
      case Direction.LEFT: head.x -= 1; break;
      case Direction.RIGHT: head.x += 1; break;
    }

    // Collision checks
    if (head.x < 0 || head.x >= GAME_CONFIG.TILE_COUNT || head.y < 0 || head.y >= GAME_CONFIG.TILE_COUNT ||
        state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      onGameOver(state.score);
      return;
    }

    const newSnake = [head, ...state.snake];
    const now = performance.now();

    // Check Food
    if (head.x === state.food.x && head.y === state.food.y) {
      let points = 10;
      
      // Combo logic
      if (state.combo && now - state.combo.lastTime < GAME_CONFIG.COMBO_WINDOW) {
        state.combo.count++;
        state.combo.lastTime = now;
        state.combo.opacity = 1.0;
        points += state.combo.count * 5;
      } else {
        state.combo = { count: 1, lastTime: now, x: head.x, y: head.y, opacity: 1.0 };
      }

      state.score += points;
      onScoreChange(state.score);
      createParticles(state.food.x, state.food.y, COLORS.FOOD);
      state.food = generatePoint(newSnake);
      
      // Speed Increase
      if (state.score % 50 === 0) {
        state.speed = Math.max(GAME_CONFIG.MIN_SPEED, state.speed - GAME_CONFIG.SPEED_INCREMENT);
      }

      // Powerup Spawn Chance
      if (state.score % 100 === 0 && !state.powerUp) {
        state.powerUp = generatePoint(newSnake);
        state.powerUpTimer = now + GAME_CONFIG.POWERUP_DURATION;
      }
    } else if (state.powerUp && head.x === state.powerUp.x && head.y === state.powerUp.y) {
      // Powerup collection
      state.score += 50;
      onScoreChange(state.score);
      createParticles(state.powerUp.x, state.powerUp.y, COLORS.POWERUP);
      
      // Effects: Shrink tail
      if (newSnake.length > 5) {
        newSnake.splice(-3);
      }
      // Effect: Temporary Slow
      state.speed += 20; 
      
      state.powerUp = null;
    } else {
      newSnake.pop();
    }

    state.snake = newSnake;

    // Clear expired powerup
    if (state.powerUp && now > state.powerUpTimer) {
      state.powerUp = null;
    }
  }, [onGameOver, onScoreChange, generatePoint]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    const state = stateRef.current;
    const tileSize = size / GAME_CONFIG.TILE_COUNT;
    const now = performance.now();

    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, size, size);

    // Grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GAME_CONFIG.TILE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(size, i * tileSize);
      ctx.stroke();
    }

    // Particles
    state.particles.forEach((p, idx) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = p.color;
      ctx.fillRect(p.x * tileSize + tileSize/2 - p.size/2, p.y * tileSize + tileSize/2 - p.size/2, p.size, p.size);
      p.x += p.vx * 0.02;
      p.y += p.vy * 0.02;
      p.life -= 0.02;
      if (p.life <= 0) state.particles.splice(idx, 1);
    });
    ctx.globalAlpha = 1;

    // Food
    ctx.shadowBlur = 15 + Math.sin(now / 150) * 10;
    ctx.shadowColor = COLORS.FOOD;
    ctx.fillStyle = COLORS.FOOD;
    const pulse = 0.8 + Math.sin(now / 150) * 0.2;
    ctx.beginPath();
    ctx.arc(state.food.x * tileSize + tileSize/2, state.food.y * tileSize + tileSize/2, (tileSize/3) * pulse, 0, Math.PI * 2);
    ctx.fill();

    // PowerUp
    if (state.powerUp) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = COLORS.POWERUP;
      ctx.fillStyle = COLORS.POWERUP;
      const t = (state.powerUpTimer - now) / GAME_CONFIG.POWERUP_DURATION;
      ctx.globalAlpha = t > 0.2 ? 1 : (Math.sin(now/50) > 0 ? 1 : 0.3); // Flashing when expiring
      ctx.beginPath();
      ctx.arc(state.powerUp.x * tileSize + tileSize/2, state.powerUp.y * tileSize + tileSize/2, tileSize/2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Snake
    state.snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.shadowBlur = isHead ? 25 : 10;
      const color = isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      
      const padding = isHead ? 1 : 3;
      const r = isHead ? 8 : 4;
      ctx.beginPath();
      ctx.roundRect(
        segment.x * tileSize + padding, 
        segment.y * tileSize + padding, 
        tileSize - padding * 2, 
        tileSize - padding * 2, 
        r
      );
      ctx.fill();

      if (isHead) {
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        const eyeOffset = tileSize / 4;
        const eyeSize = 2;
        ctx.fillRect(segment.x * tileSize + tileSize/2 - eyeSize/2, segment.y * tileSize + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(segment.x * tileSize + tileSize/2 - eyeSize/2, segment.y * tileSize + tileSize - eyeOffset - eyeSize, eyeSize, eyeSize);
      }
    });

    // Combo Text
    if (state.combo && state.combo.opacity > 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.TEXT_NEON;
        ctx.fillStyle = `rgba(0, 242, 255, ${state.combo.opacity})`;
        ctx.font = '900 16px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO x${state.combo.count}`, state.combo.x * tileSize + tileSize/2, (state.combo.y - 1) * tileSize);
        state.combo.opacity -= 0.01;
    }

    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const minDim = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7);
      canvas.width = minDim;
      canvas.height = minDim;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleKeyDown = (e: KeyboardEvent) => {
      const current = stateRef.current.direction;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (current !== Direction.DOWN) stateRef.current.nextDirection = Direction.UP; break;
        case 'ArrowDown': case 's': if (current !== Direction.UP) stateRef.current.nextDirection = Direction.DOWN; break;
        case 'ArrowLeft': case 'a': if (current !== Direction.RIGHT) stateRef.current.nextDirection = Direction.LEFT; break;
        case 'ArrowRight': case 'd': if (current !== Direction.LEFT) stateRef.current.nextDirection = Direction.RIGHT; break;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);

    if (isActive) resetGame();

    let aniId: number;
    const loop = (time: number) => {
      if (isActive) {
        if (time - stateRef.current.lastTick >= stateRef.current.speed) {
          update();
          stateRef.current.lastTick = time;
        }
      }
      draw(ctx, canvas.width);
      aniId = requestAnimationFrame(loop);
    };
    aniId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(aniId);
    };
  }, [isActive, update, draw, resetGame]);

  return (
    <div className="relative p-2 rounded-[2.5rem] border-8 border-cyan-500/20 shadow-[0_0_100px_rgba(0,242,255,0.15)] bg-black overflow-hidden group transition-all duration-700 hover:border-cyan-500/40">
        <canvas ref={canvasRef} className="block rounded-[1.8rem]" />
        {/* Subtle Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        {/* Edge Glow */}
        <div className="absolute inset-0 pointer-events-none rounded-[1.8rem] border border-cyan-500/10 shadow-[inset_0_0_20px_rgba(0,242,255,0.1)]"></div>
    </div>
  );
};

export default GameView;
