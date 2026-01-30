
import React, { useState, useEffect, useCallback } from 'react';
import GameView from './components/GameView';
import { GameState } from './types';
import { getGalacticMessage } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [flavorText, setFlavorText] = useState("Accessing System...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('neon_slither_highscore');
    if (saved) setHighScore(parseInt(saved, 10));

    const fetchIntro = async () => {
      const msg = await getGalacticMessage('intro');
      setFlavorText(msg);
    };
    fetchIntro();
  }, []);

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore(0);
  }, []);

  const handleGameOver = useCallback(async (finalScore: number) => {
    setScore(finalScore);
    setGameState(GameState.GAME_OVER);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('neon_slither_highscore', finalScore.toString());
    }

    setIsLoading(true);
    const msg = await getGalacticMessage('outro', finalScore);
    setFlavorText(msg);
    setIsLoading(false);
  }, [highScore]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center font-sans">
      {/* Visual background layers */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]"></div>
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      {/* Game View */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <GameView 
          isActive={gameState === GameState.PLAYING} 
          onGameOver={handleGameOver}
          onScoreChange={setScore}
        />
      </div>

      {/* HUD Score & High Score */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-8 left-8 right-8 z-20 flex justify-between pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.2)]">
            <span className="block text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.3em] mb-1">Grid_Score</span>
            <span className="text-4xl font-black font-orbitron text-cyan-400 tracking-tighter leading-none">{score}</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl text-right">
            <span className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-1">Max_Efficiency</span>
            <span className="text-2xl font-black font-orbitron text-white tracking-tighter leading-none">{highScore}</span>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="z-30 bg-black/80 backdrop-blur-xl p-12 rounded-[2rem] border-2 border-cyan-500 shadow-[0_0_60px_rgba(0,242,255,0.4)] text-center max-w-lg animate-in fade-in zoom-in duration-700">
          <div className="mb-2 inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.5em]">System.Active</span>
          </div>
          <h1 className="text-7xl font-black font-orbitron text-white mb-4 tracking-tighter italic drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]">NEON SLITHER</h1>
          <p className="text-cyan-200/50 mb-10 font-medium italic text-sm">"{flavorText}"</p>
          <div className="space-y-6">
            <button 
              onClick={startGame}
              className="group relative w-full py-6 px-12 overflow-hidden rounded-2xl bg-cyan-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,242,255,0.4)]"
            >
              <span className="relative z-10 font-black font-orbitron text-2xl text-black">INITIALIZE</span>
            </button>
            <div className="flex justify-between items-center opacity-40">
                <hr className="flex-1 border-white/20" />
                <span className="px-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white">Manual Override</span>
                <hr className="flex-1 border-white/20" />
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Move: WASD / Arrows • Space: Pause</p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="z-30 bg-black/90 backdrop-blur-2xl p-12 rounded-[2rem] border-4 border-pink-500 shadow-[0_0_80px_rgba(255,0,255,0.3)] text-center max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-500">
          <h2 className="text-5xl font-black font-orbitron text-pink-500 mb-2 tracking-tighter italic">CORE RUPTURE</h2>
          <div className="py-10">
             <span className="text-white/30 uppercase text-[10px] font-bold tracking-[0.5em]">Terminal Yield</span>
             <p className="text-8xl font-black text-white font-orbitron tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{score}</p>
          </div>
          <p className="text-pink-300/60 mb-10 italic text-sm min-h-[3rem] px-4">
            {isLoading ? "Analyzing neural patterns..." : `"${flavorText}"`}
          </p>
          <button 
            onClick={startGame}
            className="w-full py-6 px-12 bg-pink-600 hover:bg-pink-500 text-white font-black font-orbitron text-2xl rounded-2xl transition-all shadow-[0_0_30px_rgba(255,0,255,0.5)] active:scale-95"
          >
            RE-LINK
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
