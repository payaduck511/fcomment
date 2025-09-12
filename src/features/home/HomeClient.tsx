// /src/features/home/HomeClient.tsx

'use client';

import { useEffect } from 'react';
import CharacterSearch from '@/features/character/CharacterSearch';
import CommentList from '@/features/comments/CommentList';
import styles from '@/app/page.module.css';

export default function HomeClient() {
  // 우클릭 방지
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
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
            직업 채팅 · 시뮬레이터 · 실시간 댓글
          </p>
          <div className={styles.heroControls}>
            <div className={styles.searchWrap}>
              <CharacterSearch />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Comment Grid ---------- */}
      <section className={styles.grid}>
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2>실시간</h2>
            <span className={styles.cardHint}>최신 댓글</span>
          </header>
          <div className={styles.cardBody}>
            <CommentList mode="recent" />
          </div>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2>인기 댓글</h2>
            <span className={styles.cardHint}>좋아요 순</span>
          </header>
          <div className={styles.cardBody}>
            <CommentList mode="popular" />
          </div>
        </article>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className={styles.footer}>
        <p>
          discord:{' '}
          <a href="https://discord.gg/RBKEB8d9" target="_blank" rel="noreferrer">
            클릭
          </a>
        </p>
        <p>e-mail : payaduck@naver.com</p>
        <p>Data Based on NEXON OPEN API</p>
      </footer>
    </main>
  );
}