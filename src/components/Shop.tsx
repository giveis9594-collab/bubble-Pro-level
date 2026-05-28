import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Coins, Shield, Sparkles, Flame, Zap, Check, Lock, ShoppingCart 
} from 'lucide-react';
import { PlayerStats, GameTheme, BubbleType } from '../types';
import { audio } from '../audio';

interface ShopProps {
  stats: PlayerStats;
  themes: GameTheme[];
  currentTheme: GameTheme;
  onBack: () => void;
  onSelectTheme: (themeId: string) => void;
  updateStats: (newStats: Partial<PlayerStats>) => void;
}

export default function Shop({
  stats,
  themes,
  currentTheme,
  onBack,
  onSelectTheme,
  updateStats
}: ShopProps) {
  
  // Powerup prices to buy individually
  const powerupPrices: { [type in 'bomb' | 'rainbow' | 'fire' | 'laser']: number } = {
    bomb: 150,
    rainbow: 120,
    fire: 200,
    laser: 180
  };

  // Buy ammo handler
  const handleBuyPowerup = (type: 'bomb' | 'rainbow' | 'fire' | 'laser') => {
    const cost = powerupPrices[type];
    if (stats.coins < cost) {
      audio.playPop(); // mock buzzer fail
      alert('Insufficient gold coins! Complete levels to gather coins.');
      return;
    }

    // Spend coins and increment inventory
    audio.playPowerup();
    const updatedCoins = stats.coins - cost;
    const updatedPowerups = { ...stats.powerups };
    updatedPowerups[type]++;

    updateStats({
      coins: updatedCoins,
      powerups: updatedPowerups
    });
  };

  // Buy/Unlock skins themes
  const handleUnlockTheme = (theme: GameTheme) => {
    if (theme.isUnlocked || stats.unlockedThemes.includes(theme.id)) {
      // Just select
      audio.playClick();
      onSelectTheme(theme.id);
      return;
    }

    // Purchase theme
    const cost = theme.price;
    if (stats.coins < cost) {
      audio.playPop(); // failure buzz
      alert('Insufficient gold coins! Clear more color puzzles to get coins.');
      return;
    }

    audio.playPowerup();
    const updatedCoins = stats.coins - cost;
    const updatedUnlockedThemes = [...stats.unlockedThemes, theme.id];

    updateStats({
      coins: updatedCoins,
      unlockedThemes: updatedUnlockedThemes
    });

    onSelectTheme(theme.id);
  };

  return (
    <div className="flex flex-col min-h-[580px] p-4 select-none w-full max-w-sm mx-auto">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between w-full mb-5">
        <button 
          onClick={() => { audio.playClick(); onBack(); }}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-white/80"
          title="Return to Main Menu"
        >
          <ArrowLeft size={16} />
        </button>

        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 justify-center">
          <span>🛒 Armory & Skins</span>
        </h3>

        {/* Realtime coins display */}
        <div className="flex items-center gap-1 bg-emerald-500/10 p-1.5 px-3 border border-emerald-500/25 rounded-xl text-emerald-400 font-extrabold text-xs">
          <Coins size={14} className="fill-emerald-400" />
          <span>{stats.coins}</span>
        </div>
      </div>

      {/* Main categories scrollable */}
      <div className="flex-1 overflow-y-auto max-h-[460px] space-y-6 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* Section 1: Tactical Ammunition Powerups */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#fbbf24] flex items-center gap-1">
              <span>💣 Tactical Ammo Refills</span>
            </h4>
            <span className="text-[9px] text-white/40">Load pre-match specials</span>
          </div>

          <div className="space-y-2.5">
            {/* Bomb Ammo buy item */}
            <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/25 rounded-xl flex items-center justify-center text-orange-400">
                  <Shield size={20} className="fill-orange-400/10" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-xs text-white block">Bomb Bubble</span>
                  <span className="text-[9px] text-white/50">Radius 2 circle pop block explosion</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-500 mr-1">(Have: {stats.powerups.bomb})</span>
                <button
                  onClick={() => handleBuyPowerup('bomb')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Coins size={10} className="fill-white" /> 150
                </button>
              </div>
            </div>

            {/* Rainbow Ammo */}
            <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-400/10 border border-cyan-400/25 rounded-xl flex items-center justify-center text-cyan-400">
                  <Sparkles size={20} className="fill-cyan-400/10" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-xs text-white block">Rainbow Matcher</span>
                  <span className="text-[9px] text-white/50">Autocolor adapts to first struck neighbor</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-500 mr-1">(Have: {stats.powerups.rainbow})</span>
                <button
                  onClick={() => handleBuyPowerup('rainbow')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Coins size={10} className="fill-white" /> 120
                </button>
              </div>
            </div>

            {/* Fire Blast */}
            <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-center text-rose-500">
                  <Flame size={20} className="fill-rose-500/10" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-xs text-white block">Fire Laser Blast</span>
                  <span className="text-[9px] text-white/50">Incinerates full rows of bubbles on track</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-500 mr-1">(Have: {stats.powerups.fire})</span>
                <button
                  onClick={() => handleBuyPowerup('fire')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Coins size={10} className="fill-white" /> 200
                </button>
              </div>
            </div>

            {/* Laser Aim */}
            <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-400/10 border border-purple-400/25 rounded-xl flex items-center justify-center text-purple-400">
                  <Zap size={20} className="fill-purple-400/10" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-xs text-white block">Laser Precision Guide</span>
                  <span className="text-[9px] text-white/50">Infinitely tracks bounce, auto-burst bubble</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-500 mr-1">(Have: {stats.powerups.laser})</span>
                <button
                  onClick={() => handleBuyPowerup('laser')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Coins size={10} className="fill-white" /> 180
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Themes skin updates */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#a855f7] flex items-center gap-1">
              <span>🎨 Visual Themes Board</span>
            </h4>
            <span className="text-[9px] text-white/40">Refresh bubble skins & backgrounds</span>
          </div>

          <div className="space-y-2.5">
            {themes.map((theme) => {
              const isUnlocked = theme.isUnlocked || stats.unlockedThemes.includes(theme.id);
              const isSelected = currentTheme.id === theme.id;

              return (
                <div 
                  key={theme.id}
                  className={`border p-3.5 rounded-2xl flex items-center justify-between transition ${
                    isSelected 
                      ? 'bg-white/5 border-purple-500' 
                      : 'bg-zinc-900 border-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Tiny preview ball colored with theme properties */}
                    <div 
                      className="w-10 h-10 rounded-full border flex items-center justify-center relative shadow-inner overflow-hidden"
                      style={{ background: theme.bgGradient, borderColor: theme.accentColor + '30' }}
                    >
                      {/* Bubble preview circle inside center */}
                      <span className="text-xs">⚪</span>
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-white">{theme.name}</span>
                        {isSelected && (
                          <span className="bg-purple-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded">
                            Engaged
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-white/50 leading-tight">
                        Style: {theme.bubbleStyle} particles: {theme.particleShape}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      <button
                        onClick={() => handleUnlockTheme(theme)}
                        className={`font-black tracking-tight py-1.5 px-3.5 rounded-xl text-xs transition active:scale-95 ${
                          isSelected
                            ? 'bg-zinc-800 text-white/40 cursor-default'
                            : 'bg-white/10 text-white hover:bg-white/15'
                        }`}
                        disabled={isSelected}
                      >
                        {isSelected ? 'Active' : 'Apply'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlockTheme(theme)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1 transition"
                      >
                        <Lock size={10} /> Buy {theme.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
