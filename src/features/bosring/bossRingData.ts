// src/features/bosring/bossRingData.ts
export type RingLevel = 1 | 2 | 3 | 4;
export type BoxId = 'black' | 'white' | 'life';

export interface RingRate {
  key: string;
  name: string;
  p: number;
}

export interface BoxData {
  id: BoxId;
  title: string;
  desc: string;
  levelRates: Partial<Record<RingLevel, number>>;
  ringRates: RingRate[];
}

interface Result {
  ring: RingRate;
  level: RingLevel | null;
}

/* ===================== 흑옥 ===================== */
export const BLACK_BOX: BoxData = {
  id: 'black',
  title: '흑옥의 보스 반지 상자 (상급)',
  desc: '스킬 반지 레벨 1~4 부여',
  levelRates: { 1: 25, 2: 25, 3: 30, 4: 20 },
  ringRates: [
    { key: 'restraint',   name: '리스트레인트 링',   p: 12.5 },
    { key: 'continuous',  name: '컨티뉴어스 링',     p: 12.5 },

    { key: 'weaponpuff-s', name: '웨폰퍼프 - S링',   p: 8.33333 },
    { key: 'weaponpuff-i', name: '웨폰퍼프 - I링',   p: 8.33333 },
    { key: 'weaponpuff-l', name: '웨폰퍼프 - L링',   p: 8.33333 },
    { key: 'weaponpuff-d', name: '웨폰퍼프 - D링',   p: 8.33333 },
    { key: 'ultimate',     name: '얼티메이덤 링',     p: 8.33333 },
    { key: 'risktaker',    name: '리스크테이커 링',   p: 8.33333 },
    { key: 'ringofsum',    name: '링 오브 썸',        p: 8.33333 },
    { key: 'critdmg',      name: '크리데미지 링',     p: 8.33333 },
    { key: 'crisis-hm',    name: '크라이시스 - HM링', p: 8.33333 },
  ],
};

/* ===================== 백옥 ===================== */
export const WHITE_BOX: BoxData = {
  id: 'white',
  title: '백옥의 보스 반지 상자 (최상급)',
  desc: '스킬 반지 레벨 3~4 부여',
  levelRates: { 3: 65, 4: 35 },
  ringRates: [
    { key: 'restraint',   name: '리스트레인트 링',   p: 14.28571 },
    { key: 'continuous',  name: '컨티뉴어스 링',     p: 14.28571 },

    { key: 'weaponpuff-s', name: '웨폰퍼프 - S링',   p: 7.93651 },
    { key: 'weaponpuff-i', name: '웨폰퍼프 - I링',   p: 7.93651 },
    { key: 'weaponpuff-l', name: '웨폰퍼프 - L링',   p: 7.93651 },
    { key: 'weaponpuff-d', name: '웨폰퍼프 - D링',   p: 7.93651 },
    { key: 'ultimate',     name: '얼티메이덤 링',     p: 7.93651 },
    { key: 'risktaker',    name: '리스크테이커 링',   p: 7.93651 },
    { key: 'ringofsum',    name: '링 오브 썸',        p: 7.93651 },
    { key: 'critdmg',      name: '크리데미지 링',     p: 7.93651 },
    { key: 'crisis-hm',    name: '크라이시스 - HM링', p: 7.93651 },
  ],
};

/* ===================== 생명 ===================== */
export const LIFE_BOX: BoxData = {
  id: 'life',
  title: '생명의 보스 반지 상자',
  desc: '스킬 반지 레벨 3~4 부여 (생명의 연마석 포함)',
  levelRates: { 3: 30, 4: 70 },
  ringRates: [
    { key: 'restraint',   name: '리스트레인트 링',   p: 14.51613 },
    { key: 'continuous',  name: '컨티뉴어스 링',     p: 14.51613 },

    { key: 'weaponpuff-s', name: '웨폰퍼프 - S링',   p: 8.06452 },
    { key: 'weaponpuff-i', name: '웨폰퍼프 - I링',   p: 8.06452 },
    { key: 'weaponpuff-l', name: '웨폰퍼프 - L링',   p: 8.06452 },
    { key: 'weaponpuff-d', name: '웨폰퍼프 - D링',   p: 8.06452 },
    { key: 'risktaker',    name: '리스크테이커 링',   p: 8.06452 },
    { key: 'ringofsum',    name: '링 오브 썸',        p: 8.06452 },
    { key: 'critdmg',      name: '크리데미지 링',     p: 8.06452 },

    { key: 'life-grind',   name: '생명의 연마석',      p: 14.51613 },
  ],
};

export const BOXES: BoxData[] = [BLACK_BOX, WHITE_BOX, LIFE_BOX];

/* ===================== 유틸 ===================== */
export function pickWeighted<T extends { p: number }>(items: T[]): T {
  const r = Math.random() * 100;
  let acc = 0;
  for (const item of items) {
    acc += item.p;
    if (r <= acc) return item;
  }
  return items[items.length - 1];
}

/* ===================== 특별 아이템 판별 함수 ===================== */
export function isSpecialResult(result: Result | null): boolean {
  if (!result) return false;

  const { ring, level } = result;
  if (ring.key === 'life-grind') {
    return true;
  }
  if ((ring.key === 'restraint' || ring.key === 'continuous') && level === 4) {
    return true;
  }

  return false;
}

export function rollLevel(levelRates: Partial<Record<RingLevel, number>>): RingLevel {
  const entries = Object.entries(levelRates) as [string, number][];
  const total = entries.reduce((s, [, p]) => s + (p || 0), 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const [lvlStr, p] of entries) {
    acc += p || 0;
    if (r <= acc) return Number(lvlStr) as RingLevel;
  }
  return Number(entries[entries.length - 1][0]) as RingLevel;
}
