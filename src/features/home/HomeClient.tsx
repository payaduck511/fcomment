'use client';

import { useEffect } from 'react';
import CharacterSearch from '@/features/character/CharacterSearch';
import styles from '@/app/page.module.css';
import MiniGame from '@/features/minigame/MiniGame';
import MapleChat from '@/features/maple-chat/MapleChat';

export default function HomeClient() {
  useEffect(() => {
    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);
    return () => document.removeEventListener('contextmenu', blockContextMenu);
  }, []);

  return (
    <main className={styles.page}>
      {/* ---------- Hero Section ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.title}>MapleStory Comment</h1>
          <p className={styles.subtitle}>
            시뮬레이터 , 미니게임
          </p>
          <div className={styles.heroControls}>
            <div className={styles.searchWrap}>
              <CharacterSearch />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Main Interactive Section ---------- */}
      <section className={styles.mainContent}>
        <div className={styles.gamePanel}>
          <MiniGame />
        </div>
        <div className={styles.chatPanel}>
          <MapleChat />
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className={styles.footer}>
        <p>
          discord{' '}
          <a href="https://discord.gg/RBKEB8d9" target="_blank" rel="noreferrer">
            Join
          </a>
        </p>
        <p>e-mail : payaduck@naver.com</p>
        <p>Data Based on NEXON OPEN API</p>
      </footer>
    </main>
  );
}
