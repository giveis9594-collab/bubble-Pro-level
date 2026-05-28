import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Trophy, Calendar, ShoppingBag, Coins, HelpCircle, 
  Settings, Volume2, VolumeX, Shield, Clock, Hourglass 
} from 'lucide-react';
import { GameMode, PlayerStats, GameTheme } from '../types';
import { audio } from '../audio';

interface MainMenuProps {
  stats: PlayerStats;
  themes: GameTheme[];
  currentTheme: GameTheme;
  onSelectMode: (mode: GameMode) => void;
  onOpenShop: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  updateStats: (newStats: Partial<PlayerStats>) => void;
}

export default function MainMenu({
  stats,
  themes,
  currentTheme,
  onSelectMode,
  onOpenShop,
  onToggleMute,
  isMuted,
  updateStats
}: MainMenuProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showClaimFeedback, setShowClaimFeedback] = useState(false);

  // Daily Reward Claim logic
  const handleClaimDaily = () => {
    const now = new Date();
    const isoDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    if (stats.dailyClaimedDate === isoDateStr) {
      audio.playClick();
      alert('You have already claimed your daily reward! Come back tomorrow.');
      return;
    }

    // Award rewards
    audio.playPowerup();
    const updatedCoins = stats.coins + 250;
    const updatedPowerups = { ...stats.powerups };
    updatedPowerups.bomb += 1;
    updatedPowerups.rainbow += 1;

    updateStats({
      coins: updatedCoins,
      powerups: updatedPowerups,
      dailyClaimedDate: isoDateStr
    });

    setShowClaimFeedback(true);
    setTimeout(() => {
      setShowClaimFeedback(false);
    }, 3000);
  };

  const isDailyClaimed = () => {
    const now = new Date();
    const isoDateStr = now.toISOString().split('T')[0];
    return stats.dailyClaimedDate === isoDateStr;
  };

  const totalLevelsCompleted = Object.keys(stats.highScores.levels).length;

  return (
    <div className="flex flex-col items-center justify-between min-h-[580px] p-4 text-center select-none w-full max-w-sm mx-auto">
      
      {/* Top Header stats dashboard */}
      <div className="flex items-center justify-between w-full p-3 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
        <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm">
          <Coins size={16} className="fill-emerald-400" />
          <span>{stats.coins}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleMute}
            className="p-2 hover:bg-white/5 rounded-xl transition text-white/75"
            title="Toggle game sound synthesis"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          
          <button
            onClick={() => { audio.playClick(); setShowHowToPlay(true); }}
            className="p-2 hover:bg-white/5 rounded-xl transition text-white/75"
            title="How to play instructions"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Main Game Branding Branding Logo */}
      <div className="my-6">
        <motion.div 
          initial={{ scale: 0.9, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative flex flex-col items-center"
        >
          {/* Neon Floating Bubbles around title */}
          <div className="absolute -top-6 -left-4 w-6 h-6 rounded-full bg-rose-500 animate-pulse opacity-50 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
          <div className="absolute -bottom-2 -right-6 w-8 h-8 rounded-full bg-cyan-400 animate-bounce opacity-40 shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
          <div className="absolute top-10 -right-8 w-5 h-5 rounded-full bg-emerald-400 animate-ping opacity-30" />

          <h1 className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-none text-center">
            BUBBLE<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 px-1 font-black">
              POP BLITZ
            </span>
          </h1>
          <span className="text-[10px] text-white/50 tracking-widest uppercase font-bold mt-2">
            Dynamic Mobile shooter console
          </span>
        </motion.div>
      </div>

      {/* Primary Mode Select Buttons */}
      <div className="w-full flex flex-col gap-2.5 items-center">
        {/* Play Levels Adventure */}
        <button
          onClick={() => { audio.playClick(); onSelectMode('levels'); }}
          className="w-full py-4 px-6 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-black font-extrabold rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 text-base flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div className="text-left flex flex-col">
              <span className="font-extrabold text-sm leading-tight text-neutral-900">Levels Mode</span>
              <span className="text-[10px] text-neutral-800 font-bold opacity-80">Progressive grid maps and blockers</span>
            </div>
          </div>
          <span className="bg-neutral-950 text-yellow-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-yellow-400/10">
            {totalLevelsCompleted > 0 ? `Lvl ${totalLevelsCompleted + 1}` : 'Start'}
          </span>
        </button>

        {/* Endless mode */}
        <button
          onClick={() => { audio.playClick(); onSelectMode('endless'); }}
          className="w-full py-3.5 px-6 bg-[#a855f7] text-white font-extrabold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 text-sm flex items-center gap-3 border border-[#b56efb]/30"
        >
          <span className="text-xl">∞</span>
          <div className="text-left flex flex-col">
            <span className="font-extrabold leading-tight text-white">Classic Endless Challenge</span>
            <span className="text-[10px] text-white/70 font-bold">Unending drop speeds, fight high scores</span>
          </div>
        </button>

        {/* Time Trial mode */}
        <button
          onClick={() => { audio.playClick(); onSelectMode('time'); }}
          className="w-full py-3.5 px-6 bg-cyan-500 text-[#0c0a09] font-extrabold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 text-sm flex items-center gap-3 border border-cyan-400/20"
        >
          <Clock size={18} className="text-[#0c0a09]" />
          <div className="text-left flex flex-col">
            <span className="font-extrabold leading-tight text-[#0c0a09]">Time Challenge (Blitz)</span>
            <span className="text-[10px] text-neutral-900/80 font-bold">Eliminate colors before clean timer runs out</span>
          </div>
        </button>
      </div>

      {/* Secondary Quick Controls (Shop, Daily reward) */}
      <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
        
        {/* Daily reward claim button */}
        <button
          onClick={handleClaimDaily}
          className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition ${
            isDailyClaimed() 
              ? 'bg-neutral-900/40 border-zinc-800 text-zinc-600' 
              : 'bg-[#10b981]/15 active:bg-[#10b981]/25 hover:border-[#10b981] border-[#10b981]/35 text-white'
          }`}
        >
          <Calendar size={18} className={isDailyClaimed() ? 'text-zinc-600' : 'text-emerald-400'} />
          <span className="text-[10px] font-bold mt-1">Daily Claim</span>
          <span className="text-[8px] font-extrabold opacity-60">
            {isDailyClaimed() ? 'Claimed ✓' : '+250 Gold'}
          </span>
        </button>

        {/* Access themes shop */}
        <button
          onClick={() => { audio.playClick(); onOpenShop(); }}
          className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl flex flex-col items-center justify-center text-white hover:border-yellow-400 transition"
        >
          <ShoppingBag size={18} className="text-[#fbbf24]" />
          <span className="text-[10px] font-bold mt-1">Skins & Armory</span>
          <span className="text-[8px] font-extrabold text-[#fbbf24]">Themes & Powerups</span>
        </button>
      </div>

      {/* Mini AdMob Simulator Banner */}
      <div className="w-full mt-4 text-center">
        <span className="text-[8px] text-white/30 uppercase tracking-widest block mb-1">Simulated AdMob Banner Slot</span>
        <div className="w-full py-2.5 bg-zinc-950 rounded-lg border border-zinc-900 border-dashed flex items-center justify-center gap-1.5 px-3">
          <span className="bg-[#fbbf24] text-neutral-950 text-[7px] font-black px-1.5 py-0.5 rounded">AD</span>
          <span className="text-[9px] text-white/50 font-bold tracking-tight">Bubble Blast Champion! Download directly and play!</span>
        </div>
      </div>

      {/* Modals details overlay */}
      <AnimatePresence>
        {/* How to play instruction booklet */}
        {showHowToPlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-black text-white mb-4">How To Play</h2>
              
              <div className="space-y-4 text-left text-xs text-white/70 mb-6">
                <div className="flex gap-2.5 items-start">
                  <span className="text-base">1.</span>
                  <p><b className="text-white">Aim & Fire</b>: Touch, hold, and slide on the field to draw a bounce prediction line. Release to fire your bubble projectile.</p>
                </div>
                <div className="flex gap-2.5 items-start animate-pulse">
                  <span className="text-base">2.</span>
                  <p><b className="text-white">Match-3 Rule</b>: Hit same-color bubbles to group at least 3. They will burst, dropping hanging bubbles at 2x score points!</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="text-base">3.</span>
                  <p><b className="text-white">Obstacles</b>: Melt Ice blockers by blasting adjacent groups, and drop indestructible Stones by popping their support anchors!</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="text-base">4.</span>
                  <p><b className="text-white">Super power-ups</b>: Switch to Bomb, Fire path, Rainbow match, or precise Laser to clear tricky level stages quickly.</p>
                </div>
              </div>

              <button 
                onClick={() => { audio.playClick(); setShowHowToPlay(false); }}
                className="w-full py-2.5 bg-[#a855f7] text-white font-extrabold rounded-xl shadow-lg transition duration-150"
              >
                Let's Shoot!
              </button>
            </div>
          </motion.div>
        )}

        {/* Claim Success Feedback Dialog */}
        {showClaimFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-16 z-50 bg-[#10b981] text-[#041d11] font-black rounded-2xl p-4 px-6 shadow-2xl flex items-center gap-3 text-sm tracking-tight border border-[#34d399]"
          >
            <Calendar size={18} /> Daily Gold Claimed! (+250 G, +1 Bomb, +1 Rainbow)
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
