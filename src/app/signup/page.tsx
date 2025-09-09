// src/app/signup/page.tsx
'use client';

import NavBar from '@/features/common/NavBar';
import SignupScript from '@/features/auth/SignupScript';
import styles from './page.module.css';

export default function SignupPage() {
  return (
    <>
      <NavBar />
      <SignupScript />

      <main className={styles.page}>
        <div className={styles.container}>
          <h2>이메일 인증 회원가입</h2>

          <input type="text" id="registerUsername" placeholder="아이디 (4자 이상)" />
          <button
            type="button"
            className={styles.checkButton}
            onClick={() => (window as any).checkUsername?.()}
          >
            아이디 중복체크
          </button>

          <input type="text" id="registerNickname" placeholder="닉네임 (2자 이상)" />
          <button
            type="button"
            className={styles.checkButton}
            onClick={() => (window as any).checkNickname?.()}
          >
            닉네임 중복체크
          </button>

          <input type="password" id="registerPassword" placeholder="비밀번호 (6자 이상)" />
          <input type="password" id="confirmPassword" placeholder="비밀번호 확인" />

          <input type="email" id="registerEmail" placeholder="이메일" />
          <button
            type="button"
            id="sendCodeButton"
            onClick={() => (window as any).sendVerificationCode?.()}
          >
            메일로 코드 보내기
          </button>

          <div id="emailVerificationSection" style={{ display: 'none' }}>
            <input type="text" id="verificationCode" placeholder="인증코드를 입력해주세요." />
            <button type="button" onClick={() => (window as any).verifyCode?.()}>
              확인
            </button>
            <div id="verificationResult" />
          </div>

          <button
            type="button"
            id="registerButton"
            onClick={() => (window as any).register?.()}
          >
            회원가입
          </button>
        </div>
      </main>
    </>
  );
}
