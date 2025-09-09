'use client';

import { useRef, MouseEvent } from 'react';
import Image from 'next/image';
import type { Job } from './useJob';
import styles from '@/app/job/page.module.css';

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateX = -1 * ((y - height / 2) / (height / 2)) * 10;
    const rotateY = ((x - width / 2) / (width / 2)) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.cardGlow}></div>
      <Image
        src={`/assets/images/${job.image}`}
        alt={job.name}
        width={220}
        height={320}
        className={styles.cardImage}
        priority
      />
      <div className={styles.cardTitle}>{job.name}</div>
    </div>
  );
}
