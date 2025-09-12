// /src/app/job/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import JobClient from '@/features/job/JobClient';

export const metadata: Metadata = {
  title: '메이플 직업 추천 및 채팅 | 메이플스토리 직업 정보',
  description: '메이플스토리 직업 추천 및 직업별 채팅 기능 제공 - 모든 직업의 장단점 분석 및 유저와 소통 가능',
  keywords: ['메이플 직업', '메이플 직업 추천', '메이플 직업 채팅', '메이플스토리 직업', '메이플 직업 순위', '메이플 카드', '메이플 직업 카드'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플 직업 추천 및 채팅 | 메이플스토리 직업 정보',
    description: '메이플 직업 추천, 직업별 장단점 분석, 유저 간 직업 채팅 기능 제공',
    images: [
      {
        url: 'https://comment.pe.kr/assets/images/logo.png',
        width: 1200,
        height: 630,
        alt: '메이플스토리 직업 추천',
      },
    ],
    url: 'https://comment.pe.kr/job',
  },
  icons: {
    icon: '/assets/images/logo.png',
  }
};

export default function JobPage() {
  return (
    <>
      <NavBar />
      <JobClient />
    </>
  );
}