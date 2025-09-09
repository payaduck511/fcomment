// src/features/chat/useCharacterChat.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type CommentDoc = {
  _id: string;
  content: string;
  createdAt: string;       // ISO
  likes: number;
  liked?: boolean;
  username?: string;
  nickname?: string;
};

export type CharacterInfo = {
  ocid: string;
  character_name: string;
  character_image: string;
  character_class: string;
  character_level: number;
  character_guild_name?: string;
};

type ApiError = { error?: string; message?: string; timeLeft?: number };

const API = {
  userInfo: '/api/user-info',
  character: (name: string) => `/api/character/${encodeURIComponent(name)}`,
  comments: (ocid: string) => `/api/comments/${ocid}`,
  postComment: '/api/comments',
  likeComment: (id: string) => `/api/comments/${id}/like`,
  reportComment: '/api/reports',
} as const;

function buildLoginRedirect(to?: string) {
  const target = (to ?? (typeof window !== 'undefined' ? window.location.href : '/')).trim();
  try {
    if (typeof window === 'undefined') return '/login';
    const u = new URL(target, window.location.origin);
    if (u.origin !== window.location.origin) return '/login';
    const safePath = u.pathname + u.search + u.hash;
    return `/login?redirect=${encodeURIComponent(safePath)}`;
  } catch {
    return '/login';
  }
}

/** 간단한 KST 표기 */
export function formatKST(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export function useCharacterChat(initialCharacterName?: string) {
  // ===== Auth / 기본 =====
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthed, setIsAuthed]   = useState(false);

  // ===== 캐릭터 =====
  const [characterName, setCharacterName] = useState(initialCharacterName ?? '');
  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [charLoading, setCharLoading] = useState(false);

  // ===== 댓글 =====
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // 입력 & 카운트
  const [inputValue, setInputValue] = useState('');
  const charCount = useMemo(() => Math.min(inputValue.length, 30), [inputValue]);

  // 전송 쿨다운 버튼 텍스트 상태
  const [sendingCooldown, setSendingCooldown] = useState<number | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ===== 초기 Auth 세팅 =====
  useEffect(() => {
    const tok = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setAuthToken(tok);
  }, []);

  // 유저 정보 확인
  const fetchUserInfo = useCallback(async () => {
    if (!authToken) {
      setIsAuthed(false);
      return;
    }
    try {
      const res = await fetch(API.userInfo, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('unauthorized');
      setIsAuthed(true);
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthed(false);
    }
  }, [authToken]);

  // ===== 캐릭터 정보 조회 =====
  const fetchCharacterInfo = useCallback(
    async (name: string) => {
      if (!name) return;
      setCharLoading(true);
      try {
        const res = await fetch(API.character(name));
        if (!res.ok) throw new Error('캐릭터 정보를 불러오지 못했습니다.');
        const data = (await res.json()) as CharacterInfo;
        setCharacter(data);
      } finally {
        setCharLoading(false);
      }
    },
    []
  );

  // ===== 댓글 목록 조회 =====
  const loadComments = useCallback(async () => {
    if (!character?.ocid) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(API.comments(character.ocid), {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const arr = (await res.json()) as CommentDoc[];
      setComments(Array.isArray(arr) ? arr : []);
    } finally {
      setCommentsLoading(false);
    }
  }, [character?.ocid, authToken]);

  // ===== 댓글 전송 =====
  const postComment = useCallback(async () => {
    if (!authToken) {
      if (typeof window !== 'undefined') {
        window.location.href = buildLoginRedirect();
      }
      return;
    }
    if (!character?.ocid) {
      alert('캐릭터 ID가 아직 로드되지 않았습니다.');
      return;
    }
    const content = inputValue.trim();
    if (!content) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(API.postComment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ character_id: character.ocid, content }),
      });

      if (res.ok) {
        setInputValue('');
        await loadComments();
      } else {
        const err = (await res.json().catch(() => ({}))) as ApiError;
        if (res.status === 429 && err.timeLeft) {
          // 쿨타임 표시
          const start = parseInt(String(err.timeLeft), 10);
          if (!Number.isNaN(start)) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            setSendingCooldown(start);
            cooldownTimerRef.current = setInterval(() => {
              setSendingCooldown((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                  if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
                  return null;
                }
                return prev - 1;
              });
            }, 1000);
          }
        } else {
          alert(`댓글 등록 실패: ${err.error || res.statusText || '잠시 후 다시 시도해주세요.'}`);
        }
      }
    } catch (e) {
      console.error('Error posting comment:', e);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  }, [authToken, character?.ocid, inputValue, loadComments]);

  // ===== 추천 토글 =====
  const toggleLike = useCallback(
    async (commentId: string) => {
      if (!authToken) {
        if (typeof window !== 'undefined') {
          window.location.href = buildLoginRedirect();
        }
        return;
      }
      try {
        const res = await fetch(API.likeComment(commentId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = (await res.json().catch(() => ({}))) as ApiError | Record<string, unknown>;
        if (!res.ok) {
          alert(`추천 처리 실패: ${(data as ApiError).error || res.statusText}`);
          return;
        }
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  liked: !c.liked,
                  likes: c.likes + (c.liked ? -1 : 1),
                }
              : c
          )
        );
      } catch (e) {
        console.error('Error liking comment:', e);
        alert('추천 처리 중 오류가 발생했습니다.');
      }
    },
    [authToken]
  );

  // ===== 신고 =====
  const reportComment = useCallback(
    async (commentId: string, reason: string) => {
      if (!reason) {
        alert('신고 사유가 필요합니다.');
        return;
      }
      try {
        const res = await fetch(API.reportComment, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken || ''}`,
          },
          body: JSON.stringify({ commentId, reason }),
        });
        const data = (await res.json().catch(() => ({}))) as ApiError;
        if (res.ok) {
          alert(data.message || '신고가 접수되었습니다.');
        } else {
          alert(`신고 접수 중 오류가 발생했습니다: ${data.message || res.statusText}`);
        }
      } catch (e) {
        console.error('Error reporting comment:', e);
        alert('서버에 문제가 발생했습니다.');
      }
    },
    [authToken]
  );

  // ===== 길이 제한 =====
  const setInputWithLimit = useCallback((v: string) => {
    if (v.length <= 30) setInputValue(v);
    else setInputValue(v.slice(0, 30));
  }, []);

  // ===== 로그인/로그아웃 도우미 =====
  const redirectToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = buildLoginRedirect();
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthed(false);
      window.location.href = '/';
    }
  }, []);

  // ===== 초기 로드 시퀀스 =====
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    if (initialCharacterName && !characterName) {
      setCharacterName(initialCharacterName);
    }
  }, [initialCharacterName, characterName]);

  useEffect(() => {
    if (characterName) {
      (async () => {
        await fetchCharacterInfo(characterName);
      })();
    }
  }, [characterName, fetchCharacterInfo]);

  useEffect(() => {
    if (character?.ocid) {
      loadComments();
    }
  }, [character?.ocid, loadComments]);

  // unmount 시 타이머 정리
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  return {
    // 상태
    isAuthed,
    characterName,
    setCharacterName,
    character,
    charLoading,

    comments,
    commentsLoading,

    inputValue,
    setInputWithLimit,
    charCount,
    sendingCooldown,

    // 액션
    fetchUserInfo,
    fetchCharacterInfo,
    loadComments,
    postComment,
    toggleLike,
    reportComment,

    redirectToLogin,
    logout,
  };
}
