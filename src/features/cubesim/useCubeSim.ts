'use client';

import { useCallback, useMemo, useState } from 'react';

/** 등급 타입 */
export type GradeKo = '레어' | '에픽' | '유니크' | '레전드리';

/** 내부 매핑 */
export const gradeMapping: Record<GradeKo, 'rare' | 'epic' | 'unique' | 'legendary'> = {
  레어: 'rare',
  에픽: 'epic',
  유니크: 'unique',
  레전드리: 'legendary',
};

/** 기본 큐브 확률/보장 */
export const cubeRates = {
  rareToEpic: { rate: 0.15, guarantee: 10 },
  epicToUnique: { rate: 0.035, guarantee: 42 },
  uniqueToLegendary: { rate: 0.014, guarantee: 107 },
} as const;

/** 에디셔널 큐브 확률/보장 */
export const additionalCubeRates = {
  rareToEpic: { rate: 0.047619, guarantee: 62 },
  epicToUnique: { rate: 0.019608, guarantee: 152 },
  uniqueToLegendary: { rate: 0.007, guarantee: 214 },
} as const;

/** 장비 선택 정보 */
export type SelectedItem = {
  equipmentType: string;
  level: number;
  potential: GradeKo;
  additionalPotential: GradeKo;
};

/** 옵션 가중치 타입 */
export type OptionProb = { option: string; probability: number };

/** 한 번 스핀 시 세 줄 세트 */
export type OptionSet = {
  firstLine: OptionProb[];
  secondLine: OptionProb[];
  thirdLine: OptionProb[];
};

/** 옵션 제공자 인터페이스 (주입형) */
export type OptionProvider = (args: {
  equipmentType: string;
  level: number;
  grade: GradeKo;
  additional: boolean;
}) => OptionSet | null | undefined;

/** 등급 → 박스 색상 */
const gradeColors: Record<GradeKo, string> = {
  레어: 'lightblue',
  에픽: '#6E6EFF',
  유니크: '#FFD232',
  레전드리: '#86E57F',
};

type FailCounters = { rare: number; epic: number; unique: number };

export type UseCubeSimOptions = {
  optionProvider?: OptionProvider;
};

export function useCubeSim(opts: UseCubeSimOptions = {}) {
  const { optionProvider } = opts;

  // 선택된 아이템 & 모드
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isAdditionalMode, setIsAdditionalMode] = useState(false);

  // 현재 등급
  const [currentGrade, setCurrentGrade] = useState<GradeKo>('레어');
  const [additionalCurrentGrade, setAdditionalCurrentGrade] = useState<GradeKo>('레어');

  // 실패 카운터
  const [failCount, setFailCount] = useState<FailCounters>({ rare: 0, epic: 0, unique: 0 });
  const [additionalFailCount, setAdditionalFailCount] = useState<FailCounters>({ rare: 0, epic: 0, unique: 0 });

  // 결과 옵션 라인
  const [line1, setLine1] = useState<string>('');
  const [line2, setLine2] = useState<string>('');
  const [line3, setLine3] = useState<string>('');

  /** 아이템 저장 */
  const saveItem = useCallback(
    (item: SelectedItem) => {
      if (!Number.isFinite(item.level)) {
        alert('장비 레벨을 올바르게 입력해주세요.');
        return;
      }
      const level = Math.max(0, Math.floor(item.level));
      if (!Number.isFinite(level)) {
        alert('장비 레벨을 올바르게 입력해주세요.');
        return;
      }
      const normalized: SelectedItem = { ...item, level };
      setSelectedItem(normalized);
      setCurrentGrade(normalized.potential);
      setAdditionalCurrentGrade(normalized.additionalPotential);
      // 카운터 초기화
      setFailCount({ rare: 0, epic: 0, unique: 0 });
      setAdditionalFailCount({ rare: 0, epic: 0, unique: 0 });
      alert('아이템 정보가 저장되었습니다. 큐브를 돌려보세요.');
    },
    []
  );

  /** 가중치에서 옵션 하나 뽑기 */
  const pickOption = useCallback((options: OptionProb[]): string => {
    if (!Array.isArray(options) || options.length === 0) return '';
    const total = options.reduce((s, o) => s + (o.probability || 0), 0);
    if (total <= 0) return options[0]?.option ?? '';
    let r = Math.random() * total;
    let cum = 0;
    for (const o of options) {
      const p = o.probability || 0;
      cum += p;
      if (r < cum) return o.option;
    }
    // fallback
    return options[options.length - 1]?.option ?? '';
  }, []);

  /** 옵션 생성 (기본/에디셔널 공용) */
  const generate = useCallback(
    (additional: boolean) => {
      if (!selectedItem) {
        alert('아이템 정보를 먼저 저장해주세요.');
        return;
      }
      const equipmentType = selectedItem.equipmentType;
      const level = selectedItem.level;
      const gradeKo = additional ? additionalCurrentGrade : currentGrade;

      // 옵션 제공자 호출 (없으면 스텁)
      const provider: OptionProvider =
        optionProvider ??
        (() => ({
          firstLine: [{ option: '옵션 데이터 없음(1줄)', probability: 1 }],
          secondLine: [{ option: '옵션 데이터 없음(2줄)', probability: 1 }],
          thirdLine: [{ option: '옵션 데이터 없음(3줄)', probability: 1 }],
        }));

      let set: OptionSet | null | undefined;
      try {
        set = provider({ equipmentType, level, grade: gradeKo, additional });
      } catch (e) {
        console.error('optionProvider 오류:', e);
        set = {
          firstLine: [{ option: '옵션 데이터 로드 실패(1줄)', probability: 1 }],
          secondLine: [{ option: '옵션 데이터 로드 실패(2줄)', probability: 1 }],
          thirdLine: [{ option: '옵션 데이터 로드 실패(3줄)', probability: 1 }],
        };
      }

      if (!set) {
        alert(additional ? '에디셔널 옵션을 가져오지 못했습니다.' : '옵션을 가져오지 못했습니다.');
        return;
      }

      const safeSet: OptionSet = {
        firstLine: Array.isArray(set.firstLine) && set.firstLine.length ? set.firstLine : [{ option: '옵션 없음(1줄)', probability: 1 }],
        secondLine: Array.isArray(set.secondLine) && set.secondLine.length ? set.secondLine : [{ option: '옵션 없음(2줄)', probability: 1 }],
        thirdLine: Array.isArray(set.thirdLine) && set.thirdLine.length ? set.thirdLine : [{ option: '옵션 없음(3줄)', probability: 1 }],
      };

      setLine1(pickOption(safeSet.firstLine));
      setLine2(pickOption(safeSet.secondLine));
      setLine3(pickOption(safeSet.thirdLine));
    },
    [selectedItem, currentGrade, additionalCurrentGrade, optionProvider, pickOption]
  );

  /** 등급 업그레이드 (기본) */
  const upgradeGrade = useCallback(() => {
    if (!selectedItem || isAdditionalMode) {
      if (!selectedItem) alert('아이템 정보를 먼저 저장해주세요.');
      return;
    }
    // 이미 최고 등급이면 종료
    if (currentGrade === '레전드리') return;

    setCurrentGrade((gradePrev) => {
      let next = gradePrev;
      setFailCount((prev) => {
        const fc = { ...prev };

        if (gradePrev === '레어') {
          if (Math.random() < cubeRates.rareToEpic.rate || fc.rare >= cubeRates.rareToEpic.guarantee) {
            next = '에픽';
            fc.rare = 0;
          } else {
            fc.rare++;
          }
        } else if (gradePrev === '에픽') {
          if (Math.random() < cubeRates.epicToUnique.rate || fc.epic >= cubeRates.epicToUnique.guarantee) {
            next = '유니크';
            fc.epic = 0;
          } else {
            fc.epic++;
          }
        } else if (gradePrev === '유니크') {
          if (Math.random() < cubeRates.uniqueToLegendary.rate || fc.unique >= cubeRates.uniqueToLegendary.guarantee) {
            next = '레전드리';
            fc.unique = 0;
          } else {
            fc.unique++;
          }
        }
        return fc;
      });

      // 라인 갱신
      setTimeout(() => generate(false), 0);
      return next;
    });
  }, [currentGrade, generate, isAdditionalMode, selectedItem]);

  /** 등급 업그레이드 (에디셔널) */
  const upgradeAdditionalGrade = useCallback(() => {
    if (!selectedItem || !isAdditionalMode) {
      if (!selectedItem) alert('아이템 정보를 먼저 저장해주세요.');
      return;
    }
    // 이미 최고 등급이면 종료
    if (additionalCurrentGrade === '레전드리') return;

    setAdditionalCurrentGrade((gradePrev) => {
      let next = gradePrev;
      setAdditionalFailCount((prev) => {
        const fc = { ...prev };

        if (gradePrev === '레어') {
          if (
            Math.random() < additionalCubeRates.rareToEpic.rate ||
            fc.rare >= additionalCubeRates.rareToEpic.guarantee
          ) {
            next = '에픽';
            fc.rare = 0;
          } else {
            fc.rare++;
          }
        } else if (gradePrev === '에픽') {
          if (
            Math.random() < additionalCubeRates.epicToUnique.rate ||
            fc.epic >= additionalCubeRates.epicToUnique.guarantee
          ) {
            next = '유니크';
            fc.epic = 0;
          } else {
            fc.epic++;
          }
        } else if (gradePrev === '유니크') {
          if (
            Math.random() < additionalCubeRates.uniqueToLegendary.rate ||
            fc.unique >= additionalCubeRates.uniqueToLegendary.guarantee
          ) {
            next = '레전드리';
            fc.unique = 0;
          } else {
            fc.unique++;
          }
        }
        return fc;
      });

      // 라인 갱신
      setTimeout(() => generate(true), 0);
      return next;
    });
  }, [additionalCurrentGrade, generate, isAdditionalMode, selectedItem]);

  /** 버튼 핸들러 (기본 큐브) */
  const onClickCube = useCallback(() => {
    setIsAdditionalMode(false);
    upgradeGrade();
  }, [upgradeGrade]);

  /** 버튼 핸들러 (에디셔널 큐브) */
  const onClickAdditionalCube = useCallback(() => {
    setIsAdditionalMode(true);
    upgradeAdditionalGrade();
  }, [upgradeAdditionalGrade]);

  /** 표시용 문자열 */
  const failText = useMemo(
    () =>
      `레어 실패: ${failCount.rare}/${cubeRates.rareToEpic.guarantee} | ` +
      `에픽 실패: ${failCount.epic}/${cubeRates.epicToUnique.guarantee} | ` +
      `유니크 실패: ${failCount.unique}/${cubeRates.uniqueToLegendary.guarantee}`,
    [failCount]
  );

  const additionalFailText = useMemo(
    () =>
      `레어 실패: ${additionalFailCount.rare}/${additionalCubeRates.rareToEpic.guarantee} | ` +
      `에픽 실패: ${additionalFailCount.epic}/${additionalCubeRates.epicToUnique.guarantee} | ` +
      `유니크 실패: ${additionalFailCount.unique}/${additionalCubeRates.uniqueToLegendary.guarantee}`,
    [additionalFailCount]
  );

  const gradeBox = useMemo(
    () => ({
      color: gradeColors[currentGrade],
      label: currentGrade,
    }),
    [currentGrade]
  );

  const gradeBoxAdditional = useMemo(
    () => ({
      color: gradeColors[additionalCurrentGrade],
      label: `${additionalCurrentGrade} (에디셔널)`,
    }),
    [additionalCurrentGrade]
  );

  return {
    // 아이템/모드
    selectedItem,
    isAdditionalMode,
    setIsAdditionalMode,
    saveItem,

    // 등급 & 카운터
    currentGrade,
    additionalCurrentGrade,
    failCount,
    additionalFailCount,

    // 라인 결과
    line1,
    line2,
    line3,

    // 표시/색상
    failText,
    additionalFailText,
    gradeBox,
    gradeBoxAdditional,

    // 액션
    onClickCube,
    onClickAdditionalCube,
    upgradeGrade,
    upgradeAdditionalGrade,
    generate,
  };
}
