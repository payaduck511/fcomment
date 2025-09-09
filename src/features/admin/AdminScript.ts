'use client';

import { useEffect } from 'react';

interface Report {
  _id: string;
  reason?: string;
  commentContent?: string;
  reporterNickname?: string;
  characterName?: string;
  commenterNickname?: string;
}

export default function AdminScript() {
  useEffect(() => {
    const API = {
      list: '/api/admin/reports',
      del: (id: string) => `/api/admin/reports/${id}`,
      resolve: (id: string) => `/api/admin/reports/${id}/resolve`,
    } as const;

    function escapeHTML(s: unknown) {
      return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function displayReports(reports: Report[]) {
      const wrap = document.getElementById('reports-container');
      if (!wrap) return;
      wrap.innerHTML = '';

      if (!Array.isArray(reports) || reports.length === 0) {
        wrap.innerHTML = '<p>신고된 댓글이 없습니다.</p>';
        return;
      }

      const frag = document.createDocumentFragment();
      for (const report of reports) {
        const el = document.createElement('div');
        el.className = 'report';
        el.innerHTML = `
          <p><strong>신고 사유:</strong> ${escapeHTML(report.reason)}</p>
          <p><strong>댓글 내용:</strong> ${escapeHTML(report.commentContent)}</p>
          <p><strong>신고자:</strong> ${escapeHTML(report.reporterNickname)}</p>
          <p><strong>캐릭터 이름:</strong> ${escapeHTML(report.characterName)}</p>
          <p><strong>댓글자:</strong> ${escapeHTML(report.commenterNickname)}</p>
          <div class="actions">
            <button data-action="delete" data-id="${report._id}">댓글 삭제 및 신고 처리</button>
            <button data-action="resolve" data-id="${report._id}">문제 없음</button>
          </div>
        `;
        frag.appendChild(el);
      }
      wrap.appendChild(frag);
    }

    async function fetchReports() {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          alert('로그인이 필요합니다.');
          return;
        }
        const res = await fetch(API.list, { headers: { Authorization: `Bearer ${authToken}` } });
        if (!res.ok) {
          if (res.status === 401) {
            alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.');
            return;
          }
          console.error('Error fetching reports:', res.status, res.statusText);
          alert(`서버 오류: ${res.status}`);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data && data.success) {
          displayReports(data.reports || []);
        } else {
          alert('신고된 댓글을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        alert('서버에 문제가 발생했습니다.');
      }
    }

    async function deleteReport(reportId: string) {
      if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
      try {
        const res = await fetch(API.del(reportId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          alert(data.message || '삭제되었습니다.');
          await fetchReports();
        } else {
          alert(data?.message || '댓글 삭제에 실패했습니다.');
        }
      } catch (err) {
        console.error('Error deleting report:', err);
        alert('서버에 문제가 발생했습니다.');
      }
    }

    async function resolveReport(reportId: string) {
      if (!confirm("이 신고를 '문제 없음'으로 처리하시겠습니까?")) return;
      try {
        const res = await fetch(API.resolve(reportId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          alert(data.message || '처리되었습니다.');
          await fetchReports();
        } else {
          alert(data?.message || '신고 처리에 실패했습니다.');
        }
      } catch (err) {
        console.error('Error resolving report:', err);
        alert('서버에 문제가 발생했습니다.');
      }
    }

    const wrap = document.getElementById('reports-container');
    const onWrapClick = async (e: Event) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('button[data-action]') as HTMLButtonElement | null;
      if (!btn) return;

      const id = btn.getAttribute('data-id') || '';
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      if (action === 'delete') await deleteReport(id);
      if (action === 'resolve') await resolveReport(id);
    };

    if (wrap) wrap.addEventListener('click', onWrapClick);
    fetchReports();

    return () => {
      if (wrap) wrap.removeEventListener('click', onWrapClick);
    };
  }, []);

  return null;
}
