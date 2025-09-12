// /src/features/bosring/BossRingSimClient.tsx

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import styles from '@/app/bossringsim/page.module.css';
import {
  BOXES,
  BoxId,
  RingLevel,
  RingRate,
  pickWeighted,
  rollLevel,
  isSpecialResult,
} from '@/features/bosring/bossRingData';

type Result = {
  ring: RingRate;
  level: RingLevel | null;
};

export default function BossRingSimClient() {
  const [selectedBoxId, setSelectedBoxId] = useState<BoxId | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [totalOpened, setTotalOpened] = useState(0);
  const [ringCounts, setRingCounts] = useState<Record<string, number>>({});
  const [locked, setLocked] = useState(false);
  const specialEffectTimerRef = useRef<number | null>(null);

  const selectedBox = useMemo(
    () => BOXES.find((box) => box.id === selectedBoxId),
    [selectedBoxId]
  );

  const handleOpenBox = () => {
    if (locked || !selectedBox) return;

    const chosenRing = pickWeighted(selectedBox.ringRates);
    const isGrindstone = chosenRing.key === 'life-grind';
    const chosenLevel = isGrindstone ? null : rollLevel(selectedBox.levelRates);
    const newResult = { ring: chosenRing, level: chosenLevel };

    setResult(newResult);
    setHistory((prev) => [newResult, ...prev].slice(0, 20));
    setTotalOpened((prev) => prev + 1);

    const resultName = newResult.level 
      ? `${newResult.ring.name} (Lv.${newResult.level})`
      : newResult.ring.name;

    setRingCounts((prev) => ({
      ...prev,
      [resultName]: (prev[resultName] || 0) + 1,
    }));

    if (isSpecialResult(newResult)) {
      setLocked(true);
      const timerId = window.setTimeout(() => {
        setLocked(false);
        specialEffectTimerRef.current = null;
      }, 3000);
      specialEffectTimerRef.current = timerId;
    }
  };

  useEffect(() => {
    return () => {
      if (specialEffectTimerRef.current) {
        clearTimeout(specialEffectTimerRef.current);
      }
    };
  }, []);
  
  const sortedRingCounts = Object.entries(ringCounts).sort(([, countA], [, countB]) => countB - countA);
  const currentResultIsSpecial = isSpecialResult(result);

  return (
    <main className={styles.page}>
      <div className={styles.simContainer}>
        <div className={styles.header}>
          <h1>보스 반지 상자 시뮬레이터</h1>
          <p>원하는 반지를 얻을 때까지 상자를 열어보세요!</p>
        </div>

        <div className={styles.boxSelectionContainer}>
          {BOXES.map((box) => (
            <div
              key={box.id}
              className={`${styles.boxCard} ${selectedBoxId === box.id ? styles.selectedBox : ''}`}
              onClick={() => setSelectedBoxId(box.id)}
            >
              <h3>{box.title}</h3>
              <p>{box.desc}</p>
              <img 
                  src={`/assets/images/box/${box.id}.png`} 
                  alt={box.title} 
                  className={styles.boxImage} 
              />
            </div>
          ))}
        </div>

        {selectedBox && (
          <div className={styles.resultArea}>
            <button 
              className={styles.openButton} 
              onClick={handleOpenBox}
              disabled={locked}
            >
              {selectedBox.title} 열기
            </button>

            {result && (
              <div className={`${styles.resultContainer} ${currentResultIsSpecial && locked ? styles.specialEffect : ''}`}>
                <img
                  src={`/assets/images/ring/${result.level ? `${result.ring.key}-${result.level}` : result.ring.key}.png`}
                  alt={result.ring.name}
                  className={styles.resultImage}
                />
                <p className={styles.resultName}>{result.ring.name}</p>
                {result.level && <p className={styles.resultLevel}>Lv. {result.level}</p>}
              </div>
            )}
          </div>
        )}
        
        <div className={styles.infoGrid}>
           <div className={styles.infoBox}>
              <h3>총 개봉 횟수</h3>
              <p><span>{totalOpened}</span> 개</p>
          </div>
        </div>
        
        <div className={styles.listsContainer}>
          <div className={styles.historyContainer}>
            <h2>최근 기록</h2>
            <ul className={styles.customList}>
              {history.map((item, i) => (
                <li key={i} className={styles.listItem}>
                  <span>{item.level ? `${item.ring.name} (Lv.${item.level})` : item.ring.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.itemCountContainer}>
            <h2>획득한 반지/아이템</h2>
            <ul className={styles.customList}>
              {sortedRingCounts.map(([name, count]) => (
                <li key={name} className={styles.listItem}>
                  <span className={styles.itemName}>{name}:</span>
                  <span className={styles.itemCount}>{count}개</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}