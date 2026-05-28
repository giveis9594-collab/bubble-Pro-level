/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GameMode, PlayerStats, GameTheme, LevelConfig 
} from './types';
import MainMenu from './components/MainMenu';
import LevelSelect from './components/LevelSelect';
import Shop from './components/Shop';
import GameBoard from './components/GameBoard';
import { getLevelConfig } from './levels';
import { audio } from './audio';

// Dynamic Visual Themes Configuration
const THEMES: GameTheme[] = [
  {
    id: 'neon_cosmic',
    name: 'Cosmic Neon (Space)',
    price: 0,
    isUnlocked: true,
    bgGradient: 'radial-gradient(circle, #1e1b4b 0%, #030712 100%)',
    panelBg: '#0f172a',
    textColor: '#f8fafc',
    accentColor: '#a855f7',
    bubbleStyle: 'neon',
    particleShape: 'circle',
    wallColor: '#a855f7'
  },
  {
    id: 'candy_pop',
    name: 'Cherry Stars (Pastel)',
    price: 300,
    isUnlocked: false,
    bgGradient: 'radial-gradient(circle, #2d1222 0%, #0f030a 100%)',
    panelBg: '#1f121d',
    textColor: '#fff1f2',
    accentColor: '#ec4899',
    bubbleStyle: 'glass',
    particleShape: 'star',
    wallColor: '#ec4899'
  },
  {
    id: 'forest_quest',
    name: 'Emerald Canopy',
    price: 500,
    isUnlocked: false,
    bgGradient: 'radial-gradient(circle, #062f1a 0%, #020804 100%)',
    panelBg: '#091510',
    textColor: '#ecfdf5',
    accentColor: '#10b981',
    bubbleStyle: 'cartoon',
    particleShape: 'leaf',
    wallColor: '#10b981'
  },
  {
    id: 'sunset_synthwave',
    name: 'Sunset Synthwave',
    price: 800,
    isUnlocked: false,
    bgGradient: 'linear-gradient(180deg, #18051a 0%, #25023a 40%, #4c033c 70%, #170014 100%)',
    panelBg: '#18021b',
    textColor: '#fff1f2',
    accentColor: '#fb7185',
    bubbleStyle: 'synth',
    particleShape: 'star',
    wallColor: '#fb7185'
  }
];

// Initial default stats structure
const INITIAL_STATS: PlayerStats = {
  coins: 500, // starting gold so users can immediately test shop!
  currentLevel: 1,
  unlockedThemes: ['neon_cosmic'],
  powerups: {
    bomb: 3,
    rainbow: 2,
    fire: 2,
    laser: 1
  },
  highScores: {
    levels: {},
    endless: 0,
    time: 0
  }
};

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'level_select' | 'shop' | 'game'>('menu');
  const [activeMode, setActiveMode] = useState<GameMode>('levels');
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [themeId, setThemeId] = useState<string>('neon_cosmic');
  const [isMuted, setIsMuted] = useState(false);

  // Load stats on first startup
  useEffect(() => {
    const savedStats = localStorage.getItem('bubble_pop_blitz_stats_v2');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.warn('Could not parse level statistics: ', e);
      }
    }

    const savedTheme = localStorage.getItem('bubble_pop_blitz_theme');
    if (savedTheme) {
      setThemeId(savedTheme);
    }

    setIsMuted(audio.getMute());
  }, []);

  const updateStats = (newPart: Partial<PlayerStats>) => {
    setStats((prev) => {
      const merged = { ...prev, ...newPart };
      localStorage.setItem('bubble_pop_blitz_stats_v2', JSON.stringify(merged));
      return merged;
    });
  };

  const handleSelectTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem('bubble_pop_blitz_theme', id);
  };

  const handleToggleMute = () => {
    const state = audio.toggleMute();
    setIsMuted(state);
  };

  // Get active loaded theme structure
  const getActiveTheme = (): GameTheme => {
    const match = THEMES.find((t) => t.id === themeId);
    if (match) {
      // Dynamic unlocks binding
      return {
        ...match,
        isUnlocked: match.id === 'neon_cosmic' || stats.unlockedThemes.includes(match.id)
      };
    }
    return THEMES[0];
  };

  // Select level configurations to initialize GameBoard
  const handleSelectLevel = (levelId: number) => {
    setActiveLevelId(levelId);
    setActiveMode('levels');
    setScreen('game');
  };

  const handleSelectMode = (mode: GameMode) => {
    setActiveMode(mode);
    if (mode === 'levels') {
      setScreen('level_select');
    } else {
      // Endless or Time challenge starts level config immediately!
      // Endless & Time use procedural generators loaded maps
      setActiveLevelId(999); // dummy ID for Endless
      setScreen('game');
    }
  };

  const activeTheme = getActiveTheme();

  // Create custom Endless/Time maps layout specs so they can shoot bubbles infinitely!
  const getActiveLevelConfig = (): LevelConfig => {
    if (activeMode === 'levels') {
      return getLevelConfig(activeLevelId);
    } else if (activeMode === 'endless') {
      // Giant dense multi-color block for high stress classic bubble survival!
      return {
        id: 999,
        title: "Endless Surge",
        themeId: themeId,
        scoreTarget: { 1: 5000, 2: 12000, 3: 20000 },
        coinsReward: 300,
        grid: [
          [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
          [5, 4, 3, 2, 1, 5, 4, 3, 2],
          [2, 3, 4, 5, 1, 2, 3, 4, 5, 1],
          [1, 2, 3, 4, 5, 1, 2, 3, 4],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ]
      };
    } else {
      // Time trial blitz: clear ice & stones in 90 seconds flat!
      return {
        id: 888,
        title: "Time Trial Blitz",
        themeId: themeId,
        timeLimit: 90,
        scoreTarget: { 1: 3000, 2: 7000, 3: 12000 },
        coinsReward: 350,
        grid: [
          [8, 8, 1, 1, 2, 2, 8, 8, 1, 1],
          [2, 2, 9, 9, 9, 2, 2, 9, 9],
          [3, 3, 4, 4, 5, 5, 3, 3, 4, 4],
          [10, 0, 10, 0, 10, 0, 10, 0, 10], // lots of volatile bombs!
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ]
      };
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-3 transition-colors duration-500 overflow-x-hidden"
      style={{ background: activeTheme.bgGradient }}
    >
      
      {/* Decorative Blur Orbs backdrop */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Modern High-End Phone Bezel Frame Simulation Wrapper */}
      <div className="relative w-full max-w-[460px] bg-neutral-950 rounded-[44px] p-3 border-[6px] border-neutral-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.02)] overflow-hidden">
        
        {/* Notch / Speaker bar indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-950 rounded-b-2xl z-30 flex items-center justify-center">
          <div className="w-12 h-1 bg-neutral-800 rounded-full" />
        </div>

        {/* Home Screen indicator swipe bar bottom */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-neutral-800 rounded-full z-30" />

        {/* Standard Inner Screen bounds */}
        <div 
          className="relative min-h-[580px] rounded-[34px] overflow-hidden pt-4 pb-2 flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${activeTheme.panelBg}f0 0%, #050505fc 100%)` }}
        >
          <AnimatePresence mode="wait">
            {screen === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <MainMenu
                  stats={stats}
                  themes={THEMES}
                  currentTheme={activeTheme}
                  onSelectMode={handleSelectMode}
                  onOpenShop={() => setScreen('shop')}
                  onToggleMute={handleToggleMute}
                  isMuted={isMuted}
                  updateStats={updateStats}
                />
              </motion.div>
            )}

            {screen === 'level_select' && (
              <motion.div
                key="level_select"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <LevelSelect
                  stats={stats}
                  onSelectLevel={handleSelectLevel}
                  onBack={() => setScreen('menu')}
                />
              </motion.div>
            )}

            {screen === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Shop
                  stats={stats}
                  themes={THEMES}
                  currentTheme={activeTheme}
                  onBack={() => setScreen('menu')}
                  onSelectTheme={handleSelectTheme}
                  updateStats={updateStats}
                />
              </motion.div>
            )}

            {screen === 'game' && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <GameBoard
                  mode={activeMode}
                  levelConfig={getActiveLevelConfig()}
                  theme={activeTheme}
                  playerStats={stats}
                  updateStats={updateStats}
                  onBackToMenu={() => setScreen(activeMode === 'levels' ? 'level_select' : 'menu')}
                  onShopClick={() => setScreen('shop')}
                  onNextLevel={
                    activeMode === 'levels' 
                      ? () => {
                          // Bump up to next serial level config
                          setActiveLevelId((prev) => prev + 1);
                        }
                      : undefined
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google AdMob Sponsored Banner ID Display */}
          <div className="w-full mt-auto pt-2 pb-1 border-t border-white/5 bg-zinc-950/70 flex flex-col items-center justify-center gap-1 z-10 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 max-w-[90%]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-mono font-bold tracking-tight text-zinc-400 truncate">
                AD: <span className="text-[#fbbf24] select-all font-semibold">ca-app-pub-3926034554770809/5298738334</span>
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 font-semibold tracking-tight">
              Play Free • Support Sponsor For Coins & Boosts
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

