'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useFindPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  // 쿨타임 감소 (중첩 인터벌 방지)
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendPasswordReset() {
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (cooldown > 0 || sending) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: safeEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setResult('✅ 인증 코드를 보냈습니다. 메일함을 확인하세요.');
        setCooldown(60);
      } else {
        setResult(`❌ 오류: ${data.error || data.message || '실패했습니다.'}`);
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      setResult('❌ 서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  async function verifyResetCode() {
    const safeEmail = email.trim().toLowerCase();
    const code = resetCode.trim();
    if (!safeEmail || code.length !== 6) {
      alert('이메일과 6자리 인증 코드를 입력해주세요.');
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const response = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: safeEmail, resetCode: code }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setResult('✅ 인증이 완료되었습니다.');
        try {
          router.push(`/reset-password?email=${encodeURIComponent(safeEmail)}`);
        } catch (err) {
          console.error('Router navigation error:', err);
        }
      } else {
        setResult(`❌ 오류: ${data.error || data.message || '인증에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('Error verifying reset code:', error);
      setResult('❌ 서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  }

  return {
    email,
    setEmail,
    resetCode,
    setResetCode,
    sending,
    verifying,
    cooldown,
    result,
    sendPasswordReset,
    verifyResetCode,
  };
}
