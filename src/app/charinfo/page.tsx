// /src/app/charinfo/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import CharInfoClient from '@/features/charinfo/CharInfoClient';

export const metadata: Metadata = {
  title: '캐릭터 상세 정보 | 메이플 인포',
  description: '메이플스토리 캐릭터 정보를 검색하고 장비, 스탯, 캐시 아이템을 확인하세요.',
  keywords: ['메이플스토리', '메이플 인포', '캐릭터 정보', '장비 조회'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플스토리 캐릭터 정보 조회',
    description: '닉네임을 검색하여 캐릭터의 상세 정보를 확인해보세요.',
    images: [{ url: 'https://comment.pe.kr/assets/images/logo.png' }],
    url: 'https://comment.pe.kr/charinfo',
  },
  icons: {
    icon: '/assets/images/logo.png',
  }
};

export default function CharInfoPage() {
  return (
    <>
      <NavBar />
      <CharInfoClient />
    </>
  );
}