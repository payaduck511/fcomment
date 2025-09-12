// /src/app/cooldown/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import CooldownClient from '@/features/cooldown/CooldownClient';

// head 정보를 metadata 객체로 변환
export const metadata: Metadata = {
  title: '메이플 사냥 쿨타임 도우미 | 메이플스토리 재획 타이머',
  description: '메이플스토리 사냥 스킬 쿨타임 도우미 - 메이플 재획 타이머 및 사냥 최적화 기능 제공',
  keywords: ['메이플 사냥', '메이플 쿨타임', '메이플 재획', '메이플 사냥 쿨타임', '메이플스토리 타이머'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플스토리 사냥 쿨타임 도우미 - 재획 타이머',
    description: '메이플 사냥 최적화 타이머 - 메이플 재획 및 사냥 쿨타임 트래커 제공',
    images: [{
        url: 'https://comment.pe.kr/assets/images/cooldown.png',
        alt: '메이플스토리 사냥 쿨타임 도우미'
    }],
    url: 'https://comment.pe.kr/cooldown',
  },
  icons: {
    icon: '/assets/images/logo.png',
  }
};

export default function CooldownPage() {
  return (
    <>
      <NavBar />
      <CooldownClient />
    </>
  );
}