'use client';

import { useEffect, useState } from 'react';
import { api, ENDPOINTS } from '@/lib/api';
import type { CommentItem } from '@/types';

function formatKST(iso: string) {
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

  // "YYYY. MM. DD. HH:MM"
  const parts = f.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

function escapeHTML(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function CommentList({ mode }: { mode: 'recent' | 'popular' }) {
  const [items, setItems] = useState<CommentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = mode === 'recent' ? ENDPOINTS.recentComments : ENDPOINTS.popularComments;
        const data = await api<CommentItem[]>(path);
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'load error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (error) return <p>불러오는 중 오류가 발생했습니다. {error && `(${error})`}</p>;
  if (!items) return <p>로딩 중...</p>;
  if (items.length === 0) {
    return <p>{mode === 'recent' ? '최근 댓글이 없습니다.' : '인기 댓글이 없습니다.'}</p>;
  }

  return (
    <div>
      {items.map((c, idx) => {
        const formattedDate = formatKST(c.createdAt);
        const displayName =
          c.sourceType === 'job' ? `직업: ${c.displayName}` : c.displayName;
        const key = (c as any)?._id ?? (c as any)?.id ?? idx;

        return (
          <div key={key} className="comment-item">
            <p>
              <strong>{escapeHTML(c.nickname)}</strong> → ({escapeHTML(displayName)})
            </p>
            <p>{escapeHTML(c.content)}</p>
            <p className="comment-meta">
              {mode === 'popular' && typeof c.likes === 'number' ? `추천 수: ${c.likes} | ` : ''}
              {formattedDate}
            </p>
          </div>
        );
      })}
    </div>
  );
}
