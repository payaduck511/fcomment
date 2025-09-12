// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginClient from '@/features/login/LoginClient';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
