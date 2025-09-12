// src/app/reset-password/page.tsx
import { Suspense } from 'react';
import ResetPasswordClient from '@/features/reset-password/ResetPasswordClient';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
