import { LevelConfig } from './types';

// Let's define the color mapped to numbers:
// 0: Empty
// 1: Red, 2: Blue, 3: Green, 4: Yellow, 5: Purple, 6: Orange, 7: Cyan
// 8: Stone bubble (indestructible blocker)
// 9: Ice bubble (needs thawing)
// 10: Bomb bubble (explodes surrounding 2-rad when matched/hit)

export const COLOR_MAP: { [key: number]: string } = {
  1: 'red',
  2: 'blue',
  3: 'green',
  4: 'yellow',
  5: 'purple',
  6: 'orange',
  7: 'cyan',
};

export const PREMADE_LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: "Bubble Basics",
    themeId: "neon_cosmic",
    movesLimit: 25,
    scoreTarget: { 1: 1000, 2: 2500, 3: 4000 },
    coinsReward: 100,
    grid: [
      [1, 1, 2, 2, 3, 3, 4, 4],
      [1, 2, 2, 3, 3, 4, 4],
      [0, 1, 1, 0, 0, 2, 2, 0],
      [0, 3, 3, 0, 4, 4, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ]
  },
  {
    id: 2,
    title: "Honeycomb Valley",
    themeId: "candy_pop",
    movesLimit: 24,
    scoreTarget: { 1: 1500, 2: 3000, 3: 5000 },
    coinsReward: 120,
    grid: [
      [2, 2, 5, 5, 5, 5, 2, 2],
      [2, 5, 6, 6, 6, 5, 2],
      [0, 6, 1, 1, 1, 6, 0, 0],
      [0, 1, 4, 4, 1, 0, 0],
      [0, 0, 4, 4, 0, 0, 0, 0]
    ]
  },
  {
    id: 3,
    title: "Neon Wave",
    themeId: "neon_cosmic",
    movesLimit: 26,
    scoreTarget: { 1: 1800, 2: 3500, 3: 5500 },
    coinsReward: 140,
    grid: [
      [4, 4, 1, 1, 2, 2, 3, 3],
      [4, 1, 1, 2, 2, 3, 3],
      [1, 1, 0, 0, 0, 0, 2, 2],
      [1, 0, 1, 1, 2, 0, 2],
      [0, 0, 1, 0, 2, 0, 0, 0]
    ]
  },
  {
    id: 4,
    title: "Forest Canopy",
    themeId: "forest_quest",
    movesLimit: 22,
    scoreTarget: { 1: 2000, 2: 4000, 3: 6000 },
    coinsReward: 150,
    grid: [
      [3, 3, 3, 3, 3, 3, 3, 3],
      [5, 5, 2, 2, 2, 5, 5],
      [5, 0, 2, 4, 4, 2, 0, 5],
      [0, 4, 1, 1, 4, 0, 0],
      [0, 0, 1, 1, 0, 0, 0, 0]
    ]
  },
  {
    id: 5,
    title: "The Ice Lock",
    themeId: "candy_pop",
    movesLimit: 28,
    scoreTarget: { 1: 2200, 2: 4500, 3: 7000 },
    coinsReward: 180,
    grid: [
      [9, 9, 9, 9, 9, 9, 9, 9], // Top row ice!
      [1, 1, 2, 2, 2, 1, 1],
      [1, 2, 6, 6, 6, 2, 1, 0],
      [0, 6, 3, 3, 6, 0, 0],
      [0, 0, 3, 3, 0, 0, 0, 0]
    ]
  },
  {
    id: 6,
    title: "Stone Citadel",
    themeId: "forest_quest",
    movesLimit: 30,
    scoreTarget: { 1: 2500, 2: 5000, 3: 8000 },
    coinsReward: 200,
    grid: [
      [7, 7, 7, 7, 7, 7, 7, 7], // Top row stone barriers!
      [2, 2, 5, 5, 5, 2, 2],
      [1, 1, 8, 8, 8, 8, 1, 1], // Ice in third row
      [4, 4, 3, 3, 4, 4, 4],
      [0, 3, 0, 0, 0, 3, 0, 0]
    ]
  },
  {
    id: 7,
    title: "Sunset Cascade",
    themeId: "sunset_synthwave",
    movesLimit: 25,
    scoreTarget: { 1: 2000, 2: 4500, 3: 7500 },
    coinsReward: 200,
    grid: [
      [6, 6, 1, 1, 2, 2, 5, 5],
      [6, 1, 10, 10, 10, 2, 5], // Contains embedded Bomb (10 represents special game grid bomb!)
      [0, 3, 3, 4, 4, 3, 3, 0],
      [0, 0, 4, 8, 8, 4, 0], // Ice blockers
      [0, 0, 0, 0, 0, 0, 0, 0]
    ]
  },
  {
    id: 8,
    title: "Deep Crystals",
    themeId: "sunset_synthwave",
    movesLimit: 32,
    scoreTarget: { 1: 3000, 2: 6000, 3: 9500 },
    coinsReward: 220,
    grid: [
      [5, 5, 7, 7, 7, 7, 5, 5],
      [2, 2, 8, 8, 8, 2, 2],
      [2, 6, 6, 1, 1, 6, 6, 2],
      [0, 1, 3, 3, 1, 0, 0],
      [0, 0, 3, 3, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ]
  },
  {
    id: 9,
    title: "Arrow of Fire",
    themeId: "neon_cosmic",
    movesLimit: 25,
    scoreTarget: { 1: 2500, 2: 5500, 3: 8500 },
    coinsReward: 240,
    grid: [
      [0, 0, 3, 3, 3, 3, 0, 0],
      [0, 0, 3, 10, 3, 0, 0], // Bomb placed
      [0, 1, 1, 4, 4, 1, 1, 0],
      [0, 1, 8, 8, 8, 1, 0],
      [0, 0, 2, 2, 2, 0, 0, 0],
      [0, 0, 0, 2, 0, 0, 0, 0]
    ]
  },
  {
    id: 10,
    title: "Chamber of Ice",
    themeId: "candy_pop",
    movesLimit: 30,
    scoreTarget: { 1: 3000, 2: 6500, 3: 10000 },
    coinsReward: 250,
    grid: [
      [8, 8, 1, 1, 2, 2, 8, 8],
      [8, 5, 5, 6, 6, 5, 8],
      [0, 8, 3, 4, 4, 3, 8, 0],
      [0, 0, 8, 10, 8, 0, 0],
      [0, 0, 0, 8, 0, 0, 0, 0]
    ]
  },
  {
    id: 11,
    title: "Royal Crown",
    themeId: "forest_quest",
    movesLimit: 28,
    scoreTarget: { 1: 3500, 2: 7000, 3: 11000 },
    coinsReward: 260,
    grid: [
      [7, 1, 7, 2, 2, 7, 3, 7], // Crowns with Stones interspersed!
      [5, 5, 8, 8, 8, 5, 5],
      [0, 6, 6, 4, 4, 6, 6, 0],
      [0, 0, 1, 10, 1, 0, 0],
      [0, 0, 0, 2, 0, 0, 0, 0]
    ]
  },
  {
    id: 12,
    title: "Infinity Heart",
    themeId: "sunset_synthwave",
    movesLimit: 35,
    scoreTarget: { 1: 4000, 2: 8000, 3: 12000 },
    coinsReward: 300,
    grid: [
      [0, 1, 1, 0, 0, 1, 1, 0], // Heart shape!
      [1, 5, 5, 1, 1, 5, 5],
      [1, 5, 10, 6, 6, 10, 5, 1],
      [0, 1, 6, 2, 2, 6, 1, 0],
      [0, 0, 2, 3, 2, 0, 0, 0],
      [0, 0, 0, 3, 0, 0, 0, 0]
    ]
  },
  {
    id: 13,
    title: "Megabomb Fortress",
    themeId: "neon_cosmic",
    movesLimit: 34,
    scoreTarget: { 1: 5000, 2: 9500, 3: 14000 },
    coinsReward: 350,
    grid: [
      [7, 7, 10, 7, 7, 10, 7, 7], // Stone fortress protected by bombs!
      [8, 8, 8, 8, 8, 8, 8],
      [1, 2, 3, 4, 5, 6, 1, 2],
      [2, 3, 4, 5, 6, 1, 2],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ]
  },
  {
    id: 14,
    title: "Glacier Grotto",
    themeId: "candy_pop",
    movesLimit: 36,
    scoreTarget: { 1: 4500, 2: 9000, 3: 13500 },
    coinsReward: 380,
    grid: [
      [8, 8, 8, 8, 8, 8, 8, 8],
      [8, 1, 2, 3, 2, 1, 8],
      [8, 8, 4, 5, 4, 8, 8, 8],
      [1, 8, 8, 10, 8, 8, 1],
      [0, 1, 8, 8, 8, 1, 0, 0],
      [0, 0, 2, 2, 2, 0, 0, 0]
    ]
  },
  {
    id: 15,
    title: "The Ultimate Gauntlet",
    themeId: "sunset_synthwave",
    movesLimit: 40,
    scoreTarget: { 1: 6000, 2: 12000, 3: 18000 },
    coinsReward: 500,
    grid: [
      [7, 7, 7, 10, 10, 7, 7, 7], // Giant stone ceiling block flanked by bombs
      [8, 8, 8, 8, 8, 8, 8],
      [1, 2, 3, 4, 5, 6, 1, 2],
      [6, 5, 4, 3, 2, 1, 6],
      [0, 1, 2, 10, 2, 1, 0, 0],
      [0, 0, 3, 8, 3, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 0, 0]
    ]
  }
];

// Generates procedural level layouts for level 16 onwards with beautiful math seeds!
export function getLevelConfig(levelId: number): LevelConfig {
  if (levelId <= PREMADE_LEVELS.length) {
    return PREMADE_LEVELS[levelId - 1];
  }

  // Determine theme by shifting every few levels
  const themes = ["neon_cosmic", "candy_pop", "forest_quest", "sunset_synthwave"];
  const themeId = themes[levelId % themes.length];

  // Procedural attributes scale with level id
  const movesLimit = Math.max(18, 25 + Math.floor(levelId / 5) - (levelId % 3));
  const scoreBase = 3000 + (levelId - 10) * 400;
  const scoreTarget = {
    1: scoreBase,
    2: Math.floor(scoreBase * 2.2),
    3: Math.floor(scoreBase * 3.5),
  };
  const coinsReward = Math.min(1000, 150 + (levelId - 15) * 15);

  // Generate grid mathematically based on seeds derived from level number
  const rowsCount = Math.min(8, 5 + Math.floor(levelId / 12));
  const grid: number[][] = [];

  for (let r = 0; r < rowsCount; r++) {
    const isOdd = r % 2 !== 0;
    const colCount = isOdd ? 7 : 8;
    const rowCells: number[] = [];

    for (let c = 0; c < colCount; c++) {
      // Deterministic math seed
      const seed = Math.sin(levelId * 13.5 + r * 7.8 + c * 4.9);
      const absSeed = Math.abs(seed);

      if (r === 0) {
        // Top row holds either blocker or color
        if (absSeed < 0.15) {
          rowCells.push(7); // Stone
        } else if (absSeed < 0.35) {
          rowCells.push(8); // Ice
        } else {
          // Normal colors (1-6)
          const colorIdx = 1 + Math.floor(absSeed * 6789) % 6;
          rowCells.push(colorIdx);
        }
      } else if (r === 1 || r === 2) {
        if (absSeed < 0.1) {
          rowCells.push(10); // Bomb
        } else if (absSeed < 0.25) {
          rowCells.push(8); // Ice
        } else {
          const colorIdx = 1 + Math.floor(absSeed * 1234) % 6;
          rowCells.push(colorIdx);
        }
      } else if (r === 3 || r === 4) {
        if (absSeed < 0.5) {
          const colorIdx = 1 + Math.floor(absSeed * 4567) % 6;
          rowCells.push(colorIdx);
        } else {
          rowCells.push(0); // empty spacing
        }
      } else {
        // lower levels mostly empty to give shoot room
        if (absSeed < 0.2) {
          const colorIdx = 1 + Math.floor(absSeed * 5678) % 6;
          rowCells.push(colorIdx);
        } else {
          rowCells.push(0);
        }
      }
    }
    grid.push(rowCells);
  }

  // Ensure top row always has at least some pop-able bubbles to avoid fully softlocked layouts
  const hasColor = grid[0].some(val => val >= 1 && val <= 6);
  if (!hasColor) {
    grid[0][1] = 1;
    grid[0][2] = 2;
    grid[0][5] = 3;
  }

  return {
    id: levelId,
    title: `Cosmic Lab ${levelId}`,
    themeId,
    movesLimit,
    scoreTarget,
    coinsReward,
    grid,
  };
}
