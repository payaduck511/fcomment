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
    const API = (path: string) => path;
    const validateUsername = (v: unknown) =>
      typeof v === 'string' && v.trim().length >= 4;
    const validateNickname = (v: unknown) =>
      typeof v === 'string' && v.trim().length >= 2;
    const validatePassword = (v: unknown) =>
      typeof v === 'string' && v.trim().length >= 6;
    const validateEmail = (v: unknown) => /\S+@\S+\.\S+/.test(((v as string) || '').trim());

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
          // 실패 콜백
          (window as any).onUsernameChecked?.(false);
          return;
        }
        const res = await fetch(API('/api/check-username'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const data = await res.json().catch(() => ({} as any));
        if (res.ok) {
          alert(data?.message || '사용 가능한 아이디입니다.');
          // 성공 콜백
          (window as any).onUsernameChecked?.(true);
        } else {
          alert(data?.message || '이미 사용 중인 아이디입니다.');
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
        const res = await fetch(API('/api/check-nickname'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname }),
        });
        const data = await res.json().catch(() => ({} as any));
        if (res.ok) {
          alert(data?.message || '사용 가능한 닉네임입니다.');
          (window as any).onNicknameChecked?.(true);
        } else {
          alert(data?.message || '이미 사용 중인 닉네임입니다.');
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

        const res = await fetch(API('/api/send-verification-code'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({} as any));

        if (res.ok) {
          const sec = $('emailVerificationSection');
          if (sec) (sec as HTMLDivElement).style.display = 'block';
          alert(data?.message || '이메일로 인증코드를 전송했습니다.');
          // 전송 성공 알림 콜백 (UI에서 "코드 전송됨" 표시용)
          (window as any).onEmailCodeSent?.();
        } else {
          alert(data?.error || data?.message || '인증 코드 전송에 실패했습니다.');
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
      } catch (err) {
        console.error('Error sending verification code:', err);
        alert('인증 코드 전송 중 오류가 발생했습니다.');
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

        // 백엔드의 검증 엔드포인트 사용
        const res = await fetch(API('/api/verify-reset-code'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetCode: inputCode }),
        });
        const data = await res.json().catch(() => ({} as any));

        if (res.ok) {
          emailVerified = true;
          if (resultEl) {
            resultEl.textContent = '✅ 인증에 성공하셨습니다!';
            (resultEl as HTMLDivElement).style.color = 'green';
          }
          const registerBtn = $('registerButton') as HTMLButtonElement | null;
          if (registerBtn) registerBtn.disabled = false;
          // 성공 콜백
          (window as any).onEmailVerified?.(true);
        } else {
          emailVerified = false;
          if (resultEl) {
            resultEl.textContent = `❌ 인증에 실패하였습니다: ${data?.error || data?.message || ''}`;
            (resultEl as HTMLDivElement).style.color = 'red';
          }
          const registerBtn = $('registerButton') as HTMLButtonElement | null;
          if (registerBtn) registerBtn.disabled = true;
          (window as any).onEmailVerified?.(false);
        }
      } catch (err) {
        console.error('Error verifying code:', err);
        alert('인증 확인 중 오류가 발생했습니다.');
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

        const res = await fetch(API('/api/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, nickname, email }),
        });
        const data = await res.json().catch(() => ({} as any));

        if (res.ok) {
          alert('회원가입이 완료되었습니다!');
          window.location.href = '/';
        } else {
          alert(data?.error || data?.message || '회원가입에 실패했습니다.');
        }
      } catch (err) {
        console.error('Error registering user:', err);
        alert('회원가입 중 오류가 발생했습니다.');
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
