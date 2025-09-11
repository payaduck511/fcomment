// src/types/cube-simulator.d.ts
export type CubeType = 'black' | 'red' | 'additional';

export interface SimOptions {
  cube: CubeType;
  seed?: number;
}

export interface RollResult {
  lines: string[];
  tier: number;
  cost: number;
}

export interface CubeSimulatorInstance {
  roll(): RollResult;
  reset(): void;
  getState(): { totalCost: number; cube: CubeType };
}

declare global {
  interface Window {
    CubeSimulator: {
      new (opts: SimOptions): CubeSimulatorInstance;
    };
  }
}

export {};
