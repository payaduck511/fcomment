// src/app/charinfo/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/features/common/NavBar';
import styles from './page.module.css';

export default function CharInfoPage() {
  const searchParams = useSearchParams();

  const rawName =
    searchParams.get('name') ??
    searchParams.get('characterName') ??
    '';

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('@/features/charinfo/usecharinfo');
        const init = (mod as any)?.init;

        if (typeof window !== 'undefined' && rawName) {
          const url = new URL(window.location.href);
          if (!url.searchParams.get('characterName')) {
            url.searchParams.set('characterName', rawName);
            window.history.replaceState(null, '', url.toString());
          }
        }

        if (typeof init === 'function') {
          try {
            init(rawName);
          } catch {
            init();
          }
        }
      } catch (e) {
        console.error('[charinfo] init load error:', e);
      }
    })();
  }, [rawName]);

  return (
    <>
      <NavBar />

      <div className={styles.container}>
        <h1 className={styles.title}>캐릭터 정보</h1>

        {/* 캐릭터 기본 정보 */}
        <div className={styles.characterInfo}>
          <img id="character-image" src="" alt="캐릭터 이미지" />
          <h2 id="character-name">캐릭터 이름</h2>
          <p id="character-level">
            레벨: <span />
          </p>
          <p id="character-job">
            직업: <span />
          </p>
          <p id="character-server">
            서버: <span />
          </p>
        </div>

        {/* 프리셋 선택 버튼 */}
        <div className={styles.presetButtons}>
          <button id="preset-1">프리셋 1</button>
          <button id="preset-2">프리셋 2</button>
          <button id="preset-3">프리셋 3</button>
        </div>

        {/* 장비 정보 */}
        <div className={styles.equipmentInfo}>
          <h2>장비</h2>
          <div className={styles.equipmentGrid} id="equipment-list">
            <div className={styles.equipmentItem} id="ring-4" data-slot="ring-4" />
            <div className={`${styles.equipmentItem} ${styles.empty}`} id="empty-slot-1" />
            <div className={styles.equipmentItem} id="hat" data-slot="hat" />
            <div className={`${styles.equipmentItem} ${styles.empty}`} id="empty-slot-2" />
            <div className={styles.equipmentItem} id="emblem" data-slot="emblem" />

            <div className={styles.equipmentItem} id="ring-3" data-slot="ring-3" />
            <div className={styles.equipmentItem} id="pendant-2" data-slot="pendant-2" />
            <div className={styles.equipmentItem} id="face-accessory" data-slot="face-accessory" />
            <div className={`${styles.equipmentItem} ${styles.empty}`} id="empty-slot-3" />
            <div className={styles.equipmentItem} id="badge" data-slot="badge" />

            <div className={styles.equipmentItem} id="ring-2" data-slot="ring-2" />
            <div className={styles.equipmentItem} id="pendant-1" data-slot="pendant-1" />
            <div className={styles.equipmentItem} id="eye-accessory" data-slot="eye-accessory" />
            <div className={styles.equipmentItem} id="earring" data-slot="earring" />
            <div className={styles.equipmentItem} id="medal" data-slot="medal" />

            <div className={styles.equipmentItem} id="ring-1" data-slot="ring-1" />
            <div className={styles.equipmentItem} id="weapon" data-slot="weapon" />
            <div className={styles.equipmentItem} id="top" data-slot="top" />
            <div className={styles.equipmentItem} id="shoulder" data-slot="shoulder" />
            <div className={styles.equipmentItem} id="secondary-weapon" data-slot="secondary-weapon" />

            <div className={styles.equipmentItem} id="pocket-item" data-slot="pocket-item" />
            <div className={styles.equipmentItem} id="belt" data-slot="belt" />
            <div className={styles.equipmentItem} id="bottom" data-slot="bottom" />
            <div className={styles.equipmentItem} id="gloves" data-slot="gloves" />
            <div className={styles.equipmentItem} id="cloak" data-slot="cloak" />

            <div className={`${styles.equipmentItem} ${styles.empty}`} id="empty-slot-4" />
            <div className={`${styles.equipmentItem} ${styles.empty}`} id="empty-slot-5" />
            <div className={styles.equipmentItem} id="shoes" data-slot="shoes" />
            <div className={`${styles.equipmentItem} ${styles.empty}`} id="empty-slot-6" />
            <div className={styles.equipmentItem} id="mechanical-heart" data-slot="mechanical-heart" />
          </div>
        </div>

        {/* 캐시아이템 */}
        <div className={styles.cashEquipmentInfo}>
          <h2>캐시아이템</h2>
          <div className={styles.cashGrid} id="cash-equipment-list" />
        </div>

        {/* 툴팁 */}
        <div id="tooltip" className={styles.tooltip} style={{ display: 'none' }} />
      </div>
    </>
  );
}
