// src/app/job-chat/page.tsx
import { Suspense } from 'react';
import NavBar from '@/features/common/NavBar';
import JobChatClient from '@/features/job-chat/JobChatClient';

export default function Page() {
  return (
    <>
      <NavBar />
      <Suspense fallback={null}>
        <JobChatClient />
      </Suspense>
    </>
  );
}
