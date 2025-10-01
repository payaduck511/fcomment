'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useReducer } from 'react';

export type GameUnit = {
  id: string;
  slot: number;
  rarity: 'N' | 'R' | 'U';
  type:
    | 'luminous'
    | 'bowmaster'
    | 'angelic-buster'
    | 'bishop'
    | 'blaster'
    | 'night-lord';
  level: number;
};

export type SkillCard =
  | { id: string; kind: 'unit-attack-up'; unitType: GameUnit['type']; amount: number }
  | { id: string; kind: 'unit-level'; unitType: GameUnit['type']; amount: number }
  | { id: string; kind: 'global-attack-up'; amount: number };

export type SkillDraft = {
  options: SkillCard[];
  rerollsUsed: number;
};

export type DrawSelection = {
  rarity: GameUnit['rarity'];
  unitType: GameUnit['type'];
};

export type GameState = {
  health: number;
  maxHealth: number;
  score: number;
  meso: number;
  wave: number;
  units: GameUnit[];
  drawUpgrades: number;
  lastDraw?: DrawSelection;
  skills: SkillCard[];
  skillDraft?: SkillDraft;
};

type Action =
  | { type: 'addScore'; amount: number }
  | { type: 'loseHealth'; amount: number }
  | { type: 'addMeso'; amount: number }
  | { type: 'spendMeso'; amount: number }
  | { type: 'setWave'; wave: number }
  | { type: 'placeUnit'; unit: GameUnit }
  | { type: 'removeUnit'; slot: number }
  | { type: 'moveUnit'; from: number; to: number }
  | { type: 'sellUnit'; slot: number }
  | { type: 'setLastDraw'; selection: DrawSelection | undefined }
  | { type: 'incrementDrawUpgrade' }
  | { type: 'startSkillDraft'; draft: SkillDraft }
  | { type: 'updateSkillDraft'; draft: SkillDraft }
  | { type: 'closeSkillDraft' }
  | { type: 'chooseSkill'; card: SkillCard }
  | { type: 'reset' };

export const MAX_DRAW_UPGRADES = 8;
export const MAX_SKILL_CARDS = 12;
export const MAX_HEALTH = 5;

export const BASE_DRAW_PROB = {
  N: 80,
  R: 18,
  U: 2,
} as const;

export const UPGRADE_STEP = {
  N: -3,
  R: 2,
  U: 1,
} as const;

const SELL_VALUE: Record<GameUnit['rarity'], number> = {
  N: 1,
  R: 2,
  U: 4,
};

export function getDrawProbabilities(drawUpgrades: number) {
  return {
    N: BASE_DRAW_PROB.N + UPGRADE_STEP.N * drawUpgrades,
    R: BASE_DRAW_PROB.R + UPGRADE_STEP.R * drawUpgrades,
    U: BASE_DRAW_PROB.U + UPGRADE_STEP.U * drawUpgrades,
  } as const;
}

const initialState: GameState = {
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  score: 0,
  meso: 5,
  wave: 1,
  units: [],
  drawUpgrades: 0,
  lastDraw: undefined,
  skills: [],
  skillDraft: undefined,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'loseHealth': {
      const health = Math.max(0, state.health - action.amount);
      return { ...state, health };
    }
    case 'addScore': {
      return { ...state, score: state.score + action.amount };
    }
    case 'addMeso': {
      return { ...state, meso: Math.max(0, state.meso + action.amount) };
    }
    case 'spendMeso': {
      const meso = Math.max(0, state.meso - action.amount);
      return { ...state, meso };
    }
    case 'setWave': {
      return { ...state, wave: action.wave };
    }
    case 'placeUnit': {
      const units = state.units.filter((unit) => unit.slot !== action.unit.slot).concat(action.unit);
      return { ...state, units };
    }
    case 'removeUnit': {
      const units = state.units.filter((unit) => unit.slot !== action.slot);
      return { ...state, units };
    }
    case 'moveUnit': {
      if (action.from === action.to) return state;
      const fromUnit = state.units.find((unit) => unit.slot === action.from);
      if (!fromUnit) return state;
      const units = state.units.map((unit) => {
        if (unit.slot === action.from) {
          return { ...unit, slot: action.to };
        }
        if (unit.slot === action.to) {
          return { ...unit, slot: action.from };
        }
        return unit;
      });
      return { ...state, units };
    }
    case 'sellUnit': {
      const target = state.units.find((unit) => unit.slot === action.slot);
      if (!target) return state;
      const refund = SELL_VALUE[target.rarity];
      const units = state.units.filter((unit) => unit.slot !== action.slot);
      return { ...state, units, meso: state.meso + refund };
    }
    case 'setLastDraw': {
      return { ...state, lastDraw: action.selection };
    }
    case 'incrementDrawUpgrade': {
      return {
        ...state,
        drawUpgrades: Math.min(MAX_DRAW_UPGRADES, state.drawUpgrades + 1),
      };
    }
    case 'startSkillDraft': {
      if (state.skills.length >= MAX_SKILL_CARDS) {
        return state;
      }
      return { ...state, skillDraft: action.draft };
    }
    case 'updateSkillDraft': {
      if (!state.skillDraft) return state;
      return { ...state, skillDraft: action.draft };
    }
    case 'closeSkillDraft': {
      if (!state.skillDraft) return state;
      return { ...state, skillDraft: undefined };
    }
    case 'chooseSkill': {
      if (state.skills.length >= MAX_SKILL_CARDS) {
        return { ...state, skillDraft: undefined };
      }
      return {
        ...state,
        skills: [...state.skills, action.card],
        skillDraft: undefined,
      };
    }
    case 'reset': {
      return { ...initialState };
    }
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

type GameStateContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider.');
  }
  return context.state;
}

export function useGameDispatch() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameDispatch must be used within a GameStateProvider.');
  }
  return context.dispatch;
}
