// /src/app/chat/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import ChatClient from '@/features/chat/ChatClient';
import { Suspense } from 'react';

function ChatPageContents() {
    return (
        <Suspense fallback={<div>로딩 중...</div>}>
            <ChatClient />
        </Suspense>
    );
}

export const metadata: Metadata = {
  title: '캐릭터 채팅 | 메이플 코멘트',
  description: '메이플스토리 캐릭터를 검색하고 다른 유저들과 소통하세요. 직업별 채팅방이 제공됩니다.',
  keywords: ['메이플스토리', '캐릭터 채팅', '메이플 채팅', '직업 채팅'],
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플스토리 캐릭터 채팅',
    description: '다른 유저들과 특정 캐릭터에 대해 자유롭게 이야기할 수 있는 공간입니다.',
    images: [{ url: 'https://comment.pe.kr/assets/images/logo.png' }],
    url: 'https://comment.pe.kr/chat',
  },
  icons: {
    icon: '/assets/images/logo.png',
  }
};

export default function ChatPage() {
  return (
    <>
      <NavBar />
      <ChatPageContents />
    </>
  );
}