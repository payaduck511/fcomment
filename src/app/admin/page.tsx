// /src/app/admin/page.tsx

import type { Metadata } from 'next';
import NavBar from '@/features/common/NavBar';
import AdminClient from '@/features/admin/AdminClient';

export const metadata: Metadata = {
  title: '관리자 페이지 | 메이플 코멘트',
  description: '신고된 댓글을 관리하는 페이지입니다.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <>
      <NavBar />
      <AdminClient />
    </>
  );
}