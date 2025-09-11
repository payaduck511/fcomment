'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

type LoginResponse =
  | { token?: string; authToken?: string }
  | { error?: string; message?: string };

const API_LOGIN = '/api/login';

export default function LoginPage() {
  const searchParams = useSearchParams();
const rawRedirect = useMemo(() => searchParams.get('redirect') || '/', [
  searchParams,
]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

function getSafeRedirect(): string {
  const to = (rawRedirect || '/').trim();
  try {
    const test = new URL(to, window.location.origin);
    if (test.origin !== window.location.origin) return '/';
    if (!to.startsWith('/')) return '/';
    return test.pathname + test.search + test.hash;
  } catch {
    return '/';
  }
}

  async function handleLogin() {
    if (!username.trim() || !password) {
      setErrorMsg('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setPending(true);
    setErrorMsg(null);

    try {
      const res = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json().catch(() => ({}))) as LoginResponse;

      if (!res.ok) {
        const msg =
          ('message' in data && data.message) ||
          ('error' in data && data.error) ||
          '로그인에 실패했습니다.';
        throw new Error(msg);
      }

      const token = (data as any).token ?? (data as any).authToken;
      if (!token) throw new Error('인증 토큰이 응답에 없습니다.');

      localStorage.setItem('authToken', token);
      window.location.href = getSafeRedirect();
    } catch (err: any) {
      setErrorMsg(err?.message || '로그인 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  }

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleLogin();
  }

function redirectToSignupPage() {
    window.location.href = '/signup';
  }

  function redirectToFindPassword() {
    window.location.href = '/find-password';
  }

  return (
    <main className={styles.page}>
      <div className={styles.loginCard}>
        <Image
          src="/assets/images/logo.png"
          alt="Paya Logo"
          width={80}
          height={80}
          className={styles.logo}
        />

        <h1 className={styles.title}>Paya 로그인</h1>

        <div className={styles.inputGroup}>
          {/* --- 아이디 입력창으로 수정 --- */}
          <input
            type="text"
            id="loginUsername"
            placeholder="ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleEnter}
            className={styles.input}
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            id="loginPassword"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleEnter}
            className={styles.input}
            autoComplete="current-password"
          />
        </div>

        <button
          id="loginSubmit"
          onClick={handleLogin}
          disabled={pending}
          className={styles.loginButton}
        >
          {pending ? '로그인 중...' : '로그인'}
        </button>

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <div className={styles.footerLinks}>
          <button onClick={redirectToFindPassword} className={styles.linkButton}>
            비밀번호 찾기
          </button>
          <span className={styles.separator}>|</span>
          <button onClick={redirectToSignupPage} className={styles.linkButton}>
            회원가입
          </button>
        </div>
      </div>
    </main>
  );
}