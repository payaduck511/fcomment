'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameDispatch, useGameState } from './state/gameState';
import type { GameUnit, SkillCard } from './state/gameState';

type Point = {
  x: number;
  y: number;
};

type BoardGeometry = {
  boardX: number;
  boardY: number;
  boardSize: number;
  cellSize: number;
  trackWidth: number;
  pathPoints: Point[];
};

type PathMetrics = {
  points: Point[];
  lengths: number[];
  totalLength: number;
};

type Monster = {
  id: number;
  progress: number;
  speed: number;
  hue: number;
  health: number;
  maxHealth: number;
  scoreReward: number;
  mesoReward: number;
};

type DragState = {
  unit: GameUnit;
  originSlot: number;
  pointerX: number;
  pointerY: number;
  grabOffsetX: number;
  grabOffsetY: number;
};

type ContextMenuState = {
  unit: GameUnit;
  x: number;
  y: number;
  range: number;
  stats: {
    damage: number;
    cooldown: number;
    hitsPerAttack: number;
  };
};

const SPAWN_INTERVAL = 2.5;
const MAX_DELTA = 0.25;
const MAX_UNITS = 9;
const LEAKS_PER_HEALTH = 3;

const UNIT_COLORS: Record<GameUnit['type'], string> = {
  luminous: '#7de6ff',
  bowmaster: '#ffef8a',
  'angelic-buster': '#ff9be8',
  bishop: '#c0e6ff',
  blaster: '#ffb27a',
  'night-lord': '#b18bff',
};

const RARITY_OUTLINE: Record<GameUnit['rarity'], string> = {
  N: 'rgba(255, 255, 255, 0.35)',
  R: 'rgba(125, 198, 255, 0.7)',
  U: 'rgba(255, 180, 120, 0.85)',
};

const UNIT_LABEL: Record<GameUnit['type'], string> = {
  luminous: 'LU',
  bowmaster: 'BM',
  'angelic-buster': 'AB',
  bishop: 'BI',
  blaster: 'BL',
  'night-lord': 'NL',
};

const SELL_VALUE: Record<GameUnit['rarity'], number> = {
  N: 1,
  R: 2,
  U: 4,
};

const UNIT_ATTACK_PROFILE: Record<GameUnit['type'], { baseDamage: number; cooldown: number }> = {
  luminous: { baseDamage: 16, cooldown: 1 },
  bowmaster: { baseDamage: 30, cooldown: 2 },
  'angelic-buster': { baseDamage: 20, cooldown: 0.9 },
  bishop: { baseDamage: 9, cooldown: 1 },
  blaster: { baseDamage: 60, cooldown: 3 },
  'night-lord': { baseDamage: 5, cooldown: 0.3 },
};

const UNIT_ATTACK_RANGE_MULTIPLIER: Record<GameUnit['type'], number> = {
  luminous: 1.2,
  bowmaster: 2,
  'angelic-buster': 0.85,
  bishop: 1.2,
  blaster: 0.85,
  'night-lord': 0.85,
};

const RARITY_DAMAGE_MULTIPLIER: Record<GameUnit['rarity'], number> = {
  N: 1,
  R: 1.4,
  U: 1.9,
};

const LEVEL_DAMAGE_BONUS = 0.18;
const LEVEL_COOLDOWN_REDUCTION = 0.05;
const MIN_ATTACK_COOLDOWN = 0.25;

const MONSTER_BASE_HEALTH = 60;
const MONSTER_HEALTH_GROWTH = 18;
const MONSTER_HEALTH_VARIANCE = 0.25;
const MIN_MONSTER_HEALTH = 35;

const SCORE_PER_HEALTH = 0.6;
const MESO_PER_HEALTH = 1 / 90;
const MIN_SCORE_REWARD = 20;
const MIN_MESO_REWARD = 1;

const LUMINOUS_TARGETS_BY_LEVEL = [2, 3, 4, 5];

type AttackTimers = Record<string, number>;

const UNIT_BASE_PATH_WINDOW: Record<GameUnit['type'], number> = {
  luminous: 0.06,
  bowmaster: 0.07,
  'angelic-buster': 0.065,
  bishop: 0.055,
  blaster: 0.05,
  'night-lord': 0.06,
};

function getEffectiveUnitLevel(unit: GameUnit, skills: SkillCard[]): number {
  let level = unit.level;
  skills.forEach((card) => {
    if (card.kind === 'unit-level' && card.unitType === unit.type) {
      level += card.amount;
    }
  });
  return Math.max(1, level);
}

function getLuminousMaxTargets(unit: GameUnit, skills: SkillCard[]): number {
  const effectiveLevel = Math.min(
    LUMINOUS_TARGETS_BY_LEVEL.length,
    Math.max(1, getEffectiveUnitLevel(unit, skills)),
  );
  return LUMINOUS_TARGETS_BY_LEVEL[effectiveLevel - 1] ?? LUMINOUS_TARGETS_BY_LEVEL[0];
}

function getUnitPathWindow(unit: GameUnit, skills: SkillCard[]): number {
  const base = UNIT_BASE_PATH_WINDOW[unit.type] ?? 0.04;
  if (unit.type === 'luminous') {
    const maxLevel = LUMINOUS_TARGETS_BY_LEVEL.length;
    const effectiveLevel = Math.max(1, Math.min(getEffectiveUnitLevel(unit, skills), maxLevel));
    const extra = Math.max(0, effectiveLevel - 1) * 0.01;
    return Math.min(0.12, base + extra);
  }
  return base;
}

function getAttackMultiplier(unit: GameUnit, _skills: SkillCard[]): number {
  return RARITY_DAMAGE_MULTIPLIER[unit.rarity];
}

function getUnitDamage(unit: GameUnit, skills: SkillCard[]): number {
  const profile = UNIT_ATTACK_PROFILE[unit.type];
  const effectiveLevel = getEffectiveUnitLevel(unit, skills);
  const levelBonus = 1 + (effectiveLevel - 1) * LEVEL_DAMAGE_BONUS;
  return profile.baseDamage * levelBonus * getAttackMultiplier(unit, skills);
}

function getAttackCooldown(unit: GameUnit, skills: SkillCard[]): number {
  const profile = UNIT_ATTACK_PROFILE[unit.type];
  const effectiveLevel = getEffectiveUnitLevel(unit, skills);
  const reduction = Math.min((effectiveLevel - 1) * LEVEL_COOLDOWN_REDUCTION, 0.45);
  const rarityModifier = unit.rarity === 'U' ? 0.85 : unit.rarity === 'R' ? 0.92 : 1;
  return Math.max(MIN_ATTACK_COOLDOWN, profile.cooldown * (1 - reduction) * rarityModifier);
}

function getUnitStats(unit: GameUnit, skills: SkillCard[]) {
  const damage = getUnitDamage(unit, skills);
  const cooldown = getAttackCooldown(unit, skills);
  const hitsPerAttack = unit.type === 'luminous' ? getLuminousMaxTargets(unit, skills) : 1;
  return { damage, cooldown, hitsPerAttack };
}

function resolveUnitAttacks(
  delta: number,
  units: GameUnit[],
  monsters: Monster[],
  timers: AttackTimers,
  skills: SkillCard[],
  geometry: BoardGeometry,
  metrics: PathMetrics,
): Set<number> {
  const defeated = new Set<number>();
  if (monsters.length === 0 || units.length === 0) {
    return defeated;
  }

  const monsterPositions = monsters.map((monster) => getPointAlongPath(metrics, monster.progress));

  units.forEach((unit) => {
    const cooldown = getAttackCooldown(unit, skills);
    if (!Number.isFinite(cooldown) || cooldown <= 0) {
      timers[unit.id] = 0;
      return;
    }

    const unitCenter = getSlotCenter(geometry, unit.slot);
    const rangeMultiplier = UNIT_ATTACK_RANGE_MULTIPLIER[unit.type] ?? 0;
    const range = rangeMultiplier * geometry.cellSize;
    const rangeSq = range * range;
    const closestProgress = getClosestProgressToPoint(metrics, unitCenter);
    const pathWindow = getUnitPathWindow(unit, skills);

    let remaining = timers[unit.id] ?? 0;
    remaining -= delta;

    while (remaining <= 0) {
      const eligible = monsters
        .map((monster, index) => {
          if (defeated.has(monster.id) || monster.health <= 0) return null;
          const position = monsterPositions[index];
          const dx = position.x - unitCenter.x;
          const dy = position.y - unitCenter.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > rangeSq) return null;
          const progressDistance = getProgressDistance(monster.progress, closestProgress);
          if (progressDistance > pathWindow) return null;
          return { monster, distanceSq, progress: monster.progress };
        })
        .filter((entry): entry is { monster: Monster; distanceSq: number; progress: number } => entry !== null)
        .sort((a, b) => {
          if (a.distanceSq !== b.distanceSq) {
            return a.distanceSq - b.distanceSq;
          }
          return b.progress - a.progress;
        });

      if (eligible.length === 0) {
        remaining = cooldown;
        break;
      }

      const damage = getUnitDamage(unit, skills);
      if (unit.type === 'luminous') {
        const maxTargets = getLuminousMaxTargets(unit, skills);
        const primary = eligible[0];
        if (!primary) {
          remaining = cooldown;
          break;
        }

        const targets: Monster[] = [primary.monster];

        if (maxTargets > 1) {
          const extraTargetsNeeded = maxTargets - 1;
          const additional = monsters
            .filter(
              (monster) =>
                monster.id !== primary.monster.id &&
                !defeated.has(monster.id) &&
                monster.health > 0,
            )
            .map((monster) => ({
              monster,
              distance: Math.abs(monster.progress - primary.progress),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, extraTargetsNeeded)
            .map((entry) => entry.monster);

          targets.push(...additional);
        }

        targets.forEach((monster) => {
          monster.health -= damage;
          if (monster.health <= 0 && !defeated.has(monster.id)) {
            monster.health = 0;
            defeated.add(monster.id);
          }
        });
      } else {
        const { monster } = eligible[0];
        monster.health -= damage;
        if (monster.health <= 0 && !defeated.has(monster.id)) {
          monster.health = 0;
          defeated.add(monster.id);
        }
      }

      remaining += cooldown;
    }

    timers[unit.id] = remaining;
  });

  return defeated;
}

function getMonsterHealthForWave(wave: number) {
  const base = MONSTER_BASE_HEALTH + Math.max(0, wave - 1) * MONSTER_HEALTH_GROWTH;
  const variance = base * MONSTER_HEALTH_VARIANCE;
  const randomized = base + (Math.random() - 0.5) * variance * 2;
  return Math.max(MIN_MONSTER_HEALTH, Math.round(randomized));
}

function getMonsterRewards(maxHealth: number) {
  const score = Math.max(MIN_SCORE_REWARD, Math.round(maxHealth * SCORE_PER_HEALTH));
  const meso = Math.max(MIN_MESO_REWARD, Math.round(maxHealth * MESO_PER_HEALTH));
  return { score, meso };
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): BoardGeometry {
  ctx.clearRect(0, 0, width, height);

  const padding = Math.min(width, height) * 0.08;
  const availableSize = Math.min(width, height) - padding * 2;
  const trackWidth = Math.max(12, availableSize * 0.08);
  const spacing = Math.max(12, trackWidth * 0.65);
  const pathSize = availableSize;
  const boardSize = Math.max(120, pathSize - trackWidth - spacing * 2);

  const centerX = width / 2;
  const centerY = height / 2;
  const pathX = centerX - pathSize / 2;
  const pathY = centerY - pathSize / 2;
  const boardX = centerX - boardSize / 2;
  const boardY = centerY - boardSize / 2;
  const cellSize = boardSize / 3;

  const radial = ctx.createRadialGradient(centerX, centerY, pathSize * 0.2, centerX, centerY, pathSize);
  radial.addColorStop(0, 'rgba(45, 54, 72, 0.25)');
  radial.addColorStop(1, 'rgba(15, 18, 26, 0.95)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#1c2129';
  ctx.fillRect(boardX, boardY, boardSize, boardSize);

  const gradient = ctx.createLinearGradient(boardX, boardY, boardX + boardSize, boardY + boardSize);
  gradient.addColorStop(0, 'rgba(90, 120, 160, 0.18)');
  gradient.addColorStop(1, 'rgba(40, 60, 90, 0.12)');
  ctx.fillStyle = gradient;
  ctx.fillRect(boardX, boardY, boardSize, boardSize);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i += 1) {
    const x = boardX + cellSize * i;
    const y = boardY + cellSize * i;
    ctx.beginPath();
    ctx.moveTo(x, boardY);
    ctx.lineTo(x, boardY + boardSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boardX, y);
    ctx.lineTo(boardX + boardSize, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const slotX = boardX + col * cellSize;
      const slotY = boardY + row * cellSize;
      ctx.fillRect(slotX + 4, slotY + 4, cellSize - 8, cellSize - 8);
    }
  }

  const innerLeft = pathX + trackWidth / 2;
  const innerRight = pathX + pathSize - trackWidth / 2;
  const innerTop = pathY + trackWidth / 2;
  const innerBottom = pathY + pathSize - trackWidth / 2;

  ctx.strokeStyle = 'rgba(180, 110, 255, 0.45)';
  ctx.lineWidth = trackWidth;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 1.01;
  ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 10;

  const columnCenters = [0, 1, 2].map((col) => boardX + col * cellSize + cellSize / 2);
  const rowCenters = [0, 1, 2].map((row) => boardY + row * cellSize + cellSize / 2);

  const topEdge = columnCenters.map((x) => ({ x, y: innerTop }));
  const rightEdge = rowCenters.map((y) => ({ x: innerRight, y }));
  const bottomEdge = [...columnCenters].reverse().map((x) => ({ x, y: innerBottom }));
  const leftEdge = [...rowCenters].reverse().map((y) => ({ x: innerLeft, y }));

  const cornerNodes: Point[] = [
    { x: innerRight, y: innerTop },
    { x: innerRight, y: innerBottom },
    { x: innerLeft, y: innerBottom },
    { x: innerLeft, y: innerTop },
  ];

  const nodePositions = [...topEdge, ...rightEdge, ...bottomEdge, ...leftEdge];

  const pathPoints: Point[] = [
    topEdge[0],
    topEdge[1],
    topEdge[2],
    cornerNodes[0],
    rightEdge[0],
    rightEdge[1],
    rightEdge[2],
    cornerNodes[1],
    bottomEdge[0],
    bottomEdge[1],
    bottomEdge[2],
    cornerNodes[2],
    leftEdge[0],
    leftEdge[1],
    leftEdge[2],
    cornerNodes[3],
  ];

  ctx.fillStyle = 'rgba(220, 190, 255, 0.85)';
  const nodeRadius = Math.max(8, trackWidth * 0.35);
  const spawnPoint = pathPoints[0];
  ctx.beginPath();
  ctx.arc(spawnPoint.x, spawnPoint.y, nodeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX, boardY, boardSize, boardSize);

  return {
    boardX,
    boardY,
    boardSize,
    cellSize,
    trackWidth,
    pathPoints,
  };
}

function computePathMetrics(pathPoints: Point[]): PathMetrics {
  const points = [...pathPoints, pathPoints[0]];
  const lengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    totalLength += length;
  }

  return { points, lengths, totalLength };
}

function getPointAlongPath(metrics: PathMetrics, progress: number): Point {
  if (metrics.totalLength === 0) {
    return { x: metrics.points[0].x, y: metrics.points[0].y };
  }

  const target = progress * metrics.totalLength;
  let accumulated = 0;

  for (let i = 0; i < metrics.lengths.length; i += 1) {
    const segment = metrics.lengths[i];
    if (target <= accumulated + segment) {
      const t = segment === 0 ? 0 : (target - accumulated) / segment;
      const start = metrics.points[i];
      const end = metrics.points[i + 1];
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      };
    }
    accumulated += segment;
  }

  return { x: metrics.points[0].x, y: metrics.points[0].y };
}

function getSlotCenter(geometry: BoardGeometry, slot: number): Point {
  const col = slot % 3;
  const row = Math.floor(slot / 3);
  return {
    x: geometry.boardX + col * geometry.cellSize + geometry.cellSize / 2,
    y: geometry.boardY + row * geometry.cellSize + geometry.cellSize / 2,
  };
}

function getClosestProgressToPoint(metrics: PathMetrics, point: Point): number {
  if (metrics.totalLength === 0) return 0;
  let bestDistSq = Infinity;
  let bestProgress = 0;
  let accumulated = 0;
  for (let i = 0; i < metrics.lengths.length; i += 1) {
    const start = metrics.points[i];
    const end = metrics.points[i + 1];
    const segmentLength = metrics.lengths[i];
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const segLenSq = vx * vx + vy * vy;
    if (segLenSq === 0) {
      accumulated += segmentLength;
      continue;
    }
    const wx = point.x - start.x;
    const wy = point.y - start.y;
    const t = Math.max(0, Math.min(1, (vx * wx + vy * wy) / segLenSq));
    const closestX = start.x + vx * t;
    const closestY = start.y + vy * t;
    const dx = point.x - closestX;
    const dy = point.y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestProgress = (accumulated + segmentLength * t) / metrics.totalLength;
    }
    accumulated += segmentLength;
  }
  if (bestProgress < 0) return 0;
  if (bestProgress > 1) return bestProgress % 1;
  return bestProgress;
}

function getProgressDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1 - diff);
}

type UnitAssets = {
  luminousVideo: HTMLVideoElement | null;
  luminousImage: HTMLImageElement | null;
};

function drawUnitAt(
  ctx: CanvasRenderingContext2D,
  unit: GameUnit,
  centerX: number,
  centerY: number,
  radius: number,
  assets?: UnitAssets,
) {
  // If luminous and a video asset is available, draw the video instead of a circle.
  if (unit.type === 'luminous' && assets) {
    const cellSize = radius / 0.28; // inverse of multiplier used when computing radius
    const clipSize = cellSize * 0.82;
    const clipX = centerX - clipSize / 2;
    const clipY = centerY - clipSize / 2;

    const drawMedia = (
      source: HTMLVideoElement | HTMLImageElement,
      width: number,
      height: number,
    ) => {
      if (width <= 0 || height <= 0) return false;
      const aspect = width / height;
      let drawW = clipSize;
      let drawH = clipSize;
      if (aspect >= 1) {
        drawH = clipSize / aspect;
      } else {
        drawW = clipSize * aspect;
      }
      const drawX = centerX - drawW / 2;
      const drawY = centerY - drawH / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipSize, clipSize);
      ctx.clip();
      try {
        ctx.drawImage(source, drawX, drawY, drawW, drawH);
        ctx.restore();
        return true;
      } catch {
        ctx.restore();
        return false;
      }
    };

    const video = assets.luminousVideo;
    if (
      video &&
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      drawMedia(video, video.videoWidth, video.videoHeight)
    ) {
      return;
    }

    const image = assets.luminousImage;
    if (
      image &&
      image.complete &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0 &&
      drawMedia(image, image.naturalWidth, image.naturalHeight)
    ) {
      return;
    }
  }

  // Default drawing: colored circle with label
  ctx.beginPath();
  ctx.fillStyle = UNIT_COLORS[unit.type];
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = RARITY_OUTLINE[unit.rarity];
  ctx.lineWidth = 3;
  ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(12, 14, 18, 0.75)';
  ctx.font = `${Math.max(14, Math.floor(radius * 1.1))}px 'Segoe UI', 'Pretendard', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(UNIT_LABEL[unit.type], centerX, centerY + 1);
}

function drawUnits(
  ctx: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  units: GameUnit[],
  dragging: DragState | null,
  assets?: UnitAssets,
) {
  const unitRadius = geometry.cellSize * 0.28;

  units.forEach((unit) => {
    if (dragging && dragging.unit.id === unit.id) {
      return;
    }
    const row = Math.floor(unit.slot / 3);
    const col = unit.slot % 3;
    const centerX = geometry.boardX + col * geometry.cellSize + geometry.cellSize / 2;
    const centerY = geometry.boardY + row * geometry.cellSize + geometry.cellSize / 2;
    drawUnitAt(ctx, unit, centerX, centerY, unitRadius, assets);
  });
}

function drawMonsters(
  ctx: CanvasRenderingContext2D,
  metrics: PathMetrics,
  monsters: Monster[],
  radius: number,
) {
  monsters.forEach((monster) => {
    const position = getPointAlongPath(metrics, monster.progress);
    const healthRatio = Math.max(0, Math.min(1, monster.health / monster.maxHealth));

    ctx.beginPath();
    ctx.fillStyle = `hsla(${monster.hue}, 80%, 62%, 0.9)`;
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `hsla(${monster.hue}, 90%, 80%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.arc(position.x, position.y, radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    const barWidth = radius * 2;
    const barHeight = Math.max(3, radius * 0.25);
    const barX = position.x - barWidth / 2;
    const barY = position.y - radius - (barHeight + 6);

    ctx.fillStyle = 'rgba(12, 14, 18, 0.65)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    if (healthRatio > 0) {
      ctx.fillStyle = `hsla(${monster.hue}, 90%, 70%, 0.9)`;
      ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  });
}

function pickSlot(geometry: BoardGeometry, x: number, y: number) {
  const { boardX, boardY, boardSize, cellSize } = geometry;
  if (x < boardX || x > boardX + boardSize || y < boardY || y > boardY + boardSize) {
    return undefined;
  }
  const col = Math.floor((x - boardX) / cellSize);
  const row = Math.floor((y - boardY) / cellSize);
  if (col < 0 || col > 2 || row < 0 || row > 2) {
    return undefined;
  }
  return row * 3 + col;
}

export default function MiniGameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const monstersRef = useRef<Monster[]>([]);
  const spawnTimerRef = useRef(0);
  const nextMonsterIdRef = useRef(1);
  const leakCounterRef = useRef(0);
  const geometryRef = useRef<BoardGeometry | null>(null);
  const draggingRef = useRef<DragState | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const isStartedRef = useRef(isStarted);
  const lastTimestampRef = useRef(performance.now());

  const state = useGameState();

  const healthRef = useRef(state.health);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    healthRef.current = state.health;
    if (state.health <= 0 && isStartedRef.current) {
      setIsStarted(false);
    }
  }, [state.health]);

  const unitsRef = useRef(state.units);
  useEffect(() => {
    unitsRef.current = state.units;
  }, [state.units]);

  const skillsRef = useRef(state.skills);
  useEffect(() => {
    skillsRef.current = state.skills;
  }, [state.skills]);

  const waveRef = useRef(state.wave);
  useEffect(() => {
    waveRef.current = state.wave;
  }, [state.wave]);

  const attackTimersRef = useRef<AttackTimers>({});
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const selectedSlotRef = useRef<number | null>(null);

  // Luminous video asset (attack motion). Place files at: frontend/public/assets/images/gameimg/lumiattak.webm (+ MP4/GIF fallback)
  const luminousVideoRef = useRef<HTMLVideoElement | null>(null);
  const luminousImageRef = useRef<HTMLImageElement | null>(null);
  const [luminousVideoReady, setLuminousVideoReady] = useState(false);

  const loadGifFallback = useCallback(() => {
    if (luminousImageRef.current) return;
    const img = new Image();
    img.src = '/assets/images/gameimg/lumiattak.gif';
    img.onload = () => {
      luminousImageRef.current = img;
      console.info('[MiniGame] Luminous GIF ready', {
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      console.warn('[MiniGame] Luminous GIF load failed.');
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (luminousVideoRef.current) return undefined;

    const video = document.createElement('video');
    const candidates = [
      '/assets/images/gameimg/lumiattakwebm.webm', // current WebM export
      '/assets/images/gameimg/lumiattack.webm', // alternate WebM name (if renamed later)
      '/assets/images/gameimg/lumiattak.webm', // legacy WebM name
      '/assets/images/gameimg/lumiattakmp4.mp4', // MP4 fallback (no alpha)
      '/assets/images/gameimg/lumiattack.mp4', // older MP4 name
      '/gameimg/lumiattack.mp4', // legacy public root path
    ];
    let index = 0;
    let readyLogged = false;
    const tryNext = () => {
      if (index >= candidates.length) {
        console.warn('[MiniGame] All luminous video sources failed, switching to GIF fallback.');
        loadGifFallback();
        return;
      }
      const src = candidates[index++];
      video.src = src;
      try { video.load(); } catch {}
      console.info('[MiniGame] Loading luminous video:', src);
    };
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    const markReady = () => {
      if (!readyLogged) {
        console.info('[MiniGame] Luminous video ready', {
          readyState: video.readyState,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        readyLogged = true;
      }
      setLuminousVideoReady(true);
    };
    const tryPlay = () => {
      video.play().catch(() => {});
    };
    video.addEventListener('loadedmetadata', () => {
      try { video.currentTime = 0.01; } catch {}
      markReady();
    }, { once: true });
    video.addEventListener('loadeddata', markReady, { once: true });
    video.addEventListener('canplay', () => {
      markReady();
      tryPlay();
    }, { once: true });
    video.addEventListener('seeked', () => {
      markReady();
      tryPlay();
    }, { once: true });
    video.addEventListener('error', () => {
      console.warn('[MiniGame] Luminous video load error, trying fallback.');
      tryNext();
    });
    tryNext();
    try { (window as any).__lumiVid = video; } catch {}
    luminousVideoRef.current = video;

    return undefined;
  }, [loadGifFallback]);

  // If autoplay is blocked, attempt playback on first user interaction
  useEffect(() => {
    const video = luminousVideoRef.current;
    if (!video) return undefined;
    const onUserInteract = () => {
      video.play().catch(() => {});
    };
    window.addEventListener('pointerdown', onUserInteract, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onUserInteract);
    };
  }, [luminousVideoReady]);

  useEffect(() => {
    const timers = attackTimersRef.current;
    const activeIds = new Set(state.units.map((unit) => unit.id));
    Object.keys(timers).forEach((id) => {
      if (!activeIds.has(id)) {
        delete timers[id];
      }
    });
  }, [state.units]);

  useEffect(() => {
    if (selectedSlot === null) return;
    const exists = state.units.some((unit) => unit.slot === selectedSlot);
    if (!exists) {
      setSelectedSlot(null);
    }
  }, [state.units, selectedSlot]);

  const dispatch = useGameDispatch();

  useEffect(() => {
    if (!isStarted) {
      monstersRef.current = [];
      spawnTimerRef.current = 0;
      attackTimersRef.current = {};
      nextMonsterIdRef.current = 1;
      leakCounterRef.current = 0;
    }
  }, [isStarted]);

  useEffect(() => {
    selectedSlotRef.current = selectedSlot;
  }, [selectedSlot]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        draggingRef.current = null;
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(event.target as Node)) {
        setContextMenu(null);
        setSelectedSlot(null);
        selectedSlotRef.current = null;
      }
    };
    window.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return () => undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return () => undefined;

    let animationFrameId = 0;
    lastTimestampRef.current = performance.now();

    const renderScene = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const geometry = drawBoard(ctx, rect.width, rect.height);
      geometryRef.current = geometry;
      const metrics = computePathMetrics(geometry.pathPoints);

      const dragging = draggingRef.current;
      const assets = {
        luminousVideo: luminousVideoRef.current,
        luminousImage: luminousImageRef.current,
      };
      drawUnits(ctx, geometry, unitsRef.current, dragging, assets);
      drawMonsters(ctx, metrics, monstersRef.current, Math.max(9, geometry.trackWidth * 0.35));

      if (dragging) {
        const unitRadius = geometry.cellSize * 0.28;
        const centerX = dragging.pointerX - dragging.grabOffsetX;
        const centerY = dragging.pointerY - dragging.grabOffsetY;
        const assets = {
          luminousVideo: luminousVideoRef.current,
          luminousImage: luminousImageRef.current,
        };
        drawUnitAt(ctx, dragging.unit, centerX, centerY, unitRadius, assets);
      }

      const activeSelectedSlot = selectedSlotRef.current;
      if (activeSelectedSlot !== null) {
        const selectedUnit = unitsRef.current.find((unit) => unit.slot === activeSelectedSlot);
        if (selectedUnit) {
          const center = getSlotCenter(geometry, activeSelectedSlot);
          const rangeMultiplier = UNIT_ATTACK_RANGE_MULTIPLIER[selectedUnit.type] ?? 0;
          const range = rangeMultiplier * geometry.cellSize;

          ctx.save();
          ctx.strokeStyle = 'rgba(110, 180, 255, 0.85)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(center.x, center.y, range, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    };

    const spawnMonster = () => {
      const hue = Math.floor(Math.random() * 360);
      const speed = 0.02 + Math.random() * 0.015;
      const wave = Math.max(1, waveRef.current);
      const maxHealth = getMonsterHealthForWave(wave);
      const rewards = getMonsterRewards(maxHealth);
      monstersRef.current.push({
        id: nextMonsterIdRef.current,
        progress: 0,
        speed,
        hue,
        health: maxHealth,
        maxHealth,
        scoreReward: rewards.score,
        mesoReward: rewards.meso,
      });
      nextMonsterIdRef.current += 1;
    };

    const step = (timestamp: number) => {
      if (!isStartedRef.current) {
        lastTimestampRef.current = timestamp;
        renderScene();
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      const rawDelta = (timestamp - lastTimestampRef.current) / 1000;
      const delta = Math.min(Math.max(rawDelta, 0), MAX_DELTA);
      lastTimestampRef.current = timestamp;

      if (healthRef.current <= 0) {
        renderScene();
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      const geometry = geometryRef.current;
      const metrics = geometry ? computePathMetrics(geometry.pathPoints) : null;

      spawnTimerRef.current += delta;
      while (spawnTimerRef.current >= SPAWN_INTERVAL) {
        spawnMonster();
        spawnTimerRef.current -= SPAWN_INTERVAL;
      }

      const nextMonsters: Monster[] = [];
      let leakedCount = 0;
      monstersRef.current.forEach((monster) => {
        const updated = monster.progress + monster.speed * delta;
        if (updated >= 1) {
          leakedCount += 1;
          return;
        }
        monster.progress = updated;
        nextMonsters.push(monster);
      });
      monstersRef.current = nextMonsters;

      let slainMonsters: Monster[] = [];

      if (monstersRef.current.length > 0) {
        if (unitsRef.current.length > 0 && geometry && metrics) {
          const defeatedIds = resolveUnitAttacks(
            delta,
            unitsRef.current,
            monstersRef.current,
            attackTimersRef.current,
            skillsRef.current,
            geometry,
            metrics,
          );
          const survivors: Monster[] = [];
          monstersRef.current.forEach((monster) => {
            if (monster.health <= 0 || defeatedIds.has(monster.id)) {
              slainMonsters.push(monster);
            } else {
              survivors.push(monster);
            }
          });
          monstersRef.current = survivors;
        } else {
          monstersRef.current = monstersRef.current.filter((monster) => monster.health > 0);
        }
      } else {
        const timers = attackTimersRef.current;
        Object.keys(timers).forEach((id) => {
          timers[id] = 0;
        });
      }

      if (slainMonsters.length > 0) {
        const totalScore = slainMonsters.reduce((sum, monster) => sum + monster.scoreReward, 0);
        const totalMeso = slainMonsters.reduce((sum, monster) => sum + monster.mesoReward, 0);
        if (totalScore > 0) {
          dispatch({ type: 'addScore', amount: totalScore });
        }
        if (totalMeso > 0) {
          dispatch({ type: 'addMeso', amount: totalMeso });
        }
      }

      if (leakedCount > 0) {
        leakCounterRef.current += leakedCount;
        let healthLoss = 0;
        while (leakCounterRef.current >= LEAKS_PER_HEALTH) {
          leakCounterRef.current -= LEAKS_PER_HEALTH;
          healthLoss += 1;
        }
        if (healthLoss > 0) {
          healthRef.current = Math.max(0, healthRef.current - healthLoss);
          dispatch({ type: 'loseHealth', amount: healthLoss });
        }
      }

      renderScene();
      animationFrameId = requestAnimationFrame(step);
    };

    renderScene();
    animationFrameId = requestAnimationFrame(step);

    const handleResize = () => {
      renderScene();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return () => undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const geometry = geometryRef.current;
      if (!geometry) return;

      const rect = canvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const slot = pickSlot(geometry, pointerX, pointerY);

      if (event.button === 2) {
        event.preventDefault();
        const unit = slot !== undefined ? unitsRef.current.find((item) => item.slot === slot) : undefined;
        if (!unit) {
          setSelectedSlot(null);
          selectedSlotRef.current = null;
          setContextMenu(null);
          return;
        }
        setSelectedSlot(slot);
        selectedSlotRef.current = slot;
        const rangeMultiplier = UNIT_ATTACK_RANGE_MULTIPLIER[unit.type] ?? 0;
        const range = rangeMultiplier * geometry.cellSize;
        const stats = getUnitStats(unit, skillsRef.current);
        const container = containerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const menuX = event.clientX - containerRect.left;
          const menuY = event.clientY - containerRect.top;
          setContextMenu({ unit, x: menuX, y: menuY, range, stats });
        } else {
          setContextMenu({ unit, x: pointerX, y: pointerY, range, stats });
        }
        return;
      }

      if (event.button !== 0) {
        return;
      }

      setContextMenu(null);

      if (slot === undefined) {
        setSelectedSlot(null);
        selectedSlotRef.current = null;
        return;
      }

      const unit = unitsRef.current.find((item) => item.slot === slot);
      if (!unit) {
        setSelectedSlot(null);
        selectedSlotRef.current = null;
        return;
      }

      setSelectedSlot(slot);
      selectedSlotRef.current = slot;

      const col = slot % 3;
      const row = Math.floor(slot / 3);
      const centerX = geometry.boardX + col * geometry.cellSize + geometry.cellSize / 2;
      const centerY = geometry.boardY + row * geometry.cellSize + geometry.cellSize / 2;

      draggingRef.current = {
        unit,
        originSlot: slot,
        pointerX,
        pointerY,
        grabOffsetX: pointerX - centerX,
        grabOffsetY: pointerY - centerY,
      };

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        // ignore pointer capture failures
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dragging = draggingRef.current;
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      dragging.pointerX = event.clientX - rect.left;
      dragging.pointerY = event.clientY - rect.top;
    };

    const finalizeDrag = (event: PointerEvent) => {
      const dragging = draggingRef.current;
      if (!dragging) return;

      const geometry = geometryRef.current;
      if (!geometry) {
        draggingRef.current = null;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      dragging.pointerX = event.clientX - rect.left;
      dragging.pointerY = event.clientY - rect.top;

      const targetSlot = pickSlot(geometry, dragging.pointerX, dragging.pointerY);
      if (targetSlot !== undefined && targetSlot !== dragging.originSlot) {
        dispatch({ type: 'moveUnit', from: dragging.originSlot, to: targetSlot });
        setSelectedSlot(targetSlot);
        selectedSlotRef.current = targetSlot;
      } else if (targetSlot !== undefined) {
        setSelectedSlot(targetSlot);
        selectedSlotRef.current = targetSlot;
      } else {
        setSelectedSlot(dragging.originSlot);
        selectedSlotRef.current = dragging.originSlot;
      }

      draggingRef.current = null;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button === 0) {
        finalizeDrag(event);
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch (error) {
          // ignore
        }
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.button === 0) {
        draggingRef.current = null;
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch (error) {
          // ignore
        }
      }
    };

    const blockContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('contextmenu', blockContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [dispatch]);

  const handleStartGame = () => {
    if (state.health <= 0) {
      dispatch({ type: 'reset' });
      healthRef.current = state.maxHealth;
    } else {
      healthRef.current = state.health;
    }
    monstersRef.current = [];
    spawnTimerRef.current = 0;
    attackTimersRef.current = {};
    nextMonsterIdRef.current = 1;
    leakCounterRef.current = 0;
    lastTimestampRef.current = performance.now();
    setContextMenu(null);
    setIsStarted(true);
  };

  const startButtonLabel = state.health <= 0 ? '다시 시작' : '게임 시작';
  const geometrySnapshot = geometryRef.current;
  const contextMenuRangeCells =
    contextMenu && geometrySnapshot?.cellSize && geometrySnapshot.cellSize > 0
      ? contextMenu.range / geometrySnapshot.cellSize
      : null;
  const contextMenuAttacksPerSecond =
    contextMenu && contextMenu.stats.cooldown > 0
      ? contextMenu.stats.hitsPerAttack / contextMenu.stats.cooldown
      : null;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          background: 'radial-gradient(circle at 50% 20%, #2b3240 0%, #151820 65%)',
          touchAction: 'none',
          cursor: isStarted ? 'pointer' : 'default',
        }}
      />
      {!isStarted && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 12, 18, 0.7)',
            backdropFilter: 'blur(2px)',
            zIndex: 12,
          }}
        >
          <button
            type="button"
            onClick={handleStartGame}
            style={{
              padding: '18px 48px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #6ad0a1 0%, #59a7ff 100%)',
              color: '#0c1016',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
              cursor: 'pointer',
            }}
          >
            {startButtonLabel}
          </button>
        </div>
      )}
      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(contextMenu.x, (containerRef.current?.clientWidth || 0) - 180),
            top: Math.min(contextMenu.y, (containerRef.current?.clientHeight || 0) - 140),
            minWidth: '180px',
            background: 'rgba(18, 20, 28, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
            color: '#e2e6ef',
            zIndex: 10,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong style={{ fontSize: '15px' }}>{UNIT_LABEL[contextMenu.unit.type]}</strong>
            <span style={{ fontSize: '13px', color: '#b4bac6' }}>
              직업: {contextMenu.unit.type}
            </span>
            <span style={{ fontSize: '13px', color: '#b4bac6' }}>
              희귀도: {contextMenu.unit.rarity}
            </span>
            <span style={{ fontSize: '13px', color: '#b4bac6' }}>레벨: {contextMenu.unit.level}</span>
            <span style={{ fontSize: '13px', color: '#b4bac6' }}>
              사거리: 근접 (
              {contextMenuRangeCells !== null
                ? `약 ${contextMenuRangeCells.toFixed(2)}칸`
                : `약 ${Math.round(contextMenu.range)}px`}
              )
            </span>
            <span style={{ fontSize: '13px', color: '#b4bac6' }}>
              공격력: {Math.round(contextMenu.stats.damage)}
            </span>
            <span style={{ fontSize: '13px', color: '#b4bac6' }}>
              공격속도: {contextMenu.stats.cooldown.toFixed(2)}초
            </span>
            {contextMenu.stats.hitsPerAttack > 1 && (
              <span style={{ fontSize: '13px', color: '#b4bac6' }}>
                동시 타격: {contextMenu.stats.hitsPerAttack}마리
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'sellUnit', slot: contextMenu.unit.slot });
              setContextMenu(null);
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 140, 120, 0.4)',
              background: 'linear-gradient(135deg, rgba(255, 110, 110, 0.9) 0%, rgba(255, 150, 90, 0.9) 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            캐릭터 판매 (+{SELL_VALUE[contextMenu.unit.rarity]} 메소)
          </button>
        </div>
      )}
    </div>
  );
}
