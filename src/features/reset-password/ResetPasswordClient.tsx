// src/app/reset-password/ResetPasswordClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/app/reset-password/page.module.css';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const email = useMemo(() => searchParams.get('email') ?? '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [pending, setPending] = useState(false);

  async function handleResetPassword() {
    const trimmed = newPassword.trim();

    if (!trimmed || trimmed.length < 6) {
      alert('비밀번호는 최소 6자 이상 입력해주세요.');
      return;
    }
    if (!email) {
      alert('이메일 정보가 없습니다. 다시 시도해주세요.');
      return;
    }

    try {
      setPending(true);
      setResultMsg('');

      const response = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: trimmed }),
      });

      const data = await response.json().catch(() => ({} as any));

      if (response.ok) {
        setResultMsg('✅ 비밀번호가 성공적으로 재설정되었습니다!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setResultMsg(`❌ 오류: ${(data as any).error || '재설정에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setResultMsg('❌ 서버와 통신 중 문제가 발생했습니다.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2>비밀번호 재설정</h2>
        <p className={styles.desc}>
          {email ? `${email} 계정의 비밀번호를 새로 설정하세요.` : '이메일 정보 없음'}
        </p>
        <input
          type="password"
          placeholder="새로운 비밀번호 (6자 이상)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={styles.input}
          minLength={6}
          required
          disabled={pending}
        />
        <button onClick={handleResetPassword} className={styles.button} disabled={pending}>
          {pending ? '처리 중...' : '비밀번호 재설정'}
        </button>
        <div className={styles.result}>{resultMsg}</div>
      </div>
    </div>
  );
}
