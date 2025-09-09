'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/features/common/NavBar';
import { useJobChat, formatKST } from '@/features/job-chat/useJobChat';
import styles from './page.module.css';

export default function JobChatPage() {
  // URL ?job=파라미터 읽기
  const searchParams = useSearchParams();
  const jobParam = searchParams.get('job');

  // 로직/데이터 훅 (features)
  const {
    resolvedJobName,
    jobDescription,
    comments,
    loading,
    input,
    charCount,
    maxLen,
    updateInput,
    postComment,
    toggleLike,
  } = useJobChat({ jobName: jobParam, backPath: '/job-chat' });

  // 우클릭 방지 (페이지 책임)
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);
    return () => document.removeEventListener('contextmenu', blockContextMenu);
  }, []);

  return (
    <>
      <NavBar />

      <main className={styles.page}>
        {/* 직업 정보 */}
        <section className={styles.jobInfo}>
          <h2 id="job-name">{resolvedJobName}</h2>
          <div className="job-details">
            <p>
              <strong>직업 설명:</strong>{' '}
              <span id="job-description">{jobDescription}</span>
            </p>
          </div>
        </section>

        {/* 채팅 */}
        <section className={styles.chatContainer}>
          <div className={styles.chatBox} id="chat-box">
            {loading ? (
              <p>불러오는 중...</p>
            ) : comments.length === 0 ? (
              <p>댓글이 없습니다.</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className={styles.message}>
                  <strong>{c.username}</strong>: {c.content}{' '}
                  <span className={styles.timestamp}>{formatKST(c.createdAt)}</span>
                  <button
                    className={styles.sendButton}
                    style={{ width: 'auto', marginLeft: 8 }}
                    onClick={() => toggleLike(c._id)}
                    aria-label={c.liked ? '추천 취소' : '추천'}
                  >
                    {c.liked ? '추천 취소' : '추천'} ({c.likes})
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.inputBox}>
            <input
              id="comment-input"
              type="text"
              placeholder={`댓글을 입력하세요 (최대 ${maxLen}자)`}
              value={input}
              onChange={(e) => updateInput(e.target.value)}
              className={styles.input}
              maxLength={maxLen}
            />
            <button id="send-button" onClick={postComment} className={styles.sendButton}>
              전송
            </button>
            <span id="char-count" className={styles.charCount}>
              {charCount}/{maxLen}
            </span>
          </div>
        </section>
      </main>
    </>
  );
}
