'use client';

import { useEffect } from 'react';
import NavBar from '@/features/common/NavBar';
import JobCard from '@/features/job/JobCard';
import { useJob } from '@/features/job/useJob';
import type { JobCategory } from '@/features/job/useJob';
import styles from './page.module.css';

const CATEGORIES: JobCategory[] = [
  {
    title: '전사',
    jobs: [
      { name: '히어로', image: 'herocard.png' },
      { name: '팔라딘', image: 'paladincard.png' },
      { name: '다크나이트', image: 'darknightcard.png' },
      { name: '소울마스터', image: 'soulcard.png' },
      { name: '미하일', image: 'mihilecard.png' },
      { name: '블래스터', image: 'blastercard.png' },
      { name: '데몬슬레이어', image: 'demonslayercard.png' },
      { name: '데몬어벤져', image: 'demonavencard.png' },
      { name: '아란', image: 'arancard.png' },
      { name: '카이저', image: 'kyzercard.png' },
      { name: '아델', image: 'adelcard.png' },
      { name: '제로', image: 'zerocard.png' },
      { name: '렌', image: 'rencard.png' },
    ],
  },
  {
    title: '마법사',
    jobs: [
      { name: '아크메이지(불,독)', image: 'firecard.png' },
      { name: '아크메이지(썬,콜)', image: 'icecard.png' },
      { name: '비숍', image: 'vishopcard.png' },
      { name: '플레임위자드', image: 'flamecard.png' },
      { name: '배틀메이지', image: 'battlemagecard.png' },
      { name: '에반', image: 'evancard.png' },
      { name: '루미너스', image: 'lumicard.png' },
      { name: '일리움', image: 'iliumcard.png' },
      { name: '라라', image: 'laracard.png' },
      { name: '키네시스', image: 'kinesiscard.png' },
    ],
  },
  {
    title: '궁수',
    jobs: [
      { name: '보우마스터', image: 'bowmastercard.png' },
      { name: '신궁', image: 'shincard.png' },
      { name: '패스파인더', image: 'passcard.png' },
      { name: '윈드브레이커', image: 'windbreakercard.png' },
      { name: '와일드헌터', image: 'wildhuntercard.png' },
      { name: '메르세데스', image: 'mercedescard.png' },
      { name: '카인', image: 'kaincard.png' },
    ],
  },
  {
    title: '도적',
    jobs: [
      { name: '나이트로드', image: 'nightlordcard.png' },
      { name: '섀도어', image: 'shadowcard.png' },
      { name: '듀얼블레이드', image: 'dualbladecard.png' },
      { name: '나이트워커', image: 'nightcard.png' },
      { name: '팬텀', image: 'pentomcard.png' },
      { name: '카데나', image: 'cadenacard.png' },
      { name: '칼리', image: 'khalicard.png' },
      { name: '호영', image: 'hoyoungcard.png' },
    ],
  },
  {
    title: '해적',
    jobs: [
      { name: '바이퍼', image: 'vipercard.png' },
      { name: '캡틴', image: 'captaincard.png' },
      { name: '캐논슈터', image: 'cannonshootercard.png' },
      { name: '스트라이커', image: 'strikercard.png' },
      { name: '메카닉', image: 'mechaniccard.png' },
      { name: '은월', image: 'eunwolcard.png' },
      { name: '엔젤릭버스터', image: 'angelicbustercard.png' },
      { name: '아크', image: 'arkcard.png' },
    ],
  },
];

export default function JobPage() {
  const { query, setQuery, filtered, goToJobChat } = useJob(CATEGORIES);

  useEffect(() => {
    const block = (e: globalThis.MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, []);

  return (
    <>
      <NavBar />
      <main className={styles.page}>
        <div className={styles.hero}>
          <h1 className={styles.title}>직업 선택</h1>
        <p className={styles.subtitle}>원하는 직업의 카드를 클릭하여 채팅방에 입장하세요.</p>
          <div className={styles.searchBar}>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="직업 이름으로 검색..."
            />
          </div>
        </div>

        <div className={styles.container}>
          {filtered.map((cat) => (
            <section key={cat.title} className={styles.category}>
              <h2 className={styles.categoryTitle}>{cat.title}</h2>
              <div className={styles.jobGrid}>
                {cat.jobs.map((job) => (
                  <JobCard
                    key={job.name}
                    job={job}
                    onClick={() => goToJobChat(job.name)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
