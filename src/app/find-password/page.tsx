'use client';

import NavBar from '@/features/common/NavBar';
import { useFindPassword } from '@/features/find-password/useFindPassword';
import styles from './page.module.css';

export default function FindPasswordPage() {
  const {
    email, setEmail,
    resetCode, setResetCode,
    sending, verifying, cooldown,
    result,
    sendPasswordReset, verifyResetCode,
  } = useFindPassword();

  return (
    <>
      <NavBar />

      <main className={styles.page}>
        <div className={styles.container}>
          <h2>비밀번호 찾기</h2>

          <input
            type="email"
            placeholder="이메일을 입력해 주세요."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />

          <button
            onClick={sendPasswordReset}
            disabled={sending || !email.trim() || cooldown > 0}
            className={styles.button}
          >
            {sending
              ? '메일 전송 중...'
              : cooldown > 0
              ? `재전송 대기 ${cooldown}s`
              : '인증 코드를 메일로 받기'}
          </button>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="메일로 받은 6자리 코드를 입력하세요."
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
            className={styles.input}
          />

          <button
            onClick={verifyResetCode}
            disabled={verifying || !email.trim() || resetCode.trim().length !== 6}
            className={styles.button}
          >
            {verifying ? '코드 확인 중...' : '코드 확인 후 비밀번호 재설정으로 이동'}
          </button>

          {result && <div className={styles.result}>{result}</div>}
        </div>
      </main>
    </>
  );
}
