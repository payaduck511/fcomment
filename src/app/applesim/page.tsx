'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from '@/features/common/NavBar';
import styles from './page.module.css';
import { items, simulatePlatinumApple, isRare, SPIN_COST } from '@/features/applesim/AppleSim';

export default function AppleSimPage() {
  const [totalSpent, setTotalSpent] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [result, setResult] = useState('아직 돌리지 않았습니다.');
  const [locked, setLocked] = useState(false);

  // 반짝이 타이머 누수 방지
  const sparkleTimerRef = useRef<number | null>(null);

  const onSpin = useCallback(() => {
    if (locked) return;

    const r = simulatePlatinumApple(items);
    setResult(r);
    setTotalSpent((v) => v + SPIN_COST);
    setSpinCount((v) => v + 1);
    setHistory((prev) => [r, ...prev].slice(0, 5));
    setItemCounts((prev) => ({ ...prev, [r]: (prev[r] || 0) + 1 }));

    if (isRare(r)) {
      setLocked(true);
      const id = window.setTimeout(() => {
        setLocked(false);
        sparkleTimerRef.current = null;
      }, 2000);
      sparkleTimerRef.current = id;
    }
  }, [locked]);

  useEffect(() => {
    return () => {
      if (sparkleTimerRef.current) {
        clearTimeout(sparkleTimerRef.current);
        sparkleTimerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <NavBar />
      <div className={styles.page}>
        <img src="/assets/images/apple.png" alt="Apple Right" className={styles.logoRight} />
        <img src="/assets/images/apple.png" alt="Apple Left" className={styles.logoLeft} />

        <div className={styles.mainContainer}>
          <div className={styles.container}>
            <h1>플래티넘 애플 시뮬레이터</h1>
            <p>버튼을 눌러 플래티넘 애플을 돌리고, 무작위로 아이템을 획득하세요!</p>

            <div className={styles.fixedButtonContainer}>
              <button
                id="spin-button"
                className={styles.spinButton}
                onClick={onSpin}
                disabled={locked}
              >
                플래티넘 애플 돌리기
              </button>
            </div>

            <div className={styles.resultHistoryContainer}>
              <div id="result-container" className={styles.resultContainer}>
                <h2>결과</h2>
                <p
                  id="result"
                  className={`${styles.resultText} ${isRare(result) && locked ? styles.sparkleEffect : ''}`}
                >
                  {result}
                </p>
              </div>

              <div id="spent-container" className={styles.spentContainer}>
                <h3>
                  총 사용 금액:{' '}
                  <span id="spent-amount">{totalSpent.toLocaleString('ko-KR')}</span> 원
                </h3>
                <h3>
                  클릭 횟수: <span id="spin-count">{spinCount}</span> 번
                </h3>
              </div>

              <div id="history-container" className={styles.historyContainer}>
                <h2>기록</h2>
                <ul id="history-list" className={styles.historyList}>
                  {history.map((h, i) => (
                    <li key={`${h}-${i}`} className={styles.historyItem}>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.sidebarContainer}>
            <div id="item-count-container" className={styles.itemCountContainer}>
              <h2>아이템 횟수</h2>
              <ul id="item-count-list" className={styles.itemCountList}>
                {Object.entries(itemCounts).map(([name, count]) => (
                  <li key={name} className={styles.itemCountItem}>{`${name}: ${count}번`}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
