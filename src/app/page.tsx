// /src/app/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import HomeClient from '@/features/home/HomeClient';

export const metadata: Metadata = {
  title: '메이플 코멘트 | 메이플스토리 시뮬레이터 & 커뮤니티',
  description: '메이플스토리 플래티넘 애플, 큐브 시뮬레이터와 사냥 쿨다운 트래커, 캐릭터 정보 조회 및 댓글 기능을 제공합니다.',
  keywords: ['메이플스토리', '메이플 코멘트', '큐브 시뮬레이터', '애플 시뮬레이터', '캐릭터 정보', '쿨다운', '메이플스토리 큐브', '메이플 큐브', '메이플 큐브 시뮬', '메이플스토리 큐브 시뮬'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플 코멘트 - 메이플스토리 유저 커뮤니티',
    description: '플래티넘 애플, 큐브 시뮬레이터와 사냥 쿨다운 트래커 등 다양한 편의 기능을 이용해보세요.',
    images: [{
        url: 'https://comment.pe.kr/assets/images/logo.png',
        alt: '메이플 코멘트 로고'
    }],
    url: 'https://comment.pe.kr',
  },
  icons: {
    icon: '/assets/images/logo.png',
  }
};

export default function HomePage() {
  return (
    <>
      <NavBar />
      <HomeClient />
    </>
  );
}