'use client';

import { useEffect, useState } from 'react';
import NavBar from '@/features/common/NavBar';
import SignupScript from '@/features/auth/SignupScript';
import styles from './page.module.css';

export default function SignupPage() {
  // 0:아이디 → 1:닉네임 → 2:비번 → 3:이메일 → 4:완료
  const [step, setStep] = useState(0);
  const [ok, setOk] = useState({ id: false, nick: false, pwd: false, email: false });

  // SignupScript가 성공 시 호출할(수 있는) 콜백만 연결
  useEffect(() => {
    (window as any).onUsernameChecked = (b: boolean) => setOk(s => ({ ...s, id: !!b }));
    (window as any).onNicknameChecked = (b: boolean) => setOk(s => ({ ...s, nick: !!b }));
    (window as any).onEmailVerified = (b: boolean) => setOk(s => ({ ...s, email: !!b }));
  }, []);

  // 최소 로컬검사: 비번 6자↑ & 일치
  const checkPwd = () => {
    const p = (document.getElementById('registerPassword') as HTMLInputElement)?.value || '';
    const p2 = (document.getElementById('confirmPassword') as HTMLInputElement)?.value || '';
    setOk(s => ({ ...s, pwd: p.length >= 6 && p === p2 }));
  };

  const canNext =
    (step === 0 && ok.id) ||
    (step === 1 && ok.nick) ||
    (step === 2 && ok.pwd) ||
    (step === 3 && ok.email) ||
    step === 4;

  return (
    <>
      <NavBar />
      <SignupScript />

      <main className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>회원가입</h2>

          {/* STEP 0: 아이디 */}
          <section style={{ display: step === 0 ? 'block' : 'none' }} className={styles.section}>
            <div className={styles.inputGroup}>
              <input id="registerUsername" placeholder="아이디 (4자 이상)" className={styles.input} />
              <button
                type="button"
                className={styles.checkButton}
                onClick={() => (window as any).checkUsername?.()}
              >
                중복체크
              </button>
            </div>
            <small className={ok.id ? styles.statusSuccess : styles.statusPending}>
              {ok.id ? '사용 가능한 아이디입니다.' : '아이디 중복체크가 필요합니다.'}
            </small>
          </section>

          {/* STEP 1: 닉네임 */}
          <section style={{ display: step === 1 ? 'block' : 'none' }} className={styles.section}>
            <div className={styles.inputGroup}>
              <input id="registerNickname" placeholder="닉네임 (2자 이상)" className={styles.input} />
              <button
                type="button"
                className={styles.checkButton}
                onClick={() => (window as any).checkNickname?.()}
              >
                중복체크
              </button>
            </div>
            <small className={ok.nick ? styles.statusSuccess : styles.statusPending}>
              {ok.nick ? '사용 가능한 닉네임입니다.' : '닉네임 중복체크가 필요합니다.'}
            </small>
          </section>

          {/* STEP 2: 비밀번호 */}
          <section style={{ display: step === 2 ? 'block' : 'none' }} className={styles.section}>
            <input id="registerPassword" type="password" placeholder="비밀번호 (6자 이상)" onInput={checkPwd} className={styles.input} />
            <input id="confirmPassword" type="password" placeholder="비밀번호 확인" onInput={checkPwd} className={styles.input} />
            <small className={ok.pwd ? styles.statusSuccess : styles.statusPending}>
              {ok.pwd ? '비밀번호가 일치합니다.' : '6자 이상, 동일한 비밀번호를 입력하세요.'}
            </small>
          </section>

          {/* STEP 3: 이메일 인증 */}
          <section style={{ display: step === 3 ? 'block' : 'none' }} className={styles.section}>
            <div className={styles.inputGroup}>
              <input id="registerEmail" type="email" placeholder="이메일" className={styles.input} />
              <button type="button" onClick={() => (window as any).sendVerificationCode?.()} className={styles.checkButton}>
                코드 전송
              </button>
            </div>
            <div className={styles.inputGroup}>
              <input id="verificationCode" placeholder="인증코드" className={styles.input} />
              <button type="button" onClick={() => (window as any).verifyCode?.()} className={styles.checkButton}>
                코드 확인
              </button>
            </div>
            <small className={ok.email ? styles.statusSuccess : styles.statusPending}>
              {ok.email ? '이메일 인증이 완료되었습니다.' : '이메일 인증이 필요합니다.'}
            </small>
          </section>

          {/* STEP 4: 완료 */}
          <section style={{ display: step === 4 ? 'block' : 'none' }} className={styles.section}>
            <p className={styles.completionText}>모든 단계를 완료했습니다. <br /> 아래 버튼을 눌러 회원가입을 최종 완료하세요.</p>
            <button id="registerButton" type="button" onClick={() => (window as any).register?.()} className={styles.submitButton}>
              회원가입 완료
            </button>
          </section>

          {/* 네비게이션 */}
          <div className={styles.navigation}>
            <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className={styles.prevButton}>이전</button>
            {step < 4 && (
              <button type="button" onClick={() => setStep(s => Math.min(4, s + 1))} disabled={!canNext} className={styles.navButton}>다음</button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}