import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Sparkles, 
  Flame, Zap, Coins, Award, HelpCircle, ArrowLeft, ChevronRight, ShoppingBag
} from 'lucide-react';
import { 
  GameMode, GridBubble, Projectile, Particle, FallingBubble, 
  PopAnimation, GameTheme, LevelConfig, PlayerStats, BubbleColor, BubbleType 
} from '../types';
import { audio } from '../audio';
import { COLOR_MAP } from '../levels';

interface GameBoardProps {
  mode: GameMode;
  levelConfig: LevelConfig;
  theme: GameTheme;
  playerStats: PlayerStats;
  updateStats: (stats: Partial<PlayerStats>) => void;
  onBackToMenu: () => void;
  onNextLevel?: () => void;
  onShopClick?: () => void;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  subtext: string;
  color: string;
  life: number;
  maxLife: number;
}

// Coordinate & Grid constants for Canvas
const CANVAS_WIDTH = 440;
const CANVAS_HEIGHT = 580;
const BUBBLE_RADIUS = 20;
const ROW_SPACING = 34; // vertical distance between rows (roughly R * sqrt(3))
const LAUNCHER_X = CANVAS_WIDTH / 2;
const LAUNCHER_Y = CANVAS_HEIGHT - 60;
const CEILING_LIMIT = 460; // Lose condition is row passing this Y coordinate

export default function GameBoard({
  mode,
  levelConfig,
  theme,
  playerStats,
  updateStats,
  onBackToMenu,
  onNextLevel,
  onShopClick
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core level values (reset when levelConfig changes)
  const [movesLeft, setMovesLeft] = useState(levelConfig.movesLimit || 30);
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit || 90);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Powerup Launcher triggers
  const [activePowerUp, setActivePowerUp] = useState<BubbleType>('normal');
  const [nextColor, setNextColor] = useState<BubbleColor>('red');
  const [currentColor, setCurrentColor] = useState<BubbleColor>('blue');

  // Ad simulator variables
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [isMuted, setIsMuted] = useState(audio.getMute());

  // Engine state (stored in refs for the 60FPS animation loop)
  const gridRef = useRef<GridBubble[][]>([]);
  const projectileRef = useRef<Projectile | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const fallingRef = useRef<FallingBubble[]>([]);
  const popAnimsRef = useRef<PopAnimation[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextQueuedColorRef = useRef<BubbleColor>('yellow');

  // Visual offsets for drawing the overall mesh ceiling drop over time
  const [ceilingProgress, setCeilingProgress] = useState(0);
  const ceilingYOffsetRef = useRef(0);

  // Mouse / Touch tracking for aim pathing
  const [aimAngle, setAimAngle] = useState<number | null>(null);
  const [isAiming, setIsAiming] = useState(false);

  // Initialize/reset game layout
  useEffect(() => {
    initLevel();
  }, [levelConfig]);

  // Handle timer in Time Mode
  useEffect(() => {
    if (mode === 'time' && timeLeft > 0 && !isGameOver && !isVictory && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            checkGameOver(true); // out of time
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, timeLeft, isGameOver, isVictory, isPaused]);

  // Bubble color cycle pool
  const getRandomActiveColor = (grid: GridBubble[][]): BubbleColor => {
    const activeColors: BubbleColor[] = [];
    grid.forEach(row => {
      row.forEach(b => {
        if (b && b.color !== 'none') {
          activeColors.push(b.color);
        }
      });
    });

    if (activeColors.length > 0) {
      return activeColors[Math.floor(Math.random() * activeColors.length)];
    }

    const defaultColors: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
    return defaultColors[Math.floor(Math.random() * defaultColors.length)];
  };

  const getThemeColorsArray = (): string[] => {
    return ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4'];
  };

  const initLevel = () => {
    // Reset scores & limits
    setScore(0);
    setCombo(0);
    setCoinsCollected(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setActivePowerUp('normal');
    
    setMovesLeft(levelConfig.movesLimit || 32);
    setTimeLeft(levelConfig.timeLimit || 120);
    ceilingYOffsetRef.current = 0;

    // Build grid from level config layout
    const initialGrid: GridBubble[][] = [];
    levelConfig.grid.forEach((rowVals, r) => {
      const rowBubbles: GridBubble[] = [];
      rowVals.forEach((val, c) => {
        if (val === 0) {
          rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: 'none', type: 'normal' });
        } else if (val >= 1 && val <= 7) {
          rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: COLOR_MAP[val] as BubbleColor, type: 'normal' });
        } else if (val === 8) {
          rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: 'none', type: 'stone' });
        } else if (val === 9) {
          rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: 'none', type: 'ice' });
        } else if (val === 10) {
          rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: 'none', type: 'bomb' });
        } else {
          rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: 'none', type: 'normal' });
        }
      });
      initialGrid.push(rowBubbles);
    });

    // Make sure we have buffer empty rows at the bottom (up to row 14)
    for (let r = initialGrid.length; r < 14; r++) {
      const rowBubbles: GridBubble[] = [];
      const colCount = r % 2 === 0 ? 10 : 9;
      for (let c = 0; c < colCount; c++) {
        rowBubbles.push({ id: `${r}-${c}`, row: r, col: c, color: 'none', type: 'normal' });
      }
      initialGrid.push(rowBubbles);
    }

    gridRef.current = initialGrid;
    projectileRef.current = null;
    particlesRef.current = [];
    fallingRef.current = [];
    popAnimsRef.current = [];
    floatingTextsRef.current = [];

    // Queue up launcher bubbles
    const firstCol = getRandomActiveColor(initialGrid);
    const secondCol = getRandomActiveColor(initialGrid);
    const thirdCol = getRandomActiveColor(initialGrid);

    setCurrentColor(firstCol);
    setNextColor(secondCol);
    nextQueuedColorRef.current = thirdCol;
  };

  // Switch positions of current and next bubble in the launcher
  const swapLauncherBubbles = () => {
    if (activePowerUp !== 'normal') return; // Cannot swap powerups
    setCurrentColor(nextColor);
    setNextColor(currentColor);
    audio.playClick();
  };

  // Mute toggle helper
  const handleToggleMute = () => {
    const state = audio.toggleMute();
    setIsMuted(state);
  };

  // Convert column/row to X/Y on canvas
  const getBubblePosition = (row: number, col: number) => {
    const isOdd = row % 2 !== 0;
    const xOffset = isOdd ? BUBBLE_RADIUS : 0;
    const x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + xOffset;
    const y = row * ROW_SPACING + BUBBLE_RADIUS + ceilingYOffsetRef.current;
    return { x, y };
  };

  // Reverse X/Y to find row and col
  const getGridCoordinates = (x: number, y: number) => {
    const row = Math.round((y - BUBBLE_RADIUS - ceilingYOffsetRef.current) / ROW_SPACING);
    const isOdd = row % 2 !== 0;
    const xOffset = isOdd ? BUBBLE_RADIUS : 0;
    const col = Math.round((x - BUBBLE_RADIUS - xOffset) / (BUBBLE_RADIUS * 2));
    return { row, col };
  };

  // Match 3 finder (DFS)
  const findMatches = (startRow: number, startCol: number, searchColor: BubbleColor): GridBubble[] => {
    if (searchColor === 'none') return [];
    const matches: GridBubble[] = [];
    const visited = new Set<string>();
    const stack: GridBubble[] = [gridRef.current[startRow][startCol]];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const key = `${current.row}-${current.col}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (current.color === searchColor && current.type === 'normal') {
        matches.push(current);
        const neighbors = getNeighbors(current.row, current.col);
        neighbors.forEach(n => {
          if (!visited.has(`${n.row}-${n.col}`)) {
            stack.push(n);
          }
        });
      }
    }
    return matches;
  };

  // Look up surrounding hex neighbors in odd/even shifted grids
  const getNeighbors = (row: number, col: number): GridBubble[] => {
    const neighbors: GridBubble[] = [];
    const isOdd = row % 2 !== 0;

    let possibleOffsets = [];
    if (isOdd) {
      possibleOffsets = [
        { r: -1, c: 0 }, { r: -1, c: 1 },
        { r: 0, c: -1 },                 { r: 0, c: 1 },
        { r: 1, c: 0 },  { r: 1, c: 1 }
      ];
    } else {
      possibleOffsets = [
        { r: -1, c: -1 }, { r: -1, c: 0 },
        { r: 0, c: -1 },                  { r: 0, c: 1 },
        { r: 1, c: -1 },  { r: 1, c: 0 }
      ];
    }

    possibleOffsets.forEach(off => {
      const r = row + off.r;
      const c = col + off.c;
      if (r >= 0 && r < gridRef.current.length) {
        const rowData = gridRef.current[r];
        if (c >= 0 && c < rowData.length) {
          if (rowData[c]) {
            neighbors.push(rowData[c]);
          }
        }
      }
    });

    return neighbors;
  };

  // Standard BFS to find floating bubble structures starting at ceiling anchors
  const dropFloatingBubbles = (): GridBubble[] => {
    const connected = new Set<string>();
    const queue: GridBubble[] = [];
    const grid = gridRef.current;

    // Start with all active bubbles in the top row (row 0)
    grid[0].forEach(b => {
      if (b && (b.color !== 'none' || b.type !== 'normal')) {
        queue.push(b);
        connected.add(`${b.row}-${b.col}`);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getNeighbors(current.row, current.col);
      neighbors.forEach(n => {
        const key = `${n.row}-${n.col}`;
        if (!connected.has(key) && (n.color !== 'none' || n.type !== 'normal')) {
          connected.add(key);
          queue.push(n);
        }
      });
    }

    // Every non-empty bubble not registered in connected set is floating!
    const dropped: GridBubble[] = [];
    grid.forEach(row => {
      row.forEach(b => {
        if (b && (b.color !== 'none' || b.type !== 'normal')) {
          const key = `${b.row}-${b.col}`;
          if (!connected.has(key)) {
            dropped.push({ ...b });
            // Erase from core grid
            b.color = 'none';
            b.type = 'normal';
          }
        }
      });
    });

    return dropped;
  };

  // Spark up dynamic colorful particles
  const spawnParticles = (x: number, y: number, color: string, count = 12, type: 'circle' | 'star' | 'leaf' = 'circle') => {
    const colors = color === 'rainbow' 
      ? ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'] 
      : [color, '#ffffff', '#ffd700'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 20),
        shape: type
      });
    }
  };

  // Add falling physics to bubbles dropped from disconnected lines
  const addFallingBubbles = (bubbles: GridBubble[]) => {
    bubbles.forEach(b => {
      const pos = getBubblePosition(b.row, b.col);
      fallingRef.current.push({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() * 3 - 1.5),
        vy: -1 - Math.random() * 3, // slightly upward pop bounce
        color: b.color,
        type: b.type,
        radius: BUBBLE_RADIUS,
        rotation: Math.random() * Math.PI * 2,
        rv: (Math.random() * 0.1 - 0.05)
      });
    });
  };

  // Perform Bomb Power-up impact
  const triggerBombImpact = (targetRow: number, targetCol: number) => {
    audio.playBombExplode();
    const radiusPos = getBubblePosition(targetRow, targetCol);
    
    // Spawn custom smoke particles & fire shockwaves
    spawnParticles(radiusPos.x, radiusPos.y, '#f97316', 35);
    spawnParticles(radiusPos.x, radiusPos.y, '#ffd700', 25, 'star');

    // Blow up all bubbles within 2 grid step index neighbors
    const grid = gridRef.current;
    const affected: GridBubble[] = [];
    
    for (let r = Math.max(0, targetRow - 2); r <= Math.min(grid.length - 1, targetRow + 2); r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell && (cell.color !== 'none' || cell.type !== 'normal')) {
          // Check physical distance
          const cellPos = getBubblePosition(r, c);
          const dist = Math.hypot(cellPos.x - radiusPos.x, cellPos.y - radiusPos.y);
          if (dist <= BUBBLE_RADIUS * 4.2) {
            affected.push({ ...cell });
            cell.color = 'none';
            cell.type = 'normal';
          }
        }
      }
    }

    // Animate exploded bubbles blowing outwards
    addFallingBubbles(affected);
    setScore(prev => prev + affected.length * 150);
  };

  // Main snapping, matching, and secondary reaction solver
  const handleBubbleSnap = (proj: Projectile, finalRow: number, finalCol: number) => {
    const grid = gridRef.current;
    
    // Ensure bounds
    if (finalRow < 0 || finalRow >= grid.length || finalCol < 0 || finalCol >= grid[finalRow].length) {
      return;
    }

    const targetCell = grid[finalRow][finalCol];
    
    // Laser powerup handles clicks/collisions directly by instantly bursting
    if (proj.type === 'laser') {
      audio.playLaserBeam();
      targetCell.color = 'none';
      targetCell.type = 'normal';
      spawnParticles(proj.x, proj.y, '#a855f7', 25, 'star');
      dropAndCheck();
      return;
    }

    // Fire powerup cuts through bubbles and incinerates everything in columns
    if (proj.type === 'fire') {
      triggerBombImpact(finalRow, finalCol);
      dropAndCheck();
      return;
    }

    // Bomb powerup blows up radius
    if (proj.type === 'bomb') {
      triggerBombImpact(finalRow, finalCol);
      dropAndCheck();
      return;
    }

    // Handle Rainbow logic or Normal
    let placedColor = proj.color;
    if (proj.type === 'rainbow') {
      // Pick first color near collision neighbors or first random color
      const neighbors = getNeighbors(finalRow, finalCol);
      const colorNeighbor = neighbors.find(n => n.color !== 'none');
      placedColor = colorNeighbor ? colorNeighbor.color : getRandomActiveColor(grid);
    }

    // Set grid coordinates
    targetCell.color = placedColor;
    targetCell.type = 'normal';

    // Highlight placing
    const pos = getBubblePosition(finalRow, finalCol);
    popAnimsRef.current.push({
      x: pos.x,
      y: pos.y,
      color: COLOR_MAP_HEX[placedColor] || '#ffffff',
      radius: BUBBLE_RADIUS,
      progress: 0.1
    });

    // Check Matches
    const matches = findMatches(finalRow, finalCol, placedColor);

    if (matches.length >= 3) {
      // Pop matches
      const comboIncr = combo + 1;
      setCombo(comboIncr);
      audio.playCombo(comboIncr);

      const matchPoints = matches.length * 100 * comboIncr;
      setScore(prev => prev + matchPoints);

      // Add floating text pop-up animation on the canvas whenever a combo of 3 or more is achieved
      if (comboIncr >= 3) {
        const spotPos = getBubblePosition(finalRow, finalCol);
        floatingTextsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x: spotPos.x,
          y: spotPos.y,
          text: `${comboIncr}x Combo!`,
          subtext: `+${matchPoints} PTS`,
          color: COLOR_MAP_HEX[placedColor] || '#ffffff',
          life: 0,
          maxLife: 70
        });
      }

      // Add coins based on score/stars
      const extraCoins = Math.floor(matches.length / 2);
      setCoinsCollected(prev => prev + extraCoins);

      matches.forEach(m => {
        const mCell = grid[m.row][m.col];
        mCell.color = 'none';
        mCell.type = 'normal';

        const matchPos = getBubblePosition(m.row, m.col);
        spawnParticles(matchPos.x, matchPos.y, COLOR_MAP_HEX[placedColor], 10, theme.particleShape);
        
        // Thaw adjacent ice/blocker layers
        const neighbors = getNeighbors(m.row, m.col);
        neighbors.forEach(n => {
          if (n.type === 'ice') {
            n.type = 'normal';
            n.color = getRandomActiveColor(grid); // melt into normal color
            spawnParticles(matchPos.x, matchPos.y, '#e0f2fe', 8);
          }
        });
      });
    } else {
      // No match resets combo
      setCombo(0);
      audio.playWallBounce();
    }

    dropAndCheck();
  };

  const dropAndCheck = () => {
    // Drop floating/disconnected bubbles
    const floated = dropFloatingBubbles();
    if (floated.length > 0) {
      addFallingBubbles(floated);
      const floatPoints = floated.length * 200;
      setScore(prev => prev + floatPoints);
      setCoinsCollected(prev => prev + Math.floor(floated.length * 1.5));
    }

    // Check Victory/Loss
    checkVictoryOrLoss();
  };

  const checkVictoryOrLoss = () => {
    const grid = gridRef.current;
    
    // Victory condition: no color bubbles left in core puzzle layout
    let colorsRemaining = false;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell && cell.color !== 'none') {
          colorsRemaining = true;
          break;
        }
      }
      if (colorsRemaining) break;
    }

    if (!colorsRemaining) {
      setIsVictory(true);
      audio.playWin();
      
      // Compute final stars & award stars & coins
      const starsAwarded = calculateStars();
      const updatedTotalCoins = playerStats.coins + levelConfig.coinsReward + coinsCollected;
      
      const newHighScores = { ...playerStats.highScores };
      const currentLevelScore = newHighScores.levels[levelConfig.id]?.score || 0;
      
      const nextLevelUnlocked = Math.max(playerStats.currentLevel, levelConfig.id + 1);

      if (score > currentLevelScore) {
        if (!newHighScores.levels[levelConfig.id]) {
          newHighScores.levels[levelConfig.id] = { score: 0, stars: 0 };
        }
        newHighScores.levels[levelConfig.id] = { score, stars: starsAwarded };
      }

      updateStats({
        coins: updatedTotalCoins,
        currentLevel: nextLevelUnlocked,
        highScores: newHighScores
      });
      return;
    }

    // Loss: Did we exceed the red CEILING limit boundary?
    let ceilingBreached = false;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell && (cell.color !== 'none' || cell.type === 'stone')) {
          const pos = getBubblePosition(r, c);
          if (pos.y >= CEILING_LIMIT - 10) {
            ceilingBreached = true;
            break;
          }
        }
      }
      if (ceilingBreached) break;
    }

    if (ceilingBreached) {
      checkGameOver(false); // standard loss
    }
  };

  const checkGameOver = (outOfTimeOrMoves: boolean) => {
    setIsGameOver(true);
    audio.playLose();
  };

  // Convert bubble selection to HEX specs
  const COLOR_MAP_HEX: { [key in BubbleColor]: string } = {
    red: '#f43f5e',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#fbbf24',
    purple: '#a855f7',
    orange: '#f97316',
    cyan: '#06b6d4',
    none: 'transparent'
  };

  // Shooting launch vector calculation based on selected slope angle
  const fireBubble = (angle: number) => {
    if (projectileRef.current || isPaused || isGameOver || isVictory) return;

    if (mode === 'levels' && movesLeft <= 0) {
      checkGameOver(true);
      return;
    }

    // Deduct move
    if (mode === 'levels') {
      setMovesLeft(p => p - 1);
    }

    // Set projectile vectors
    const speed = 14;
    projectileRef.current = {
      x: LAUNCHER_X,
      y: LAUNCHER_Y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentColor,
      type: activePowerUp,
      radius: BUBBLE_RADIUS
    };

    audio.playShoot();

    // Reset powerup visual back to basic
    setActivePowerUp('normal');

    // Roll next colors forward
    const grid = gridRef.current;
    setCurrentColor(nextColor);
    setNextColor(nextQueuedColorRef.current);
    nextQueuedColorRef.current = getRandomActiveColor(grid);
  };

  // Activate powers bought in shop or from count
  const selectPowerup = (type: BubbleType) => {
    if (playerStats.powerups[type as 'bomb' | 'rainbow' | 'fire' | 'laser'] <= 0) {
      // Buy/Lock feedback
      audio.playClick();
      return;
    }

    // Decrement powerup count
    const updatedPowerups = { ...playerStats.powerups };
    updatedPowerups[type as 'bomb' | 'rainbow' | 'fire' | 'laser']--;
    updateStats({ powerups: updatedPowerups });

    // Arm launcher
    setActivePowerUp(type);
    audio.playPowerup();
  };

  // 60FPS Render & Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const gameLoop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Draw Background Ambient effects
      drawBackgroundGrid(ctx);

      // 2. Render Ceiling limit threshold
      drawCeilingThreshold(ctx);

      // 3. Render grid bubbles inside honeycomb layout
      drawGrid(ctx);

      // 4. Update and draw existing projectile
      updateAndDrawProjectile(ctx);

      // 5. Update and draw falling disconnected bubbles
      updateAndDrawFalling(ctx);

      // 6. Update and draw blast bubbles pops expansion circle
      updateAndDrawPops(ctx);

      // Floating text pop-ups for combos
      updateAndDrawFloatingTexts(ctx);

      // 7. Update and draw micro sparks physics particles
      updateAndDrawParticles(ctx);

      // 8. Draw launcher & upcoming reloaders
      drawLauncher(ctx);

      // 9. Draw interactive neon Aim Guideline dotted ray
      if (isAiming && aimAngle !== null) {
        drawAimLine(ctx, aimAngle);
      }

      animFrame = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animFrame);
  }, [currentColor, nextColor, isAiming, aimAngle, activePowerUp, theme, ceilingProgress, isPaused]);

  // Visuals: Draw starry background grids
  const drawBackgroundGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = theme.wallColor + '15';
    ctx.lineWidth = 1;
    // Draw honeycomb vertical lanes
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
  };

  const drawCeilingThreshold = (ctx: CanvasRenderingContext2D) => {
    // Loss border indicator
    ctx.strokeStyle = '#ef444450';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CEILING_LIMIT);
    ctx.lineTo(CANVAS_WIDTH, CEILING_LIMIT);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash pattern
  };

  // Draw core puzzle grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const grid = gridRef.current;
    grid.forEach((row, r) => {
      row.forEach((b, c) => {
        if (!b) return;
        if (b.color === 'none' && b.type === 'normal') return;

        const pos = getBubblePosition(r, c);
        
        // Skip rendering if offscreen bottom
        if (pos.y > CANVAS_HEIGHT + BUBBLE_RADIUS) return;

        drawBubble(ctx, pos.x, pos.y, b.color, b.type);
      });
    });
  };

  // Render individual colorful bubble with customized textures/skins
  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, color: BubbleColor, type: BubbleType) => {
    ctx.save();
    
    // Core color shadow glows
    const hex = COLOR_MAP_HEX[color] || '#ffffff';
    
    if (theme.bubbleStyle === 'neon') {
      ctx.shadowBlur = 8;
      ctx.shadowColor = hex;
    }

    if (type === 'stone') {
      // Draw standard metallic/dark stone blocker pattern
      const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, BUBBLE_RADIUS);
      grad.addColorStop(0, '#a1a1aa');
      grad.addColorStop(1, '#3f3f46');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
      ctx.fill();

      // Stone cracks
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 8);
      ctx.lineTo(x + 5, y + 5);
      ctx.moveTo(x + 8, y - 6);
      ctx.lineTo(x - 4, y + 8);
      ctx.stroke();
    } else if (type === 'ice') {
      // Draw sub-ice light-blue freezing crystal overlay
      const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, BUBBLE_RADIUS);
      grad.addColorStop(0, '#f0f9ff');
      grad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.5;
      
      ctx.beginPath();
      ctx.arc(x, y, BUBBLE_RADIUS - 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crystal sparkles inside ice
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - 5, y - 5, 3, 0, Math.PI * 2);
      ctx.arc(x + 6, y + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'bomb') {
      // Dark fiery fuse bomb bubble
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;
      const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, BUBBLE_RADIUS);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.4, '#18181b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
      ctx.fill();

      // Spark fuse
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - BUBBLE_RADIUS);
      ctx.quadraticCurveTo(x + 10, y - BUBBLE_RADIUS - 5, x + 8, y - BUBBLE_RADIUS - 10);
      ctx.stroke();

      // Yellow fuse spark point
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + 8, y - BUBBLE_RADIUS - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal colorful bubble bubble skin
      const grad = ctx.createRadialGradient(
        x - BUBBLE_RADIUS * 0.3,
        y - BUBBLE_RADIUS * 0.3,
        BUBBLE_RADIUS * 0.1,
        x,
        y,
        BUBBLE_RADIUS
      );

      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, hex);
      grad.addColorStop(1, adjustColorBrightness(hex, -40));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Add elegant glassy highlight shell to upper-left quadrant
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x - BUBBLE_RADIUS * 0.3, y - BUBBLE_RADIUS * 0.3, BUBBLE_RADIUS * 0.3, BUBBLE_RADIUS * 0.15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const adjustColorBrightness = (hex: string, percent: number) => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, R + percent));
    G = Math.min(255, Math.max(0, G + percent));
    B = Math.min(255, Math.max(0, B + percent));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  // Launch tracking calculations
  const updateAndDrawProjectile = (ctx: CanvasRenderingContext2D) => {
    const proj = projectileRef.current;
    if (!proj) return;

    // Tick frame position
    proj.x += proj.vx;
    proj.y += proj.vy;

    // Wall Bounce mechanics
    if (proj.x - proj.radius <= 0) {
      proj.x = proj.radius;
      proj.vx = -proj.vx;
      audio.playWallBounce();
      spawnParticles(proj.x, proj.y, COLOR_MAP_HEX[proj.color] || '#ffffff', 4);
    } else if (proj.x + proj.radius >= CANVAS_WIDTH) {
      proj.x = CANVAS_WIDTH - proj.radius;
      proj.vx = -proj.vx;
      audio.playWallBounce();
      spawnParticles(proj.x, proj.y, COLOR_MAP_HEX[proj.color] || '#ffffff', 4);
    }

    // Special Laser effect pops elements instantly as it cuts, otherwise snaps standard
    let collided = false;
    let targetRow = 0, targetCol = 0;

    // Ceiling impact
    if (proj.y - proj.radius <= 0) {
      collided = true;
      // Get nearest target col
      const coords = getGridCoordinates(proj.x, BUBBLE_RADIUS + ceilingYOffsetRef.current);
      targetRow = 0;
      targetCol = Math.max(0, Math.min(coords.col, 9));
    } else {
      // Check grid bubble collisions
      const grid = gridRef.current;
      outerLoop: for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const b = grid[r][c];
          if (b && (b.color !== 'none' || b.type !== 'normal')) {
            const bPos = getBubblePosition(r, c);
            const dist = Math.hypot(bPos.x - proj.x, bPos.y - proj.y);
            
            // Core circle overlap bounding
            if (dist < BUBBLE_RADIUS * 1.8) {
              collided = true;
              
              // Backtrack a tiny bit along inverse vector velocity to place it perfectly in empty slot
              const backX = proj.x - proj.vx * 0.4;
              const backY = proj.y - proj.vy * 0.4;
              const snap = getGridCoordinates(backX, backY);
              
              targetRow = snap.row;
              targetCol = snap.col;

              // Grid bounds check, fallback to nearest neighbor slots
              if (targetRow < 0) targetRow = 0;
              if (targetRow >= grid.length) targetRow = grid.length - 1;
              const maxCols = targetRow % 2 === 0 ? 10 : 9;
              targetCol = Math.max(0, Math.min(targetCol, maxCols - 1));

              // If the calculated spot is already full, find closest neighboring spot that is empty
              if (grid[targetRow][targetCol] && (grid[targetRow][targetCol].color !== 'none' || grid[targetRow][targetCol].type !== 'normal')) {
                const emptyNeighbors = getNeighbors(targetRow, targetCol).filter(
                  n => n.color === 'none' && n.type === 'normal'
                );
                if (emptyNeighbors.length > 0) {
                  // Find nearest to projectile
                  let nearestNode = emptyNeighbors[0];
                  let minDist = Infinity;
                  emptyNeighbors.forEach(n => {
                    const nPos = getBubblePosition(n.row, n.col);
                    const d = Math.hypot(nPos.x - backX, nPos.y - backY);
                    if (d < minDist) {
                      minDist = d;
                      nearestNode = n;
                    }
                  });
                  targetRow = nearestNode.row;
                  targetCol = nearestNode.col;
                }
              }

              break outerLoop;
            }
          }
        }
      }
    }

    if (collided) {
      projectileRef.current = null;
      handleBubbleSnap(proj, targetRow, targetCol);
    } else {
      // Render
      const drawCol: BubbleColor = proj.type === 'rainbow' ? 'none' : proj.color;
      drawBubble(ctx, proj.x, proj.y, drawCol, proj.type);
    }
  };

  // Falling particles animation logic with actual spin and rebound
  const updateAndDrawFalling = (ctx: CanvasRenderingContext2D) => {
    const falling = fallingRef.current;
    
    for (let i = falling.length - 1; i >= 0; i--) {
      const fb = falling[i];
      // Tick physics parameters
      fb.x += fb.vx;
      fb.y += fb.vy;
      fb.vy += 0.4; // gravity pulling down
      fb.rotation += fb.rv;

      // Draw bubble spin offsets
      ctx.save();
      ctx.translate(fb.x, fb.y);
      ctx.rotate(fb.rotation);
      drawBubble(ctx, 0, 0, fb.color, fb.type);
      ctx.restore();

      // Terminate out of bounding bottom
      if (fb.y - fb.radius > CANVAS_HEIGHT) {
        falling.splice(i, 1);
      }
    }
  };

  // Active growing explosion shockwave pops ring drawing
  const updateAndDrawPops = (ctx: CanvasRenderingContext2D) => {
    const anims = popAnimsRef.current;
    for (let i = anims.length - 1; i >= 0; i--) {
      const p = anims[i];
      p.progress += 0.08;

      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * (1 - p.progress);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (1 + p.progress), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (p.progress >= 1) {
        anims.splice(i, 1);
      }
    }
  };

  // Floating text updater and pop-up animator
  const updateAndDrawFloatingTexts = (ctx: CanvasRenderingContext2D) => {
    const list = floatingTextsRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      item.life += 1;
      
      // Float floating text slowly upwards
      item.y -= 0.8;
      
      const progress = item.life / item.maxLife;
      const alpha = Math.max(0, 1 - progress);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Elastic entry animation at the beginning, steady float afterwards
      let scale = 1;
      if (progress < 0.2) {
        const entryProgress = progress / 0.2;
        scale = 1.35 * Math.sin(entryProgress * Math.PI / 2);
      } else if (progress > 0.7) {
        // Slow scale-down near fade-out
        scale = 1 - (progress - 0.7) / 0.3 * 0.2;
      }
      
      ctx.translate(item.x, item.y);
      ctx.scale(scale, scale);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Bold title (e.g. "3x Combo!")
      ctx.font = '900 24px "Space Grotesk", "Inter", sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.strokeText(item.text.toUpperCase(), 0, -11);
      
      // Neon/Vibrant core text fill
      ctx.fillStyle = item.color;
      ctx.fillText(item.text.toUpperCase(), 0, -11);
      
      // Score details (e.g. "+900 PTS")
      ctx.font = '800 15px "JetBrains Mono", sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(item.subtext, 0, 11);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.subtext, 0, 11);
      
      ctx.restore();
      
      if (item.life >= item.maxLife) {
        list.splice(i, 1);
      }
    }
  };

  // Sparks & visual leaf shapes system updating loop
  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    const parts = particlesRef.current;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      
      if (p.shape === 'star') {
        // Draw starry spark
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(p.x + p.size * Math.cos((j * 4 * Math.PI) / 5), p.y + p.size * Math.sin((j * 4 * Math.PI) / 5));
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'leaf') {
        // Nature theme leaf visual
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.life * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Circle particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (p.life >= p.maxLife) {
        parts.splice(i, 1);
      }
    }
  };

  // Shoot launcher details drawing
  const drawLauncher = (ctx: CanvasRenderingContext2D) => {
    // Elegant mechanical reload bay structure
    ctx.save();
    
    // Launcher base shell
    ctx.fillStyle = theme.panelBg;
    ctx.strokeStyle = theme.accentColor + '80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(LAUNCHER_X, LAUNCHER_Y, 35, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Direction arrow pointer ring
    ctx.save();
    ctx.translate(LAUNCHER_X, LAUNCHER_Y);
    if (aimAngle !== null) {
      ctx.rotate(aimAngle + Math.PI / 2);
    }
    
    // Draw neon mechanical barrel pointer
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -42);
    ctx.stroke();

    ctx.restore();

    // Loaded active ammunition bubble
    const drawColor: BubbleColor = activePowerUp === 'rainbow' ? 'none' : currentColor;
    drawBubble(ctx, LAUNCHER_X, LAUNCHER_Y, drawColor, activePowerUp);

    // Queue queueing reloading secondary bullet bubble (placed off next to current launcher)
    if (activePowerUp === 'normal') {
      const swapButtonX = LAUNCHER_X - 60;
      const swapButtonY = LAUNCHER_Y + 15;
      drawBubble(ctx, swapButtonX, swapButtonY, nextColor, 'normal');
      
      // Draw a subtle swapping reload cycle symbol around the reloader bubble
      ctx.strokeStyle = theme.textColor + '40';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(swapButtonX, swapButtonY, BUBBLE_RADIUS + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Dotted laser pointer prediction tracking bouncing rays helper!
  const drawAimLine = (ctx: CanvasRenderingContext2D, angle: number) => {
    ctx.save();
    ctx.strokeStyle = activePowerUp === 'laser' ? '#a855f7' : theme.accentColor + 'dd';
    ctx.lineWidth = activePowerUp === 'laser' ? 3.5 : 2;
    ctx.setLineDash(activePowerUp === 'laser' ? [] : [4, 6]);

    let startX = LAUNCHER_X;
    let startY = LAUNCHER_Y;
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Loop aim lines across bounding reflection borders
    const laserSpeed = 12;
    let projX = startX;
    let projY = startY;

    for (let bounce = 0; bounce < 3; bounce++) {
      let hitCeilingOrBubble = false;
      let nextIntersectionX = 0;
      let nextIntersectionY = 0;

      // Project ahead to find wall bounce spacing
      let distToWall = Infinity;
      if (dx < 0) {
        distToWall = (BUBBLE_RADIUS - projX) / dx;
      } else if (dx > 0) {
        distToWall = (CANVAS_WIDTH - BUBBLE_RADIUS - projX) / dx;
      }

      // Check height to ceiling
      let distToCeiling = (BUBBLE_RADIUS + ceilingYOffsetRef.current - projY) / dy;
      
      // Determine which threshold triggers first
      if (distToCeiling < distToWall && distToCeiling > 0) {
        nextIntersectionX = projX + dx * distToCeiling;
        nextIntersectionY = BUBBLE_RADIUS + ceilingYOffsetRef.current;
        hitCeilingOrBubble = true;
      } else if (distToWall !== Infinity && distToWall > 0) {
        nextIntersectionX = projX + dx * distToWall;
        nextIntersectionY = projY + dy * distToWall;
      }

      // Track bounding intersections
      ctx.lineTo(nextIntersectionX, nextIntersectionY);
      
      if (hitCeilingOrBubble) break;

      // Refresh trajectory calculations for next bounced ray segment
      projX = nextIntersectionX;
      projY = nextIntersectionY;
      dx = -dx; // reflect laser horizontal slope
    }

    ctx.stroke();
    ctx.restore();
  };

  // Event inputs: Mouse & Touch Aim triggers
  const calculateAimAngle = (evt: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in evt) {
      if (evt.touches.length === 0) return;
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    // Canvas click vectors
    const clickX = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const clickY = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Angle from launcher center point (pointing upwards)
    const angle = Math.atan2(clickY - LAUNCHER_Y, clickX - LAUNCHER_X);
    
    // Keep angle vectors pointing in upwards quadrants (-10 to -170 degrees)
    if (angle < -0.15 && angle > -Math.PI + 0.15) {
      setAimAngle(angle);
    } else if (angle >= 0 && angle < Math.PI / 2) {
      setAimAngle(-0.15); // limit right
    } else {
      setAimAngle(-Math.PI + 0.15); // limit left
    }
  };

  const handlePointerDown = (evt: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver || isVictory || projectileRef.current) return;
    setIsAiming(true);
    calculateAimAngle(evt);
  };

  const handlePointerMove = (evt: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isAiming) return;
    calculateAimAngle(evt);
  };

  const handlePointerUp = () => {
    if (!isAiming) return;
    setIsAiming(false);
    if (aimAngle !== null) {
      fireBubble(aimAngle);
    }
  };

  // Star points calculator based on current thresholds
  const calculateStars = (): number => {
    const targets = levelConfig.scoreTarget;
    if (score >= targets[3]) return 3;
    if (score >= targets[2]) return 2;
    if (score >= targets[1]) return 1;
    return 1; // standard clear minimum
  };

  const starsCount = calculateStars();

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full max-w-md mx-auto relative select-none">
      
      {/* Top HUD Stats Panel */}
      <div 
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-2xl mb-2 border backdrop-blur-md"
        style={{ 
          backgroundColor: theme.panelBg + 'cc', 
          borderColor: theme.accentColor + '30',
          color: theme.textColor 
        }}
      >
        <button 
          onClick={() => { audio.playClick(); onBackToMenu(); }}
          className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest opacity-60">Level {levelConfig.id}</span>
          <span className="font-extrabold text-sm tracking-tight">{levelConfig.title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleToggleMute}
            className="p-2 hover:bg-white/5 rounded-xl transition text-white/80"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button 
            onClick={() => { audio.playClick(); setIsPaused(true); }}
            className="p-2 hover:bg-white/5 rounded-xl transition text-white/80"
          >
            <Pause size={16} />
          </button>
        </div>
      </div>

      {/* Dynamic Targets & Limits Row */}
      <div className="grid grid-cols-3 gap-2 w-full mb-2">
        {/* Moves / Time Left Badge */}
        <div 
          className="flex flex-col items-center justify-center py-2.5 rounded-xl border"
          style={{ backgroundColor: theme.panelBg + 'ff', borderColor: theme.accentColor + '20' }}
        >
          {mode === 'levels' ? (
            <>
              <span className="text-[9px] uppercase tracking-widest text-[#a855f7] font-semibold">Moves</span>
              <span className={`text-xl font-black tracking-tight ${movesLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                {movesLeft}
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-semibold">Time</span>
              <span className="text-xl font-black tracking-tight text-white">{timeLeft}s</span>
            </>
          )}
        </div>

        {/* Current Score Progress */}
        <div 
          className="flex flex-col items-center justify-center py-2.5 rounded-xl border col-span-1"
          style={{ backgroundColor: theme.panelBg + 'ff', borderColor: theme.accentColor + '20' }}
        >
          <span className="text-[9px] uppercase tracking-widest text-yellow-400 font-semibold">Score</span>
          <span className="text-xl font-black tracking-tight text-white">{score}</span>
        </div>

        {/* Current Level Rewards */}
        <div 
          className="flex flex-col items-center justify-center py-2.5 rounded-xl border"
          style={{ backgroundColor: theme.panelBg + 'ff', borderColor: theme.accentColor + '20' }}
        >
          <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">Coins</span>
          <span className="text-xl font-black tracking-tight text-emerald-400 flex items-center gap-1 justify-center">
            <Coins size={14} className="fill-emerald-400" /> +{coinsCollected}
          </span>
        </div>
      </div>

      {/* Main Canvas Mobile Screen Game Console Frame */}
      <div 
        className="relative w-full aspect-[22/29] rounded-3xl overflow-hidden border-4 shadow-2xl backdrop-blur-md cursor-crosshair touch-none"
        style={{ 
          background: theme.bgGradient, 
          borderColor: theme.accentColor + '60',
          boxShadow: `0 20px 40px -15px ${theme.accentColor}30, 0 0 25px ${theme.accentColor}10` 
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Swapping reloading overlay button (invisible/easy region to touch-swap shooter colors) */}
        {activePowerUp === 'normal' && (
          <button 
            onClick={swapLauncherBubbles}
            className="absolute bottom-3 left-18 w-16 h-16 rounded-full hover:bg-white/5 active:scale-95 transition"
            title="Swap ammunition bubble"
          />
        )}
      </div>

      {/* Bottom Powerups Dashboard Slot Panels */}
      <div 
        className="w-full mt-3 p-3 rounded-2xl border"
        style={{ backgroundColor: theme.panelBg + 'b0', borderColor: theme.accentColor + '30' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">Power-up Chamber</span>
          <button
            onClick={onShopClick}
            className="flex items-center gap-1 text-[10px] text-yellow-400 hover:underline font-bold"
          >
            <ShoppingBag size={10} /> Buy in Shop
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {/* Bomb slot */}
          <button
            onClick={() => selectPowerup('bomb')}
            disabled={playerStats.powerups.bomb <= 0}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-300 relative ${
              playerStats.powerups.bomb > 0 
                ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-700 active:scale-95 hover:border-[#f97316]' 
                : 'bg-black/40 border-zinc-800 opacity-40'
            }`}
          >
            <Shield className="text-[#f97316] fill-[#f97316]/20" size={20} />
            <span className="text-[10px] font-black text-white mt-1">Bomb</span>
            <span className="absolute -top-1 -right-1.5 bg-zinc-700 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {playerStats.powerups.bomb}
            </span>
          </button>

          {/* Rainbow slot */}
          <button
            onClick={() => selectPowerup('rainbow')}
            disabled={playerStats.powerups.rainbow <= 0}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-300 relative ${
              playerStats.powerups.rainbow > 0 
                ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-700 active:scale-95 hover:border-cyan-400' 
                : 'bg-black/40 border-zinc-800 opacity-40'
            }`}
          >
            <Sparkles className="text-cyan-400 fill-cyan-400/20" size={20} />
            <span className="text-[10px] font-black text-white mt-1">Rainbow</span>
            <span className="absolute -top-1 -right-1.5 bg-zinc-700 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {playerStats.powerups.rainbow}
            </span>
          </button>

          {/* Fire blast */}
          <button
            onClick={() => selectPowerup('fire')}
            disabled={playerStats.powerups.fire <= 0}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-300 relative ${
              playerStats.powerups.fire > 0 
                ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-700 active:scale-95 hover:border-rose-500' 
                : 'bg-black/40 border-zinc-800 opacity-40'
            }`}
          >
            <Flame className="text-rose-500 fill-rose-500/20" size={20} />
            <span className="text-[10px] font-black text-white mt-1">Fire</span>
            <span className="absolute -top-1 -right-1.5 bg-zinc-700 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {playerStats.powerups.fire}
            </span>
          </button>

          {/* Laser aim */}
          <button
            onClick={() => selectPowerup('laser')}
            disabled={playerStats.powerups.laser <= 0}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-300 relative ${
              playerStats.powerups.laser > 0 
                ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-700 active:scale-95 hover:border-purple-400' 
                : 'bg-black/40 border-zinc-800 opacity-40'
            }`}
          >
            <Zap className="text-purple-400 fill-purple-400/20" size={20} />
            <span className="text-[10px] font-black text-white mt-1">Laser</span>
            <span className="absolute -top-1 -right-1.5 bg-zinc-700 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {playerStats.powerups.laser}
            </span>
          </button>
        </div>
      </div>

      {/* Overlay Screens */}
      <AnimatePresence>
        {/* Pause Modal */}
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight flex items-center gap-2">
                Game Paused
              </h2>
              <p className="text-xs text-white/60 mb-6">Take a breath, adjust your aim, and bounce some bubbles!</p>

              <button 
                onClick={() => { audio.playClick(); setIsPaused(false); }}
                className="w-full py-3 bg-[#a855f7] hover:bg-[#b56efb] text-white font-extrabold rounded-xl shadow-lg transition duration-200 mb-3"
              >
                Resume Game
              </button>

              <button 
                onClick={() => { audio.playClick(); initLevel(); }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl transition duration-200 mb-3 flex items-center justify-center gap-1.5 text-sm"
              >
                <RotateCcw size={15} /> Restart Level
              </button>

              <button 
                onClick={() => { audio.playClick(); onBackToMenu(); }}
                className="w-full py-3 bg-transparent text-white/70 hover:text-white font-semibold rounded-xl text-sm transition"
              >
                Quit Field
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                <Shield size={32} />
              </div>
              
              <h2 className="text-2xl font-black text-rose-500 mb-1 tracking-tight">Out of Moves</h2>
              <p className="text-xs text-white/50 mb-5">You hit the danger zone or exhausted your ammo reserve.</p>

              {/* Show simulated rewarded AD to revive and continue playing! */}
              <button 
                onClick={() => { audio.playClick(); setShowAdPopup(true); }}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold rounded-xl shadow-xl transition-all duration-300 hover:brightness-110 mb-3 text-sm flex items-center justify-center gap-1.5 animate-pulse"
              >
                <Award size={16} /> Watch Ad to Revive (+5 Moves)
              </button>

              <button 
                onClick={() => { audio.playClick(); initLevel(); }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl transition duration-200 mb-3 flex items-center justify-center gap-1.5 text-sm"
              >
                <RotateCcw size={15} /> Try Again
              </button>

              <button 
                onClick={() => { audio.playClick(); onBackToMenu(); }}
                className="w-full py-3 bg-transparent text-white/70 hover:text-white font-semibold rounded-xl text-xs transition"
              >
                Return to Levels Map
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Victory Screen */}
        {isVictory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.85, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-yellow-400/20 border border-yellow-400 rounded-full flex items-center justify-center text-yellow-400 mb-2">
                <Award size={32} className="fill-yellow-400/10" />
              </div>

              <h2 className="text-3xl font-black text-yellow-400 tracking-tight uppercase">VICTORY!</h2>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Level Compiled Successfully</span>

              {/* Dynamic 1-3 Stars Reward */}
              <div className="flex items-center gap-1.5 mb-5 scale-125">
                {[1, 2, 3].map((starNum) => (
                  <span key={starNum} className={starNum <= starsCount ? 'text-yellow-400' : 'text-zinc-700'}>
                    ★
                  </span>
                ))}
              </div>

              {/* Stats Review */}
              <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-3.5 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Final Level Score</span>
                  <span className="font-extrabold text-white">{score}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-white/60">Completion Bonus</span>
                  <span className="font-extrabold text-emerald-400 flex items-center gap-0.5">
                    <Coins size={12} className="fill-emerald-400" /> +{levelConfig.coinsReward}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Grid Treasure Earned</span>
                  <span className="font-extrabold text-[#fbbf24] flex items-center gap-0.5">
                    <Coins size={12} className="fill-[#fbbf24]" /> +{coinsCollected}
                  </span>
                </div>
              </div>

              {onNextLevel && (
                <button 
                  onClick={() => { audio.playClick(); onNextLevel(); }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold rounded-2xl shadow-xl transition-all duration-300 hover:brightness-110 mb-2 flex items-center justify-center gap-1.5 text-sm"
                >
                  Clear Next Level <ChevronRight size={16} />
                </button>
              )}

              <button 
                onClick={() => { audio.playClick(); onBackToMenu(); }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl transition duration-200 flex items-center justify-center gap-1.5 text-xs"
              >
                Go to Levels Map
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Simulated Ad Reward claims */}
        {showAdPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="space-y-6 w-full max-w-sm">
              <span className="bg-zinc-800 text-yellow-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-yellow-400/20">
                Sponsor Advertising Playback
              </span>
              
              <div className="aspect-video w-full max-w-xs mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                {/* Simulated spinning circle loader */}
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3" />
                <span className="text-xs text-white/80 font-semibold mb-1">Retrieving sponsored reward...</span>
                <span className="text-[10px] text-white/40 text-center">Securing Google AdMob safe link connection</span>
                <div className="mt-2 text-[8px] bg-black/50 border border-white/5 px-2 py-0.5 rounded text-yellow-400 font-mono text-center max-w-full truncate">
                  Ad Unit: ca-app-pub-3926034554770809/5298738334
                </div>
              </div>

              <div className="flex flex-col items-center max-w-xs mx-auto space-y-2">
                <button 
                  onClick={() => {
                    audio.playClick();
                    setShowAdPopup(false);
                    setIsGameOver(false);
                    setMovesLeft(prev => prev + 5);
                    // Add some gold
                    const updatedPowerups = { ...playerStats.powerups };
                    updateStats({ coins: playerStats.coins + 50 });
                  }}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl shadow-lg transition duration-200 text-sm"
                >
                  Skip Ad & Claim Reward
                </button>
                <p className="text-[10px] text-white/50">Simulated Safe Environment: Rewards will be credited immediately.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
