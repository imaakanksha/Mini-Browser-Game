
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameView, { GameViewHandle } from './components/GameView';
import { GameState, LeaderboardEntry, Direction } from './types';
import { getGalacticMessage } from './services/geminiService';
import { LeaderboardService } from './services/LeaderboardService';
import { TestSuite } from './services/TestSuite';
import { GAME_CONFIG } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [flavorText, setFlavorText] = useState("Enterprise Systems Ready...");
  const [isSyncing, setIsSyncing] = useState(false);
  const gameViewRef = useRef<GameViewHandle>(null);

  useEffect(() => {
    if (GAME_CONFIG.DEBUG) {
      new TestSuite().runAll();
    }

    const loadData = async () => {
      const scores = await LeaderboardService.getScores();
      setLeaderboard(scores);
      const msg = await getGalacticMessage('intro');
      setFlavorText(msg);
    };
    loadData();
  }, []);

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore(0);
  }, []);

  const handleGameOver = useCallback(async (finalScore: number) => {
    setScore(finalScore);
    setGameState(GameState.GAME_OVER);
    setIsSyncing(true);

    try {
      if (finalScore > 0) {
        await LeaderboardService.saveScore("Pilot_X", finalScore);
        const updated = await LeaderboardService.getScores();
        setLeaderboard(updated);
      }
      const msg = await getGalacticMessage('outro', finalScore);
      setFlavorText(msg);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleDirectionPress = (dir: Direction) => {
    gameViewRef.current?.changeDirection(dir);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center font-sans selection:bg-cyan-500 selection:text-black">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]"></div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-8">
        <GameView 
          ref={gameViewRef}
          isActive={gameState === GameState.PLAYING} 
          onGameOver={handleGameOver}
          onScoreChange={setScore}
        />

        {/* Start Overlay */}
        {gameState === GameState.START && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-black/80 p-12 rounded-[2.5rem] border-2 border-cyan-400/50 text-center max-w-lg shadow-2xl">
              <h1 className="text-5xl font-arcade text-cyan-400 mb-6 tracking-widest animate-pulse">NEON SLITHER</h1>
              <p className="text-cyan-200/50 mb-10 font-medium italic text-sm font-arcade leading-relaxed">"{flavorText}"</p>
              
              <div className="grid grid-cols-1 gap-6">
                <button 
                  onClick={startGame}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black py-4 px-8 rounded-xl font-arcade text-lg transition-all shadow-[0_0_25px_rgba(0,242,255,0.4)]"
                >
                  START_MISSION
                </button>
                <div className="text-left bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs font-arcade text-white/40 mb-3 uppercase tracking-widest">Global_Leaderboard</p>
                  {leaderboard.length === 0 ? (
                    <p className="text-[10px] text-white/20 font-arcade">No records found...</p>
                  ) : (
                    leaderboard.slice(0, 3).map((entry, i) => (
                      <div key={i} className="flex justify-between text-[10px] font-arcade text-cyan-300/80 mb-1">
                        <span>{i+1}. {entry.name}</span>
                        <span>{entry.score}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HUD */}
        {gameState === GameState.PLAYING && (
          <>
            <div className="absolute top-8 left-8 right-8 z-20 flex justify-between pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-cyan-500/20 p-4 rounded-xl">
                <span className="block text-[8px] font-arcade text-cyan-500/40 uppercase mb-1">DATA_STREAM</span>
                <span className="text-3xl font-arcade text-cyan-400">{score}</span>
              </div>
            </div>

            {/* Neon Directional Controls */}
            <div className="absolute bottom-8 right-8 z-20 flex flex-col items-center gap-2">
              <button 
                className="w-16 h-16 bg-black/40 border-2 border-cyan-500/60 rounded-xl flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 active:scale-90 transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                onClick={() => handleDirectionPress(Direction.UP)}
                aria-label="Up"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <div className="flex gap-2">
                <button 
                  className="w-16 h-16 bg-black/40 border-2 border-cyan-500/60 rounded-xl flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 active:scale-90 transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  onClick={() => handleDirectionPress(Direction.LEFT)}
                  aria-label="Left"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button 
                  className="w-16 h-16 bg-black/40 border-2 border-cyan-500/60 rounded-xl flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 active:scale-90 transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  onClick={() => handleDirectionPress(Direction.DOWN)}
                  aria-label="Down"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <button 
                  className="w-16 h-16 bg-black/40 border-2 border-cyan-500/60 rounded-xl flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 active:scale-90 transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  onClick={() => handleDirectionPress(Direction.RIGHT)}
                  aria-label="Right"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Game Over */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-black p-12 rounded-[2rem] border-4 border-red-500/50 text-center max-w-md shadow-2xl">
              <h2 className="text-4xl font-arcade text-red-500 mb-8 italic">GRID_CRASH</h2>
              <div className="mb-10">
                <p className="text-[10px] font-arcade text-white/30 uppercase mb-2">Final_Efficiency</p>
                <p className="text-6xl font-arcade text-white">{score}</p>
              </div>
              <p className="text-red-300/40 mb-10 text-[10px] font-arcade leading-relaxed">
                {isSyncing ? "SYNCING TELEMETRY..." : `"${flavorText}"`}
              </p>
              <button 
                onClick={startGame}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-xl font-arcade transition-all shadow-lg"
              >
                RE-INITIALIZE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
