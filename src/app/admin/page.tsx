'use client';

import { useEffect } from 'react';
import AdminScript from '@/features/admin/AdminScript';

export default function AdminPage() {
  useEffect(() => {
    const href = '/assets/css/admin.css';
    const already = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
      .some((l) => (l as HTMLLinkElement).href.includes(href));

    if (!already) {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = href;
      document.head.appendChild(linkEl);
    }
  }, []);

  return (
    <div>
      <header>
        <h1>신고된 댓글 관리</h1>
        <p>신고된 댓글을 검토하고 필요 시 처리할 수 있습니다.</p>
      </header>

      <section id="reports-container"></section>
      <AdminScript />
    </div>
  );
}
