import styles from './page.module.css';

export default function CoolHelpPage() {
  return (
    <main className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1>📸 메이플 사냥 도우미 도움말</h1>
        <p>이 도구는 메이플스토리의 쿨다운을 감지하고 알람을 울리는 기능을 제공합니다.</p>
      </header>

      {/* 사용 방법 섹션 */}
      <section id="usage" className={styles.section}>
        <h2 className={styles.title}>📌 사용 방법</h2>

        <div className={styles.step}>
          <h3 className={styles.stepTitle}>1️⃣ 해상도 확인하기</h3>
          <p>메이플스토리 설정에서 나의 해상도를 확인하세요.</p>
          <img src="/assets/images/hae.png" alt="해상도 확인" className={styles.guideImg} />
        </div>

        <div className={styles.step}>
          <h3 className={styles.stepTitle}>2️⃣ 해상도 설정하기</h3>
          <p>메이플스토리의 해상도 설정을 맞춰주세요.</p>
          <img src="/assets/images/ex1.png" alt="해상도 설정" className={styles.guideImg} />
        </div>

        <div className={styles.step}>
          <h3 className={styles.stepTitle}>3️⃣ 화면 공유하기</h3>
          <p>화면 공유 버튼을 누른 후 카테고리에서 &quot;창&quot;을 선택하여 메이플스토리를 선택하세요.</p>
          <img src="/assets/images/ex2.png" alt="화면 공유" className={styles.guideImg} />
        </div>

        <div className={styles.step}>
          <h3 className={styles.stepTitle}>4️⃣ 화면 자르기</h3>
          <p>1. 화면 자르기 버튼을 클릭하세요.</p>
          <img src="/assets/images/ex3.png" alt="화면 자르기" className={styles.guideImg} />

          <p>2. 야누스 왼쪽 위를 클릭하여 박스를 생성하세요.</p>
          <img src="/assets/images/skill.png" alt="야누스 설정" className={styles.guideImg} />

          <p>3. 설정 완료!</p>
          <img src="/assets/images/ex4.png" alt="완성된 설정" className={styles.guideImg} />
        </div>

        <div className={styles.step}>
          <h3 className={styles.stepTitle}>5️⃣ 화면 확정</h3>
          <p>✅ 화면 확정 버튼을 누르면 &quot;작동 = false&quot; 가 뜨면 정상 작동 중입니다.</p>
          <p>🔙 전 화면으로 돌아가려면 <b>Alt + ←</b> 키를 누르세요.</p>
          <img src="/assets/images/ex5.png" alt="쿨다운 감지" className={styles.guideImg} />
        </div>
      </section>

      {/* 푸터 */}
      <footer className={styles.footer}>
        <p>&copy; 2025 사냥 도우미 도움말</p>
      </footer>
    </main>
  );
}
