// /src/app/bossringsim/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import BossRingSimClient from '@/features/bosring/BossRingSimClient';

export const metadata: Metadata = {
  title: '메이플 보스 반지 상자 시뮬레이터',
  description: '흑옥, 백옥, 생명의 보스 반지 상자에서 나오는 스킬 반지의 종류와 레벨을 시뮬레이션 해보세요.',
  keywords: ['메이플스토리', '보스 반지', '반지 상자', '리스트레인트 링', '컨티뉴어스 링', '시뮬레이터'],
};

export default function BossRingSimPage() {
  return (
    <>
      <NavBar />
      <BossRingSimClient />
    </>
  );
}