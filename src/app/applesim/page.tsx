// /src/app/applesim/page.tsx

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from '@/features/common/NavBar';
import styles from './page.module.css';
import { items, simulatePlatinumApple, isRare, SPIN_COST, Item } from '@/features/applesim/AppleSim';

export default function AppleSimPage() {
  const [totalSpent, setTotalSpent] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Item>({ name: '버튼을 눌러 시작하세요!', probability: 0, image: 'apple.png' });
  const [locked, setLocked] = useState(false);
  
  const sparkleTimerRef = useRef<number | null>(null);

  const onSpin = useCallback(() => {
    if (locked) return;

    const resItem = simulatePlatinumApple(items);
    setResult(resItem);
    setTotalSpent((v) => v + SPIN_COST);
    setSpinCount((v) => v + 1);
    setHistory((prev) => [resItem.name, ...prev]);
    setItemCounts((prev) => ({ ...prev, [resItem.name]: (prev[resItem.name] || 0) + 1 }));

    if (isRare(resItem.name)) {
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
      }
    };
  }, []);

  const sortedItemCounts = Object.entries(itemCounts).sort(([, countA], [, countB]) => countB - countA);
  const currentResultIsRare = result ? isRare(result.name) : false;

  return (
    <>
      <div className={styles.navBarWrapper}>
        <NavBar />
      </div>
      <main className={styles.page}>
        <div className={styles.simContainer}>
          
          <div className={styles.header}>
            <h1>플래티넘 애플 시뮬레이터</h1>
            <p>버튼을 눌러 플래티넘 애플을 돌리고, 무작위로 아이템을 획득하세요!</p>
          </div>

          <div className={styles.resultContainer}>
            <img 
                src={result.name === '버튼을 눌러 시작하세요!' ? `/assets/images/${result.image}` : `/assets/images/items/${result.image}`}
                alt={result.name}
                className={styles.resultImage}
            />
            <p
              id="result"
              className={`${styles.resultText} ${currentResultIsRare && locked ? styles.sparkleEffect : ''}`}
            >
              {result.name}
            </p>
          </div>

          <button
            id="spin-button"
            className={styles.spinButton}
            onClick={onSpin}
            disabled={locked}
          >
            플래티넘 애플 돌리기
          </button>

          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <h3>총 사용 금액</h3>
              <p><span>{totalSpent.toLocaleString('ko-KR')}</span> 원</p>
            </div>
            <div className={styles.infoBox}>
              <h3>클릭 횟수</h3>
              <p><span>{spinCount}</span> 번</p>
            </div>
          </div>

          <div className={styles.listsContainer}>
            <div className={styles.historyContainer}>
              <h2>최근 기록</h2>
              <ul className={styles.customList}>
                {history.slice(0, 10).map((h, i) => (
                  <li key={`${h}-${i}`} className={styles.listItem}>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.itemCountContainer}>
              <h2>아이템 획득 횟수</h2>
              <ul className={styles.customList}>
                {sortedItemCounts.map(([name, count]) => (
                  <li key={name} className={styles.listItem}>
                    <span className={styles.itemName}>{name}:</span>
                    <span className={styles.itemCount}>{count}번</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}