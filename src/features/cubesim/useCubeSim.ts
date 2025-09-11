// /src/features/cubesim/useCubeSim.ts

'use client';

import { useCallback, useMemo, useState } from 'react';

// --- 타입 정의 ---
export type GradeKo = '레어' | '에픽' | '유니크' | '레전드리';

// --- 추가: 등급 순서 정의 ---
const gradeOrder: Record<GradeKo, number> = {
  '레어': 0,
  '에픽': 1,
  '유니크': 2,
  '레전드리': 3,
};

export const gradeMapping: Record<GradeKo, 'rare' | 'epic' | 'unique' | 'legendary'> = {
  레어: 'rare',
  에픽: 'epic',
  유니크: 'unique',
  레전드리: 'legendary',
};

export const cubeRates = {
  rareToEpic: { rate: 0.15, guarantee: 10 },
  epicToUnique: { rate: 0.035, guarantee: 42 },
  uniqueToLegendary: { rate: 0.014, guarantee: 107 },
} as const;

export const additionalCubeRates = {
  rareToEpic: { rate: 0.047619, guarantee: 62 },
  epicToUnique: { rate: 0.019608, guarantee: 152 },
  uniqueToLegendary: { rate: 0.007, guarantee: 214 },
} as const;

export type SelectedItem = {
  equipmentType: string;
  level: number;
  potential: GradeKo;
  additionalPotential: GradeKo;
};

export type OptionProb = { option: string; probability: number };

export type OptionSet = {
  firstLine: OptionProb[];
  secondLine: OptionProb[];
  thirdLine: OptionProb[];
};

export type OptionProvider = (args: {
  equipmentType: string;
  level: number;
  grade: GradeKo;
  additional: boolean;
}) => OptionSet | null | undefined;

const gradeColors: Record<GradeKo, string> = {
  레어: 'lightblue',
  에픽: '#B184FF',
  유니크: '#FFD232',
  레전드리: '#86E57F',
};

type FailCounters = { rare: number; epic: number; unique: number };

export type UseCubeSimOptions = {
  optionProvider?: OptionProvider;
};

// --- 신규 타입 추가 ---
export type PotentialResult = {
  grade: GradeKo;
  lines: [string, string, string];
};

export type CubeResultState = {
  before: PotentialResult | null;
  after: PotentialResult[];
  gradeUpOccurred: boolean;
};

// --- 메인 훅 ---

export function useCubeSim(opts: UseCubeSimOptions = {}) {
  const { optionProvider } = opts;

  // 아이템, 모드, 옵션 상태
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isAdditionalMode, setIsAdditionalMode] = useState(false);
  const [isMvpBlackMode, setMvpBlackMode] = useState(false);
  const [isMiracleTime, setMiracleTime] = useState(false);

  // 현재 아이템에 적용된 등급 및 옵션 라인
  const [currentGrade, setCurrentGrade] = useState<GradeKo>('레어');
  const [additionalCurrentGrade, setAdditionalCurrentGrade] = useState<GradeKo>('레어');
  const [currentLines, setCurrentLines] = useState<[string, string, string]>(['', '', '']);
  const [additionalCurrentLines, setAdditionalCurrentLines] = useState<[string, string, string]>(['', '', '']);

  // 실패 카운터
  const [failCount, setFailCount] = useState<FailCounters>({ rare: 0, epic: 0, unique: 0 });
  const [additionalFailCount, setAdditionalFailCount] = useState<FailCounters>({ rare: 0, epic: 0, unique: 0 });

  // 큐브 결과물 (Before / After)
  const [cubeResults, setCubeResults] = useState<CubeResultState>({ before: null, after: [], gradeUpOccurred: false });

  /** 아이템 정보 저장 콜백 */
  const saveItem = useCallback((item: SelectedItem) => {
    if (!Number.isFinite(item.level) || item.level <= 0) {
      alert('장비 레벨을 올바르게 입력해주세요.');
      return;
    }
    const normalized: SelectedItem = { ...item, level: Math.floor(item.level) };
    setSelectedItem(normalized);
    setCurrentGrade(normalized.potential);
    setAdditionalCurrentGrade(normalized.additionalPotential);
    
    // 상태 초기화
    setCurrentLines(['옵션 1', '옵션 2', '옵션 3']);
    setAdditionalCurrentLines(['에디셔널 옵션 1', '에디셔널 옵션 2', '에디셔널 옵션 3']);
    setFailCount({ rare: 0, epic: 0, unique: 0 });
    setAdditionalFailCount({ rare: 0, epic: 0, unique: 0 });
    setCubeResults({ before: null, after: [], gradeUpOccurred: false }); // 초기화 시 gradeUpOccurred 추가
    alert('아이템 정보가 저장되었습니다. 큐브를 돌려보세요.');
  }, []);

  /** 가중치 배열에서 옵션 1개 랜덤 선택 */
  const pickOption = useCallback((options: OptionProb[]): string => {
    if (!Array.isArray(options) || options.length === 0) return '';
    const total = options.reduce((s, o) => s + (o.probability || 0), 0);
    if (total <= 0) return options[0]?.option ?? '';
    let r = Math.random() * total;
    for (const o of options) {
      const p = o.probability || 0;
      r -= p;
      if (r < 0) return o.option;
    }
    return options[options.length - 1]?.option ?? '';
  }, []);

  /** 새로운 옵션 3줄과 등급을 생성 (순수 함수) */
  const _generateNewPotentialSet = useCallback((
    baseGrade: GradeKo, 
    failCounters: FailCounters, 
    isAdditional: boolean
  ): { result: PotentialResult; nextFailCounters: FailCounters } => {
    if (!selectedItem) throw new Error("아이템 정보 없음");

    const rates = isAdditional ? additionalCubeRates : cubeRates;
    const miracleFactor = isMiracleTime ? 2 : 1;
    let nextGrade = baseGrade;
    const nextFailCounters = { ...failCounters };

    // 1. 등급업 결정
    if (baseGrade === '레어') {
      const key = 'rare';
      if (Math.random() < rates.rareToEpic.rate * miracleFactor || nextFailCounters[key] >= rates.rareToEpic.guarantee) {
        nextGrade = '에픽';
        nextFailCounters[key] = 0;
      } else {
        nextFailCounters[key]++;
      }
    } else if (baseGrade === '에픽') {
      const key = 'epic';
      if (Math.random() < rates.epicToUnique.rate * miracleFactor || nextFailCounters[key] >= rates.epicToUnique.guarantee) {
        nextGrade = '유니크';
        nextFailCounters[key] = 0;
      } else {
        nextFailCounters[key]++;
      }
    } else if (baseGrade === '유니크') {
        const key = 'unique';
      if (Math.random() < rates.uniqueToLegendary.rate * miracleFactor || nextFailCounters[key] >= rates.uniqueToLegendary.guarantee) {
        nextGrade = '레전드리';
        nextFailCounters[key] = 0;
      } else {
        nextFailCounters[key]++;
      }
    }

    // 2. 옵션 3줄 결정
    const provider = optionProvider ?? (() => null);
    const set = provider({ 
        equipmentType: selectedItem.equipmentType, 
        level: selectedItem.level, 
        grade: nextGrade, 
        additional: isAdditional 
    });

    const lines: [string, string, string] = [
        pickOption(set?.firstLine ?? [{option: '옵션(1)', probability: 1}]),
        pickOption(set?.secondLine ?? [{option: '옵션(2)', probability: 1}]),
        pickOption(set?.thirdLine ?? [{option: '옵션(3)', probability: 1}])
    ];

    return { result: { grade: nextGrade, lines }, nextFailCounters };
  }, [selectedItem, isMiracleTime, optionProvider, pickOption]);

  /** 큐브 돌리기 (재설정) 버튼 핸들러 */
  const handleCubeReroll = useCallback(() => {
    if (!selectedItem) {
      alert('아이템 정보를 먼저 저장해주세요.');
      return;
    }

    const currentItemGrade = isAdditionalMode ? additionalCurrentGrade : currentGrade;
    const currentItemLines = isAdditionalMode ? additionalCurrentLines : currentLines;
    const currentFailCount = isAdditionalMode ? additionalFailCount : failCount;
    
    const beforeResult: PotentialResult = {
      grade: currentItemGrade,
      lines: currentItemLines,
    };

    const numResults = isMvpBlackMode ? 3 : 1;
    const afterResults: PotentialResult[] = [];
    let lastFailCounters = currentFailCount;

    for (let i = 0; i < numResults; i++) {
      const { result, nextFailCounters } = _generateNewPotentialSet(currentItemGrade, lastFailCounters, isAdditionalMode);
      afterResults.push(result);
      lastFailCounters = nextFailCounters;
    }
    
    // --- 추가: 등급업 발생 여부 체크 ---
    const beforeGradeValue = gradeOrder[beforeResult.grade];
    const gradeUpOccurred = afterResults.some(result => gradeOrder[result.grade] > beforeGradeValue);

    // 상태 업데이트
    if (isAdditionalMode) {
      setAdditionalFailCount(lastFailCounters);
    } else {
      setFailCount(lastFailCounters);
    }
    setCubeResults({ before: beforeResult, after: afterResults, gradeUpOccurred }); // gradeUpOccurred 결과 저장

  }, [selectedItem, isAdditionalMode, isMvpBlackMode, currentGrade, additionalCurrentGrade, currentLines, additionalCurrentLines, failCount, additionalFailCount, _generateNewPotentialSet]);

  /** 결과물 중 하나를 현재 아이템에 적용 */
  const applyResult = useCallback((result: PotentialResult | null) => {
    if (!result) { // Before 옵션 선택 혹은 취소
        setCubeResults({ before: null, after: [], gradeUpOccurred: false });
        return;
    }
    
    if (isAdditionalMode) {
        setAdditionalCurrentGrade(result.grade);
        setAdditionalCurrentLines(result.lines);
    } else {
        setCurrentGrade(result.grade);
        setCurrentLines(result.lines);
    }

    // 결과 창 닫기
    setCubeResults({ before: null, after: [], gradeUpOccurred: false });
  }, [isAdditionalMode]);

  /** 표시용 텍스트 (기존과 동일) */
   const failText = useMemo(
    () => `레어 실패: ${failCount.rare}/${cubeRates.rareToEpic.guarantee} | 에픽 실패: ${failCount.epic}/${cubeRates.epicToUnique.guarantee} | 유니크 실패: ${failCount.unique}/${cubeRates.uniqueToLegendary.guarantee}`,
    [failCount]
  );
  const additionalFailText = useMemo(
    () => `레어 실패: ${additionalFailCount.rare}/${additionalCubeRates.rareToEpic.guarantee} | 에픽 실패: ${additionalFailCount.epic}/${additionalCubeRates.epicToUnique.guarantee} | 유니크 실패: ${additionalFailCount.unique}/${additionalCubeRates.uniqueToLegendary.guarantee}`,
    [additionalFailCount]
  );

  /** 현재 등급에 맞는 색상과 라벨 (기존과 유사) */
  const activeGradeBox = useMemo(() => {
    const grade = isAdditionalMode ? additionalCurrentGrade : currentGrade;
    return {
      color: gradeColors[grade],
      label: isAdditionalMode ? `${grade} (에디셔널)` : grade,
    };
  }, [isAdditionalMode, currentGrade, additionalCurrentGrade]);

  const activeLines = isAdditionalMode ? additionalCurrentLines : currentLines;

  return {
    // 설정
    isMvpBlackMode,
    setMvpBlackMode,
    isMiracleTime,
    setMiracleTime,
    isAdditionalMode,
    setIsAdditionalMode,
    saveItem,
    
    // 현재 아이템 상태
    currentGrade,
    additionalCurrentGrade,
    line1: activeLines[0],
    line2: activeLines[1],
    line3: activeLines[2],
    
    // 큐브 결과
    cubeResults,
    
    // 액션
    handleCubeReroll,
    applyResult,

    // 표시용
    failText,
    additionalFailText,
    activeGradeBox,
    gradeColors,
    gradeOrder,
  };
}