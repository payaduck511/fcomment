'use client';

import { useEffect } from 'react';
import NavBar from '@/features/common/NavBar';
import { useMyComments, formatKST } from '@/features/mycomment/mycomment';
import styles from './page.module.css';

export default function MyCommentPage() {
  const { comments, loading, hasComments, deletingId, deleteComment } = useMyComments();

  return (
    <>
      <NavBar />
      <div className={styles.page}>
        <div className={styles.myCommentsContainer}>
          <h2>내가 쓴 댓글</h2>

          {loading ? (
            <p>불러오는 중...</p>
          ) : !hasComments ? (
            <p>작성한 댓글이 없습니다.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className={styles.commentItem}>
                <p>{c.content}</p>
                <span className={styles.timestamp}>{formatKST(c.createdAt)}</span>
                <button
                  className={styles.deleteButton ?? undefined}
                  disabled={deletingId === c._id}
                  onClick={() => deleteComment(c._id)}
                >
                  {deletingId === c._id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
