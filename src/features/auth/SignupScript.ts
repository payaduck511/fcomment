'use client';

import { useEffect } from 'react';

export default function SignupScript() {
  useEffect(() => {
    // ===== 우클릭 방지 =====
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);

    // ===== 내부 상태 =====
    let emailVerified = false;
    let isSendBtnCooling = false;

    // 동시 제출/연타 방지 플래그들
    let checkingUsername = false;
    let checkingNickname = false;
    let sendingCode = false;
    let verifyingCode = false;
    let registering = false;

    // 쿨타임 타이머 id (언마운트 시 정리)
    let cooldownTimerId: number | null = null;

    // ===== 유틸 =====
    const $ = (id: string) =>
      document.getElementById(id) as HTMLInputElement | HTMLDivElement | null;

    // ✅ BASE URL 지원: .env에 NEXT_PUBLIC_API_BASE_URL 넣으면 그걸 사용
    // 예) NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
    const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
    const API = (path: string) => `${API_BASE}${path}`;

    const validateUsername = (v: unknown) =>
      typeof v === 'string' && v.trim().length >= 4;
    const validateNickname = (v: unknown) =>
      typeof v === 'string' && v.trim().length >= 2;
    const validatePassword = (v: unknown) =>
      typeof v === 'string' && v.trim().length >= 6;
    const validateEmail = (v: unknown) => /\S+@\S+\.\S+/.test(((v as string) || '').trim());

    // ✅ fetch 타임아웃 유틸 (디폴트 15초)
    async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = 15000) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(input, { ...init, signal: controller.signal });
        return res;
      } finally {
        clearTimeout(t);
      }
    }

    // 초기엔 회원가입 버튼 비활성화
    const registerBtnInit = $('registerButton') as HTMLButtonElement | null;
    if (registerBtnInit) registerBtnInit.disabled = true;

    // ===== 아이디 중복 체크 =====
    async function checkUsername() {
      if (checkingUsername) return;
      checkingUsername = true;

      try {
        const username = (($('registerUsername') as HTMLInputElement)?.value || '').trim();
        if (!validateUsername(username)) {
          alert('아이디는 최소 4자 이상 입력해주세요.');
          (window as any).onUsernameChecked?.(false);
          return;
        }
        const res = await fetchWithTimeout(API('/api/check-username'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        if (res.ok) {
          alert(data?.message || '사용 가능한 아이디입니다.');
          (window as any).onUsernameChecked?.(true);
        } else {
          console.warn('check-username failed', res.status, text);
          alert(data?.message || `이미 사용 중인 아이디입니다. [${res.status}]`);
          (window as any).onUsernameChecked?.(false);
        }
      } catch (err) {
        console.error('Error checking username:', err);
        alert('아이디 확인 중 오류가 발생했습니다.');
        (window as any).onUsernameChecked?.(false);
      } finally {
        checkingUsername = false;
      }
    }

    // ===== 닉네임 중복 체크 =====
    async function checkNickname() {
      if (checkingNickname) return;
      checkingNickname = true;

      try {
        const nickname = (($('registerNickname') as HTMLInputElement)?.value || '').trim();
        if (!validateNickname(nickname)) {
          alert('닉네임은 최소 2자 이상 입력해주세요.');
          (window as any).onNicknameChecked?.(false);
          return;
        }
        const res = await fetchWithTimeout(API('/api/check-nickname'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname }),
        });
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        if (res.ok) {
          alert(data?.message || '사용 가능한 닉네임입니다.');
          (window as any).onNicknameChecked?.(true);
        } else {
          console.warn('check-nickname failed', res.status, text);
          alert(data?.message || `이미 사용 중인 닉네임입니다. [${res.status}]`);
          (window as any).onNicknameChecked?.(false);
        }
      } catch (err) {
        console.error('Error checking nickname:', err);
        alert('닉네임 확인 중 오류가 발생했습니다.');
        (window as any).onNicknameChecked?.(false);
      } finally {
        checkingNickname = false;
      }
    }

    // ===== 이메일 인증코드 전송 =====
    async function sendVerificationCode() {
      if (sendingCode || isSendBtnCooling) return;
      sendingCode = true;

      try {
        const raw = (($('registerEmail') as HTMLInputElement)?.value || '');
        const email = raw.trim().toLowerCase();
        const btn = $('sendCodeButton') as HTMLButtonElement | null;

        if (!validateEmail(email)) {
          alert('올바른 이메일을 입력해주세요.');
          return;
        }

        isSendBtnCooling = true;
        if (btn) {
          btn.disabled = true;
          btn.textContent = '코드 전송 중...';
        }

        const res = await fetchWithTimeout(API('/api/send-verification-code'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }, 15000); // 15초 타임아웃

        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}

        if (res.ok) {
          const sec = $('emailVerificationSection');
          if (sec) (sec as HTMLDivElement).style.display = 'block';
          alert(data?.message || '이메일로 인증코드를 전송했습니다.');
          (window as any).onEmailCodeSent?.();
        } else {
          console.warn('send-verification-code failed', res.status, text);
          alert(data?.error || data?.message || `인증 코드 전송에 실패했습니다. [${res.status}]`);
        }

        // 60초 쿨타임
        cooldownTimerId = window.setTimeout(() => {
          isSendBtnCooling = false;
          if (btn) {
            btn.disabled = false;
            btn.textContent = '메일로 코드 보내기';
          }
          cooldownTimerId = null;
        }, 60000);
      } catch (err: any) {
        console.error('Error sending verification code:', err);
        if (err?.name === 'AbortError') {
          alert('서버 응답이 지연되어 요청이 취소되었습니다. (타임아웃)');
        } else {
          alert('인증 코드 전송 중 오류가 발생했습니다.');
        }
        isSendBtnCooling = false; // 실패 시 즉시 재시도 가능
        const btn = $('sendCodeButton') as HTMLButtonElement | null;
        if (btn) {
          btn.disabled = false;
          btn.textContent = '메일로 코드 보내기';
        }
      } finally {
        sendingCode = false;
      }
    }

    // ===== 이메일 인증코드 검증 =====
    async function verifyCode() {
      if (verifyingCode) return;
      verifyingCode = true;

      try {
        const inputCode = (($('verificationCode') as HTMLInputElement)?.value || '').trim();
        const raw = (($('registerEmail') as HTMLInputElement)?.value || '');
        const email = raw.trim().toLowerCase();
        const resultEl = $('verificationResult') as HTMLDivElement | null;

        if (!validateEmail(email)) {
          alert('올바른 이메일을 입력해주세요.');
          (window as any).onEmailVerified?.(false);
          return;
        }
        if (!inputCode) {
          alert('인증코드를 입력해주세요.');
          (window as any).onEmailVerified?.(false);
          return;
        }

        // ❗ 현재 라우트 이름이 "verify-reset-code" 인데, 회원가입용 검증이면 백엔드와 통일 필요
        const res = await fetchWithTimeout(API('/api/verify-reset-code'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetCode: inputCode }),
        }, 15000);
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}

        if (res.ok) {
          emailVerified = true;
          if (resultEl) {
            resultEl.textContent = '✅ 인증에 성공하셨습니다!';
            (resultEl as HTMLDivElement).style.color = 'green';
          }
          const registerBtn = $('registerButton') as HTMLButtonElement | null;
          if (registerBtn) registerBtn.disabled = false;
          (window as any).onEmailVerified?.(true);
        } else {
          console.warn('verify-code failed', res.status, text);
          emailVerified = false;
          if (resultEl) {
            resultEl.textContent = `❌ 인증에 실패하였습니다: ${data?.error || data?.message || `[${res.status}]`}`;
            (resultEl as HTMLDivElement).style.color = 'red';
          }
          const registerBtn = $('registerButton') as HTMLButtonElement | null;
          if (registerBtn) registerBtn.disabled = true;
          (window as any).onEmailVerified?.(false);
        }
      } catch (err: any) {
        console.error('Error verifying code:', err);
        if (err?.name === 'AbortError') {
          alert('서버 응답이 지연되어 요청이 취소되었습니다. (타임아웃)');
        } else {
          alert('인증 확인 중 오류가 발생했습니다.');
        }
        (window as any).onEmailVerified?.(false);
      } finally {
        verifyingCode = false;
      }
    }

    // ===== 회원가입 =====
    async function register() {
      if (registering) return;
      registering = true;

      try {
        if (!emailVerified) {
          alert('이메일 인증 후 회원가입이 가능합니다.');
          return;
        }

        const username = (($('registerUsername') as HTMLInputElement)?.value || '').trim();
        const password = (($('registerPassword') as HTMLInputElement)?.value || '').trim();
        const confirmPassword = (($('confirmPassword') as HTMLInputElement)?.value || '').trim();
        const nickname = (($('registerNickname') as HTMLInputElement)?.value || '').trim();
        const rawEmail = (($('registerEmail') as HTMLInputElement)?.value || '');
        const email = rawEmail.trim().toLowerCase();

        if (!validateUsername(username)) {
          alert('아이디는 최소 4자 이상 입력해주세요.');
          return;
        }
        if (!validateNickname(nickname)) {
          alert('닉네임은 최소 2자 이상 입력해주세요.');
          return;
        }
        if (!validatePassword(password)) {
          alert('비밀번호는 최소 6자 이상이어야 합니다.');
          return;
        }
        if (password !== confirmPassword) {
          alert('비밀번호가 일치하지 않습니다.');
          return;
        }
        if (!validateEmail(email)) {
          alert('올바른 이메일을 입력해주세요.');
          return;
        }

        const res = await fetchWithTimeout(API('/api/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, nickname, email }),
        }, 15000);
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}

        if (res.ok) {
          alert('회원가입이 완료되었습니다!');
          window.location.href = '/';
        } else {
          console.warn('register failed', res.status, text);
          alert(data?.error || data?.message || `회원가입에 실패했습니다. [${res.status}]`);
        }
      } catch (err: any) {
        console.error('Error registering user:', err);
        if (err?.name === 'AbortError') {
          alert('서버 응답이 지연되어 요청이 취소되었습니다. (타임아웃)');
        } else {
          alert('회원가입 중 오류가 발생했습니다.');
        }
      } finally {
        registering = false;
      }
    }

    (window as any).checkUsername = checkUsername;
    (window as any).checkNickname = checkNickname;
    (window as any).sendVerificationCode = sendVerificationCode;
    (window as any).verifyCode = verifyCode;
    (window as any).register = register;

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      if (cooldownTimerId) {
        clearTimeout(cooldownTimerId);
        cooldownTimerId = null;
      }
      delete (window as any).checkUsername;
      delete (window as any).checkNickname;
      delete (window as any).sendVerificationCode;
      delete (window as any).verifyCode;
      delete (window as any).register;
    };
  }, []);

  return null;
}
