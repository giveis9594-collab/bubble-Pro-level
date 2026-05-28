import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Star, ChevronRight, HelpCircle } from 'lucide-react';
import { PlayerStats, LevelConfig } from '../types';
import { audio } from '../audio';
import { PREMADE_LEVELS, getLevelConfig } from '../levels';

interface LevelSelectProps {
  stats: PlayerStats;
  onSelectLevel: (lvlId: number) => void;
  onBack: () => void;
}

export default function LevelSelect({ stats, onSelectLevel, onBack }: LevelSelectProps) {
  // Let's list a total of 15 premade levels, and provide a fun "infinite procedural lab" deck of 16-100 levels!
  const levelsCount = 100;

  // Build a list of levels displaying on screen
  const getLevelsList = () => {
    const arr = [];
    for (let i = 1; i <= 24; i++) {
      // Show up to level 24 directly in list map. Higher levels are loaded from the continuous scroll
      const pre = i <= PREMADE_LEVELS.length ? PREMADE_LEVELS[i - 1] : getLevelConfig(i);
      arr.push(pre);
    }
    return arr;
  };

  const currentLevelIndex = stats.currentLevel;

  return (
    <div className="flex flex-col min-h-[580px] p-4 select-none w-full max-w-sm mx-auto">
      
      {/* Header section */}
      <div className="flex items-center justify-between w-full mb-6">
        <button 
          onClick={() => { audio.playClick(); onBack(); }}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-white/80"
          title="Return to Main Menu"
        >
          <ArrowLeft size={16} />
        </button>

        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5 justify-center">
          <span>🚀 Levels Map</span>
        </h2>

        {/* Dummy spacing or stat display */}
        <div className="text-[10px] bg-white/5 p-1 px-3 border border-white/5 rounded-full font-bold text-white/60">
          Rank {Math.max(1, Math.floor(stats.currentLevel / 4))}
        </div>
      </div>

      {/* Grid description briefing info */}
      <div className="bg-white/5 border border-white/5 p-3 rounded-2xl mb-5 flex flex-col items-center text-center">
        <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Campaign Journey</span>
        <p className="text-[10px] text-white/50 leading-relaxed max-w-[240px] mt-0.5">
          Progress through premade tactical boards or explore procedural deep cosmic chambers.
        </p>
      </div>

      {/* Levels Track map grid layout */}
      <div className="flex-1 overflow-y-auto max-h-[400px] pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="grid grid-cols-4 gap-3">
          {getLevelsList().map((lvl) => {
            const isUnlocked = lvl.id <= stats.currentLevel;
            const scoreRecord = stats.highScores.levels[lvl.id];
            const starsAwarded = scoreRecord ? scoreRecord.stars : 0;

            const isCurrent = lvl.id === stats.currentLevel;

            return (
              <motion.button
                key={lvl.id}
                onClick={() => {
                  if (isUnlocked) {
                    audio.playClick();
                    onSelectLevel(lvl.id);
                  } else {
                    audio.playPop(); // mock funny lock bump sound
                  }
                }}
                whileTap={isUnlocked ? { scale: 0.95 } : undefined}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-between p-2.5 transition border overflow-hidden ${
                  isCurrent 
                    ? 'bg-gradient-to-br from-[#a855f7] to-[#7c3aed] border-yellow-400 border-2 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                    : isUnlocked 
                      ? 'bg-zinc-900 border-zinc-800 text-white hover:border-[#a855f7]' 
                      : 'bg-black/40 border-zinc-950 text-white/30 cursor-not-allowed opacity-50'
                }`}
              >
                {/* Visual lock status or ID heading */}
                <div className="flex items-center justify-center w-full">
                  {isUnlocked ? (
                    <span className="text-[11px] font-black">{lvl.id}</span>
                  ) : (
                    <Lock size={12} className="text-zinc-650" />
                  )}
                </div>

                {/* Star performance ratings bottom row */}
                {isUnlocked && (
                  <div className="flex items-center justify-center gap-0.5 mt-1.5">
                    {[1, 2, 3].map((sIndex) => (
                      <Star 
                        key={sIndex} 
                        size={8} 
                        className={`${
                          sIndex <= starsAwarded 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-zinc-700'
                        }`} 
                      />
                    ))}
                  </div>
                )}

                {/* Procedural flag marker label */}
                {lvl.id > 15 && isUnlocked && (
                  <span className="absolute bottom-0.5 right-1.5 text-[6px] text-cyan-400 tracking-tight font-bold uppercase zoom">
                    Proc
                  </span>
                )}

                {/* Interactive Pulsing active status ring */}
                {isCurrent && (
                  <div className="absolute inset-0 bg-white/10 animate-pulse rounded-2xl pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continuous scrolling lab section */}
      {stats.currentLevel > 24 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col items-center">
          <button
            onClick={() => { audio.playClick(); onSelectLevel(stats.currentLevel); }}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 font-black rounded-xl text-center flex items-center justify-center gap-2 text-xs"
          >
            Shoot Current Cosmic level {stats.currentLevel} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
