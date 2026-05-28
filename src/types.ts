// Types for Bubble Shooter Game

export type GameMode = 'levels' | 'endless' | 'time';

export type BubbleColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'none';

export type BubbleType = 'normal' | 'stone' | 'ice' | 'bomb' | 'rainbow' | 'fire' | 'laser';

export interface GridBubble {
  id: string;
  row: number;
  col: number;
  color: BubbleColor;
  type: BubbleType;
  isThawing?: boolean; // temporary animation state
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  type: BubbleType;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'leaf' | 'star' | 'laser';
}

export interface FallingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  type: BubbleType;
  radius: number;
  rotation: number;
  rv: number; // rotational velocity
}

export interface PopAnimation {
  x: number;
  y: number;
  color: string;
  radius: number;
  progress: number;
}

export interface GameTheme {
  id: string;
  name: string;
  price: number;
  isUnlocked: boolean;
  bgGradient: string;
  panelBg: string;
  textColor: string;
  accentColor: string;
  bubbleStyle: 'neon' | 'glass' | 'cartoon' | 'synth';
  particleShape: 'circle' | 'star' | 'leaf';
  wallColor: string;
}

export interface LevelConfig {
  id: number;
  title: string;
  themeId: string;
  movesLimit?: number; // for levels mode
  timeLimit?: number; // for time mode
  scoreTarget: {
    1: number;
    2: number;
    3: number;
  };
  coinsReward: number;
  grid: number[][]; // Grid mapping 0: empty, 1-7: colors, 8: stone, 9: ice, 10: bomb
}

export interface PlayerStats {
  coins: number;
  currentLevel: number; // 1-based index
  unlockedThemes: string[];
  powerups: {
    bomb: number;
    rainbow: number;
    fire: number;
    laser: number;
  };
  highScores: {
    levels: { [levelId: number]: { score: number; stars: number } };
    endless: number;
    time: number;
  };
  dailyClaimedDate?: string; // ISO string format
}
