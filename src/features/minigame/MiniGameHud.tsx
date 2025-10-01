'use client';

import { useMemo } from 'react';
import {
  MAX_DRAW_UPGRADES,
  MAX_SKILL_CARDS,
  type SkillCard,
  type SkillDraft,
  getDrawProbabilities,
  useGameDispatch,
  useGameState,
} from './state/gameState';

const UNIT_NAMES = {
  luminous: '루미너스',
  bowmaster: '신궁',
  'angelic-buster': '엔젤릭버스터',
  bishop: '비숍',
  blaster: '블래스터',
  'night-lord': '나이트로드',
} as const;

const RARITY_LABEL = {
  N: 'Normal',
  R: 'Rare',
  U: 'Unique',
} as const;

const DRAW_COST = 2;
const UPGRADE_COST = 1;
const MAX_UNITS = 9;

const SKILL_BASE_COST = 3;
const SKILL_COST_STEP = 3;
const SKILL_REROLL_COST = 1;
const MAX_UNIT_LEVEL = 5;
const MAX_BISHOP_LEVEL = 3;

function randId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function rollRarity(probabilities: ReturnType<typeof getDrawProbabilities>) {
  const roll = Math.random() * 100;
  if (roll < probabilities.U) return 'U' as const;
  if (roll < probabilities.U + probabilities.R) return 'R' as const;
  return 'N' as const;
}

function rollUnitType() {
  const keys = Object.keys(UNIT_NAMES) as Array<keyof typeof UNIT_NAMES>;
  const index = Math.floor(Math.random() * keys.length);
  return keys[index];
}

function findFreeSlot(isOccupied: (slot: number) => boolean) {
  for (let slot = 0; slot < MAX_UNITS; slot += 1) {
    if (!isOccupied(slot)) return slot;
  }
  return undefined;
}

function getUnitLevel(skills: SkillCard[], unitType: keyof typeof UNIT_NAMES) {
  return skills
    .filter((skill) => skill.kind === 'unit-level' && skill.unitType === unitType)
    .reduce((total, skill) => total + skill.amount, 0);
}

function createUnitAttackCard(skills: SkillCard[]): SkillCard {
  const unitType = rollUnitType();
  const amount = Math.round((0.1 + Math.random() * 0.07) * 100) / 100; // 10% ~ 17%
  return {
    id: randId('skill'),
    kind: 'unit-attack-up',
    unitType,
    amount,
  };
}

function createUnitLevelCard(skills: SkillCard[]): SkillCard | undefined {
  const types = Object.keys(UNIT_NAMES) as Array<keyof typeof UNIT_NAMES>;
  const available = types.filter((unitType) => {
    const currentLevel = getUnitLevel(skills, unitType);
    const cap = unitType === 'bishop' ? MAX_BISHOP_LEVEL : MAX_UNIT_LEVEL;
    return currentLevel < cap;
  });
  if (available.length === 0) return undefined;
  const unitType = available[Math.floor(Math.random() * available.length)];
  return {
    id: randId('skill'),
    kind: 'unit-level',
    unitType,
    amount: 1,
  };
}

function createGlobalAttackCard(): SkillCard {
  const amount = Math.round((0.06 + Math.random() * 0.06) * 100) / 100; // 6% ~ 12%
  return {
    id: randId('skill'),
    kind: 'global-attack-up',
    amount,
  };
}

function generateSkillOptions(skills: SkillCard[]): SkillCard[] {
  const options: SkillCard[] = [];
  const generators: Array<() => SkillCard | undefined> = [
    () => createUnitAttackCard(skills),
    () => createUnitLevelCard(skills),
    () => createGlobalAttackCard(),
  ];

  while (options.length < 3) {
    const generator = generators[Math.floor(Math.random() * generators.length)];
    const card = generator();
    if (!card) {
      // fallback to global attack if generator returns undefined (e.g., level cap reached)
      options.push(createGlobalAttackCard());
      continue;
    }
    options.push(card);
  }

  return options;
}

function describeSkill(card: SkillCard) {
  switch (card.kind) {
    case 'unit-attack-up':
      return `${UNIT_NAMES[card.unitType]} 공격력 +${Math.round(card.amount * 100)}%`;
    case 'unit-level':
      if (card.unitType === 'bishop') {
        const nextLevel = card.amount;
        return `${UNIT_NAMES.bishop} 프레이 범위 +${nextLevel}칸`;
      }
      return `${UNIT_NAMES[card.unitType]} 스킬 레벨 +${card.amount}`;
    case 'global-attack-up':
      return `전 캐릭터 공격력 +${Math.round(card.amount * 100)}%`;
    default:
      return '알 수 없는 스킬';
  }
}

export default function MiniGameHud() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const probabilities = useMemo(
    () => getDrawProbabilities(state.drawUpgrades),
    [state.drawUpgrades],
  );

  const lastDrawLabel = useMemo(() => {
    if (!state.lastDraw) return '미획득';
    return ` · `;
  }, [state.lastDraw]);

  const canDrawUnit = state.meso >= DRAW_COST && state.units.length < MAX_UNITS;
  const canUpgrade =
    state.meso >= UPGRADE_COST && state.drawUpgrades < MAX_DRAW_UPGRADES;

  const unitSlotsRemaining = Math.max(0, MAX_UNITS - state.units.length);

  const skillSlotsRemaining = MAX_SKILL_CARDS - state.skills.length;
  const currentSkillCost = SKILL_BASE_COST + state.skills.length * SKILL_COST_STEP;

  const canDrawSkill =
    !state.skillDraft &&
    state.skills.length < MAX_SKILL_CARDS &&
    state.meso >= currentSkillCost;
  const canReroll = state.skillDraft !== undefined && state.meso >= SKILL_REROLL_COST;

  const handleDrawUnit = () => {
    if (!canDrawUnit) return;
    const occupiedSlots = new Set(state.units.map((unit) => unit.slot));
    const freeSlot = findFreeSlot((slot) => occupiedSlots.has(slot));
    if (freeSlot === undefined) return;

    dispatch({ type: 'spendMeso', amount: DRAW_COST });
    const rarity = rollRarity(probabilities);
    const unitType = rollUnitType();
    const selection = { rarity, unitType } as const;
    dispatch({ type: 'setLastDraw', selection });
    dispatch({
      type: 'placeUnit',
      unit: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        slot: freeSlot,
        rarity,
        type: unitType,
        level: 1,
      },
    });
  };

  const handleUpgrade = () => {
    if (!canUpgrade) return;
    dispatch({ type: 'spendMeso', amount: UPGRADE_COST });
    dispatch({ type: 'incrementDrawUpgrade' });
  };

  const handleSkillDraw = () => {
    if (!canDrawSkill) return;
    const options = generateSkillOptions(state.skills);
    dispatch({ type: 'spendMeso', amount: currentSkillCost });
    dispatch({ type: 'startSkillDraft', draft: { options, rerollsUsed: 0 } });
  };

  const handleSkillReroll = () => {
    if (!canReroll || !state.skillDraft) return;
    const options = generateSkillOptions(state.skills);
    dispatch({ type: 'spendMeso', amount: SKILL_REROLL_COST });
    dispatch({
      type: 'updateSkillDraft',
      draft: { options, rerollsUsed: state.skillDraft.rerollsUsed + 1 },
    });
  };

  const handleSkillSelect = (card: SkillCard) => {
    dispatch({ type: 'chooseSkill', card });
  };

  const handleSkillDraftClose = () => {
    dispatch({ type: 'closeSkillDraft' });
  };

  return (
    <aside
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        background: 'rgba(12, 14, 18, 0.55)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#8a929e' }}>HEALTH</span>
        <strong style={{ fontSize: '20px' }}>{state.health} / {state.maxHealth}</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#8a929e' }}>SCORE</span>
        <strong style={{ fontSize: '20px' }}>{state.score.toLocaleString()}</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#8a929e' }}>MESO</span>
        <strong style={{ fontSize: '20px' }}>{state.meso.toLocaleString()}</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#8a929e' }}>WAVE</span>
        <strong style={{ fontSize: '20px' }}>{state.wave}</strong>
      </div>

      <div
        style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(20, 24, 32, 0.55)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#8a929e' }}>
                LAST DRAW RESULT
              </span>
              <strong style={{ fontSize: '16px' }}>{lastDrawLabel}</strong>
              <span style={{ fontSize: '12px', color: '#6e7783' }}>보드의 빈 슬롯이 없으면 뽑을 수 없어요</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#8a929e' }}>확률 강화 단계</span>
              <div style={{ fontSize: '13px', color: '#d6dae2' }}>
                {state.drawUpgrades} / {MAX_DRAW_UPGRADES}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDrawUnit}
              disabled={!canDrawUnit}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: canDrawUnit
                  ? 'linear-gradient(135deg, #6ad0a1 0%, #59a7ff 100%)'
                  : 'rgba(40, 44, 56, 0.65)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: canDrawUnit ? 'pointer' : 'not-allowed',
                transition: 'filter 0.15s ease',
              }}
            >
              캐릭터 뽑기 (-{DRAW_COST} 메소 / 남은 슬롯 {unitSlotsRemaining}개)
            </button>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={!canUpgrade}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: canUpgrade
                  ? 'linear-gradient(135deg, #f8b84b 0%, #ff7d59 100%)'
                  : 'rgba(40, 44, 56, 0.65)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: canUpgrade ? 'pointer' : 'not-allowed',
                transition: 'filter 0.15s ease',
              }}
            >
              뽑기 확률 강화 (-{UPGRADE_COST} 메소 / 현재 {state.drawUpgrades}단계)
            </button>

            <button
              type="button"
              onClick={handleSkillDraw}
              disabled={!canDrawSkill}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: canDrawSkill
                  ? 'linear-gradient(135deg, #6ad0a1 0%, #59a7ff 100%)'
                  : 'rgba(40, 44, 56, 0.65)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: canDrawSkill ? 'pointer' : 'not-allowed',
                transition: 'filter 0.15s ease',
              }}
            >
              스킬 카드 뽑기 (-{currentSkillCost} 메소 / 남은 {skillSlotsRemaining}장)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#8a929e' }}>현재 뽑기 확률</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              {([...Object.keys(RARITY_LABEL)] as Array<keyof typeof RARITY_LABEL>).map((rarity) => (
                <div
                  key={rarity}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(30, 34, 44, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <strong style={{ fontSize: '14px' }}>{RARITY_LABEL[rarity]}</strong>
                  <span style={{ fontSize: '12px', color: '#9da4b2' }}>
                    {probabilities[rarity].toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(20, 24, 32, 0.45)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '16px',
          }}
        >
          <strong style={{ fontSize: '14px' }}>보유 스킬</strong>\n          <span style={{ fontSize: '12px', color: '#9ca3af' }}>\n            {state.skills.length} / {MAX_SKILL_CARDS}\n          </span>
          {state.skills.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#8a929e' }}>획득한 스킬이 없습니다.</span>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {state.skills.map((skill) => (
                <li
                  key={skill.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(32, 36, 46, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '12px',
                    color: '#d6dae2',
                  }}
                >
                  {describeSkill(skill)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {state.skillDraft && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 8, 12, 0.75)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(18, 20, 28, 0.95)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px',
              width: 'min(560px, 90vw)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: '#eef1f7',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '16px' }}>스킬 카드 선택</strong>
              <button
                type="button"
                onClick={handleSkillDraftClose}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(40, 44, 56, 0.65)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>

            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              원하는 스킬 카드를 선택하세요.
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}
            >
              {state.skillDraft.options.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSkillSelect(card)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(45, 52, 68, 0.85)',
                    color: '#fff',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#aab3c5', letterSpacing: '0.05em' }}>
                    {card.kind === 'unit-attack-up'
                      ? '유닛 공격력'
                      : card.kind === 'unit-level'
                        ? '유닛 레벨'
                        : '전체 공격력'}
                  </span>
                  <span>{describeSkill(card)}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSkillReroll}
                disabled={!canReroll}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: canReroll
                    ? 'linear-gradient(135deg, #f8b84b 0%, #ff7d59 100%)'
                    : 'rgba(40, 44, 56, 0.65)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: canReroll ? 'pointer' : 'not-allowed',
                  transition: 'filter 0.15s ease',
                }}
              >
                스킬 카드 새로고침 (-{SKILL_REROLL_COST} 메소)
              </button>
              <span style={{ fontSize: '12px', color: '#8a929e' }}>
                사용한 리롤: {state.skillDraft.rerollsUsed}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
