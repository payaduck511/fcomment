// src/features/applesim/AppleSim.ts

export type Item = { name: string; probability: number; image: string };

export const SPIN_COST = 3500;

export const items: Item[] = [
  { name: '카르마 스타포스 20성 강화권 (200제)', probability: 0.03, image: 'starforce200.png' },
  { name: '카르마 스타포스 20성 강화권 (160제)', probability: 0.06, image: 'starforce160.png' },
  { name: '카르마 스타포스 18성 강화권 (250제)', probability: 0.09, image: 'starforce250.png' },
  { name: '심연의 환생의 불꽃', probability: 7, image: 'simhwan.png' },
  { name: '펫장비 리턴 스크롤', probability: 1.5, image: 'petreturn.png' },
  { name: '펫장비 이노센트 주문서 100%', probability: 1.5, image: 'petino.png' },
  { name: '펫장비 순백의 주문서 100%', probability: 2, image: 'petsoon.png' },
  { name: '놀라운 긍정의 혼돈 주문서 100%', probability: 5.75, image: 'hondon.png' },
  { name: '리턴 스크롤', probability: 7, image: 'returnscroll.png' },
  { name: '매지컬 한손무기 공격력 주문서 50%', probability: 1.3, image: 'magicalhan.png' },
  { name: '매지컬 두손무기 공격력 주문서 50%', probability: 1.3, image: 'magicaltwo.png' },
  { name: '매지컬 한손무기 마력 주문서 50%', probability: 1.17, image: 'magicalhanma.png' },
  { name: '프리미엄 악세서리 공격력 스크롤 50%', probability: 1.95, image: 'premiumgong.png' },
  { name: '프리미엄 악세서리 마력 스크롤 50%', probability: 0.65, image: 'premiumma.png' },
  { name: '프리미엄 펫장비 공격력 스크롤 50%', probability: 3.9, image: 'premiumpetad.png' },
  { name: '프리미엄 펫장비 마력 스크롤 50%', probability: 1.3, image: 'premiumpetap.png' },
  { name: '경험치 3배 쿠폰 (30분)', probability: 9, image: 'exp3x.png' },
  { name: '경험치 4배 쿠폰 (30분)', probability: 5.5, image: 'exp4x.png' },
  { name: '선택 아케인심볼 교환권 10개', probability: 18, image: 'acain.png' },
  { name: '선택 어센틱심볼 교환권 10개', probability: 18, image: 'asentic.png' },
  { name: '희미한 솔 에르다의 기운 10개', probability: 9, image: 'littlesol.png' },
  { name: '솔 에르다의 기운', probability: 3, image: 'midsol.png' },
  { name: '짙은 솔 에르다의 기운', probability: 1, image: 'largesol.png' },
];

export function simulatePlatinumApple(list: Item[]): Item {
  let random = Math.random() * 100;
  let cumulativeProbability = 0;
  for (const item of list) {
    cumulativeProbability += item.probability;
    if (random < cumulativeProbability) return item;
  }
  return list[list.length - 1];
}

// 희귀 아이템 판별 로직은 그대로 유지
export function isRare(name: string): boolean {
  return (
    name.includes('카르마 스타포스 20성 강화권') ||
    name === '카르마 스타포스 18성 강화권 (250제)' ||
    name === '심연의 환생의 불꽃'
  );
}