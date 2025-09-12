// /src/app/applesim/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import AppleSimulatorClient from '@/features/applesim/AppleSimulatorClient';

export const metadata: Metadata = {
  title: '메이플 플래티넘 애플 시뮬레이터 | 메이플스토리 확률표',
  description: '메이플스토리 플래티넘 애플 시뮬레이터 - 메이플 애플 확률표 기반으로 원하는 옵션을 확인하세요.',
  keywords: ['메이플스토리', '플래티넘 애플', '메이플 시뮬레이터', '메이플스토리 애플', '플래티넘 애플 확률표'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플 플래티넘 애플 시뮬레이터 - 확률표 기반',
    description: '메이플스토리 플래티넘 애플 확률표 시뮬레이터 - 큐브 확률 및 사냥 쿨타임 트래커 제공',
    images: [
      {
        url: 'https://comment.pe.kr/assets/images/apple.png',
        width: 200,
        height: 200,
        alt: '플래티넘 애플',
      },
    ],
    url: 'https://comment.pe.kr/applesim',
  },
  icons: {
    icon: '/assets/images/apple.png',
  }
};

export default function AppleSimPage() {
  return (
    <>
      <NavBar />
      <AppleSimulatorClient />
    </>
  );
}