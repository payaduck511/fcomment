'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type JobComment = {
  _id: string;
  username: string;
  content: string;
  createdAt: string; // ISO
  likes: number;
  liked?: boolean;
};

const API = {
  listByJob: (job: string) => `/api/job-comments/${encodeURIComponent(job)}`,
  post: '/api/job-comments',
  like: (id: string) => `/api/comments/${id}/like`,
};

const JOB_DESCRIPTIONS: Record<string, string> = {
  '히어로': '히어로는 강력한 물리 공격과 검술을 사용하는 전사입니다.',
  '아크메이지': '아크메이지는 강력한 원소 마법을 구사하는 마법사입니다.',
};

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

function getAuthToken() {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

function ensureLogin(redirectBack = '/job-chat') {
  const back = encodeURIComponent(redirectBack);
  window.location.href = `/login?redirect=${back}`;
}

type UseJobChatOptions = {
  /** 페이지에서 파싱한 직업명 (URL 쿼리/동적 세그먼트 등) */
  jobName: string | null;
  /** 로그인 만료/미인증 시 되돌아올 경로 (기본: /job-chat) */
  backPath?: string;
  /** 입력 글자수 제한 (기본: 30) */
  maxLen?: number;
};

export function useJobChat(opts: UseJobChatOptions) {
  const { jobName, backPath = '/job-chat', maxLen = 30 } = opts;

  const resolvedJobName = useMemo(
    () => jobName?.trim() || '직업 미지정',
    [jobName]
  );

  const jobDescription = useMemo(
    () => JOB_DESCRIPTIONS[resolvedJobName] || '이 직업에 대한 설명이 없습니다.',
    [resolvedJobName]
  );

  // 상태
  const [input, setInput] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);

  // 입력 제어 (최대 길이)
  const updateInput = useCallback(
    (val: string) => {
      const limit = Math.max(0, maxLen ?? 0);
      const next = val.slice(0, limit);
      setInput(next);
      setCharCount(next.length);
    },
    [maxLen]
  );

  // 댓글 목록 불러오기
  const loadComments = useCallback(async () => {
    if (!resolvedJobName || resolvedJobName === '직업 미지정') {
      setComments([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    try {
      const res = await fetch(API.listByJob(resolvedJobName));
      const data = (await res.json().catch(() => [])) as JobComment[];
      if (!cancelled) {
        if (res.ok && Array.isArray(data)) {
          setComments(data);
        } else {
          setComments([]);
        }
      }
    } catch (e) {
      console.error('Error loading comments:', e);
      if (!cancelled) setComments([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [resolvedJobName]);

  // 댓글 전송
  const postComment = useCallback(async () => {
    if (posting) return;
    const content = input.trim();
    if (!content) {
      alert('댓글을 입력해주세요.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      const redirect = `${backPath}?job=${encodeURIComponent(resolvedJobName)}`;
      ensureLogin(redirect);
      return;
    }

    setPosting(true);
    try {
      const res = await fetch(API.post, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job: resolvedJobName, content }),
      });

      if (res.ok) {
        updateInput(''); // 입력 초기화 + 글자수 0
        await loadComments(); // 목록 갱신
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`댓글 전송 실패: ${err.error || err.message || '잠시 후 다시 시도해주세요.'}`);
      }
    } catch (e) {
      console.error('Error posting comment:', e);
    } finally {
      setPosting(false);
    }
  }, [posting, input, resolvedJobName, backPath, loadComments, updateInput]);

  // 추천 토글
  const toggleLike = useCallback(
    async (commentId: string) => {
      if (likingId) return;
      const token = getAuthToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        const redirect = `${backPath}?job=${encodeURIComponent(resolvedJobName)}`;
        ensureLogin(redirect);
        return;
      }

      setLikingId(commentId);
      try {
        const res = await fetch(API.like(commentId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          await loadComments();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(`추천 처리 실패: ${err.error || err.message || '잠시 후 다시 시도해주세요.'}`);
        }
      } catch (e) {
        console.error('Error toggling like:', e);
      } finally {
        setLikingId(null);
      }
    },
    [likingId, backPath, resolvedJobName, loadComments]
  );
  
  useEffect(() => {
    let unbind: any;
    (async () => {
      unbind = await loadComments();
    })();
    return () => {
      if (typeof unbind === 'function') unbind();
    };
  }, [loadComments]);

  return {
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

    formatKST,
    reload: loadComments,

    posting,
    likingId,
  };
}
