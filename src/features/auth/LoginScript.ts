'use client';

import { useEffect } from 'react';

export default function LoginScript() {
  useEffect(() => {
    // ===== 우클릭 방지 =====
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);

    // ===== 설정 =====
    const API_LOGIN = '/api/login';

    function getSafeRedirect() {
      const urlParams = new URLSearchParams(window.location.search);
      const to = (urlParams.get('redirect') || '/index.html').trim();

      try {
        const test = new URL(to, window.location.origin);
        if (test.origin !== window.location.origin) throw new Error('bad origin');
      } catch {
        return '/index.html';
      }

      // 내부 경로만 허용
      if (!to.startsWith('/')) return '/index.html';
      return to;
    }

    // 중복 제출 방지 플래그
    let submitting = false;

    async function login() {
      if (submitting) return;

      const usernameEl = document.getElementById('loginUsername') as HTMLInputElement | null;
      const passwordEl = document.getElementById('loginPassword') as HTMLInputElement | null;
      const btn =
        (document.getElementById('loginSubmit') as HTMLButtonElement | null) ||
        (document.querySelector('button') as HTMLButtonElement | null);

      const username = (usernameEl?.value || '').trim();
      const password = (passwordEl?.value || '').trim();

      if (!username || !password) {
        alert('아이디와 비밀번호를 모두 입력해주세요.');
        return;
      }

      // 버튼 잠금(중복제출 방지)
      submitting = true;
      const prevText = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        btn.textContent = '로그인 중...';
      }

      try {
        const response = await fetch(API_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json().catch(() => ({} as any));

        if (response.ok && (data?.token || data?.authToken)) {
          const token = data.token ?? data.authToken;
          localStorage.setItem('authToken', token);
          window.location.href = getSafeRedirect();
        } else {
          const msg =
            data?.error ||
            data?.message ||
            (response.status === 401
              ? '아이디 또는 비밀번호가 올바르지 않습니다.'
              : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
          alert(msg);
        }
      } catch (err) {
        console.error('Error logging in:', err);
        alert('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      } finally {
        submitting = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = prevText ?? '로그인';
        }
      }
    }

    function redirectToSignupPage() {
      window.location.href = '/signup.html';
    }

    function redirectToFindPassword() {
      window.location.href = '/find-password.html';
    }

    function bind() {
      // 엔터로 제출
      const userEl = document.getElementById('loginUsername');
      const passEl = document.getElementById('loginPassword');
      const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') login();
      };
      userEl?.addEventListener('keydown', onKeydown);
      passEl?.addEventListener('keydown', onKeydown);

      // 버튼 클릭
      const btn =
        (document.getElementById('loginSubmit') as HTMLButtonElement | null) ||
        (document.querySelector('button') as HTMLButtonElement | null);
      const onClick = () => login();
      btn?.addEventListener('click', onClick);

      // 사이드 버튼
      const signupBtn = document.querySelector('.button-group .side-button:nth-child(1)');
      const findPwBtn = document.querySelector('.button-group .side-button:nth-child(2)');
      const onSignup = () => redirectToSignupPage();
      const onFindPw = () => redirectToFindPassword();
      signupBtn?.addEventListener('click', onSignup);
      findPwBtn?.addEventListener('click', onFindPw);

      // 클린업 함수 반환
      return () => {
        userEl?.removeEventListener('keydown', onKeydown);
        passEl?.removeEventListener('keydown', onKeydown);
        btn?.removeEventListener('click', onClick);
        signupBtn?.removeEventListener('click', onSignup);
        findPwBtn?.removeEventListener('click', onFindPw);
      };
    }

    const cleanupEvents = bind();
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      if (cleanupEvents) cleanupEvents();
    };
  }, []);

  return null;
}
