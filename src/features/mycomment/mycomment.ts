'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type MyComment = {
  _id: string;
  content: string;
  createdAt: string;
};

const API = {
  myComments: '/api/my-comments',
  deleteComment: (id: string) => `/api/comments/${id}`,
};

/** KST 포맷 */
export function formatKST(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const f = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
  const parts = f.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

/** 로그인 페이지로 이동 */
function redirectToLogin(withBack: string = '/mycomment') {
  const back = encodeURIComponent(withBack);
  window.location.href = `/login?redirect=${back}`;
}

export function useMyComments() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasComments = useMemo(() => comments.length > 0, [comments]);

  // 최초 토큰 로드
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      setAuthToken(token);
    } catch {
      setAuthToken(null);
    }
  }, []);

  // 내 댓글 조회
  const fetchMyComments = useCallback(async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    try {
      const res = await fetch(API.myComments, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('authToken');
        redirectToLogin('/mycomment');
        return;
      }

      const data = (await res.json().catch(() => [])) as MyComment[];
      if (!cancelled) {
        if (res.ok && Array.isArray(data)) {
          setComments(data);
        } else {
          setComments([]);
        }
      }
    } catch (e) {
      if (!cancelled) {
        console.error('Error fetching comments:', e);
        alert('댓글을 불러오는 중 오류가 발생했습니다.');
        setComments([]);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [authToken]);

  // 초기 진입 시 인증 확인 + 로드
  useEffect(() => {
    if (authToken === null) return;

    if (!authToken) {
      alert('로그인 후 이용할 수 있습니다.');
      redirectToLogin('/mycomment');
      return;
    }

    let unbind: undefined | (() => void);
    (async () => {
      unbind = await fetchMyComments();
    })();
    return () => {
      if (typeof unbind === 'function') unbind();
    };
  }, [authToken, fetchMyComments]);

  // 댓글 삭제
  const deleteComment = useCallback(
    async (commentId: string) => {
      if (deletingId) return; // 중복 클릭 방지
      if (!authToken) {
        alert('댓글을 삭제하려면 로그인해야 합니다.');
        redirectToLogin('/mycomment');
        return;
      }
      if (!commentId) return;
      if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

      setDeletingId(commentId);
      try {
        const res = await fetch(API.deleteComment(commentId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.status === 401 || res.status === 403) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('authToken');
          redirectToLogin('/mycomment');
          return;
        }

        if (res.ok) {
          setComments((prev) => prev.filter((c) => c._id !== commentId));
        } else {
          const err = await res.json().catch(() => ({} as any));
          alert(`댓글 삭제 실패: ${err.error || err.message || '잠시 후 다시 시도해주세요.'}`);
          fetchMyComments();
        }
      } catch (e) {
        console.error('Error deleting comment:', e);
        alert('댓글 삭제 중 오류가 발생했습니다.');
      } finally {
        setDeletingId(null);
      }
    },
    [authToken, deletingId, fetchMyComments]
  );

  return {
    comments,
    loading,
    hasComments,
    deletingId,
    fetchMyComments,
    deleteComment,
  };
}
