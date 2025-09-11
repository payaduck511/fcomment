// /src/features/cubesim/optionProvider.ts

import {
  potentialOptions, additionalOptions, emblemOptions, additionalEmblemOptions,
  subweaponOptions, additionalSubweaponOptions, PosoOptions, additionalPosoOptions,
  shOptions, additionalshOptions, HatOptions, additionalHatOptions, TopOptions, additionalTopOptions,
  OneOptions, additionalOneOptions, PantsOptions, additionalPantsOptions,
  ShoseOptions, additionalShoesOptions, GloveOptions, additionalGloveOptions,
  MangOptions, additionalMangOptions, BeltOptions, additionalBeltOptions,
  ArmOptions, additionalArmOptions, FaceOptions, additionalFaceOptions,
  EyeOptions, additionalEyeOptions, EarOptions, additionalEarOptions,
  RingOptions, additionalRingOptions, PenOptions, additionalPenOptions,
  HeartOptions, additionalHeartOptions
} from './cubeData';
import type { OptionProvider } from './useCubeSim';

// 레벨에 맞는 옵션 구간을 찾아주는 함수
function getLevelRange(level: number, equipmentType: string): string | null {
    // 장비 종류별로 레벨 구간이 다를 경우를 대비하여 분기
    switch (equipmentType) {
        case '기계심장':
            if (level >= 10 && level <= 100) return "10-100";
            if (level >= 101 && level <= 200) return "101-200";
            break;
        case '모자':
        case '상의':
        case '한벌옷':
        case '하의':
        case '신발':
        case '장갑':
        case '망토':
        case '벨트':
        case '어깨장식':
        case '얼굴장식':
        case '눈장식':
        case '귀고리':
        case '반지':
        case '펜던트':
            if (level >= 120 && level <= 200) return "120-200";
            if (level >= 201 && level <= 250) return "201-250";
            break;
        default: // 무기 및 기타
            if (level >= 10 && level <= 49) return "10-49";
            if (level >= 50 && level <= 79) return "50-79";
            if (level >= 80 && level <= 99) return "80-99";
            if (level >= 100 && level <= 200) return "100-200";
            break;
    }
    console.warn(`지원하지 않는 레벨 구간입니다: ${level} (${equipmentType})`);
    return null; 
}

// useCubeSim 훅에 주입될 새로운 OptionProvider 구현체
export const myOptionProvider: OptionProvider = ({
  equipmentType,
  level,
  grade,
  additional,
}) => {
  // useCubeSim 훅의 GradeKo 타입('레어')을 데이터 객체의 키('rare')로 변환
  const gradeEn = grade === '레어' ? 'rare' 
                : grade === '에픽' ? 'epic' 
                : grade === '유니크' ? 'unique' 
                : 'legendary';

  // 장비 종류에 따라 적절한 데이터 객체와 레벨 구간 필요 여부를 결정
  let optionsData;
  let useLevelRange = true;

  switch (equipmentType) {
    case '무기':
      optionsData = additional ? additionalOptions : potentialOptions;
      break;
    case '엠블렘':
      optionsData = additional ? additionalEmblemOptions : emblemOptions;
      useLevelRange = false;
      break;
    case '보조무기':
      optionsData = additional ? additionalSubweaponOptions : subweaponOptions;
      useLevelRange = false;
      break;
    case '포스실드, 소울링':
        optionsData = additional ? additionalPosoOptions : PosoOptions;
        useLevelRange = false;
        break;
    case '방패':
        optionsData = additional ? additionalshOptions : shOptions;
        useLevelRange = false;
        break;
    case '모자':
        optionsData = additional ? additionalHatOptions : HatOptions;
        break;
    case '상의':
        optionsData = additional ? additionalTopOptions : TopOptions;
        break;
    case '한벌옷':
        optionsData = additional ? additionalOneOptions : OneOptions;
        break;
    case '하의':
        optionsData = additional ? additionalPantsOptions : PantsOptions;
        break;
    case '신발':
        optionsData = additional ? additionalShoesOptions : ShoseOptions;
        break;
    case '장갑':
        optionsData = additional ? additionalGloveOptions : GloveOptions;
        break;
    case '망토':
        optionsData = additional ? additionalMangOptions : MangOptions;
        break;
    case '벨트':
        optionsData = additional ? additionalBeltOptions : BeltOptions;
        break;
    case '어깨장식':
        optionsData = additional ? additionalArmOptions : ArmOptions;
        break;
    case '얼굴장식':
        optionsData = additional ? additionalFaceOptions : FaceOptions;
        break;
    case '눈장식':
        optionsData = additional ? additionalEyeOptions : EyeOptions;
        break;
    case '귀고리':
        optionsData = additional ? additionalEarOptions : EarOptions;
        break;
    case '반지':
        optionsData = additional ? additionalRingOptions : RingOptions;
        break;
    case '펜던트':
        optionsData = additional ? additionalPenOptions : PenOptions;
        break;
    case '기계심장':
        optionsData = additional ? additionalHeartOptions : HeartOptions;
        break;
    default:
      optionsData = additional ? additionalOptions : potentialOptions;
      break;
  }
  
  if (useLevelRange) {
    const levelRange = getLevelRange(level, equipmentType);
    if (!levelRange) return null;
    return (optionsData as any)[levelRange]?.[gradeEn] ?? null;
  } else {
    return (optionsData as any)[gradeEn] ?? null;
  }
};