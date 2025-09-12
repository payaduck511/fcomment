// /src/app/cubesim/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import CubeSimulatorClient from '@/features/cubesim/CubeSimulatorClient';

// head 정보를 metadata 객체로 변환
export const metadata: Metadata = {
  title: '메이플 큐브 시뮬레이터 | 메이플스토리 큐브 확률 계산',
  description: '메이플스토리 큐브 시뮬레이터 - 메이플 큐브 확률표 기반 시뮬레이션 및 강화 확률 계산 제공',
  keywords: ['메이플 큐브 시뮬레이터', '메이플 큐브 시뮬', '메이플 큐브', '메이플스토리 큐브', '메이플스토리 큐브 시뮬레이터', '메이플스토리 큐브 시뮬'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플 큐브 시뮬레이터 - 강화 확률 계산',
    description: '메이플스토리 큐브 시뮬레이터 - 큐브 확률표 및 강화 성공률을 예측하는 시뮬레이션',
    images: [{
        url: 'https://comment.pe.kr/assets/images/cube.png',
        alt: '메이플스토리 큐브 시뮬레이터'
    }],
    url: 'https://comment.pe.kr/cubesim',
  },
  icons: {
    icon: '/assets/images/blackcube.png',
  }
};

export default function CubeSimPage() {
  return (
    <>
      <NavBar />
      <CubeSimulatorClient />
    </>
  );
}