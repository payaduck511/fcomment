'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/admin/page.module.css';

interface Report {
  _id: string;
  reason?: string;
  commentContent?: string;
  reporterNickname?: string;
  characterName?: string;
  commenterNickname?: string;
}

export default function AdminClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          alert('로그인이 필요합니다.');
          window.location.href = '/login';
          return;
        }
        const response = await fetch('/api/admin/reports', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.');
            window.location.href = '/login';
          }
          throw new Error('신고 목록을 불러오는 데 실패했습니다.');
        }

        const data = await response.json();
        if (data && data.success) {
            setReports(data.reports || []);
        } else {
            throw new Error(data.message || '데이터 형식이 올바르지 않습니다.');
        }

      } catch (error: any) {
        console.error(error);
        alert(`신고 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleProcessReport = async (reportId: string, action: 'delete' | 'resolve') => {
    const confirmMessage = action === 'delete'
      ? '정말로 이 댓글을 삭제하고 신고를 처리하시겠습니까?'
      : "이 신고를 '문제 없음'으로 처리하시겠습니까?";
      
    if (!confirm(confirmMessage)) return;

    try {
      const endpoint = action === 'delete' ? `/api/admin/reports/${reportId}` : `/api/admin/reports/${reportId}/resolve`;
      const method = action === 'delete' ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      const data = await response.json();
      alert(data.message || '처리되었습니다.');
      
      if (response.ok) {
        setReports(prev => prev.filter(report => report._id !== reportId));
      }
    } catch (error) {
      console.error(error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>신고된 댓글 관리</h1>
          <p>신고된 댓글을 검토하고 필요 시 처리할 수 있습니다.</p>
        </header>

        <section className={styles.reportsContainer}>
          {loading ? (
            <p>신고 목록을 불러오는 중...</p>
          ) : reports.length === 0 ? (
            <p>처리할 신고가 없습니다.</p>
          ) : (
            reports.map((report) => (
              <div key={report._id} className={styles.reportCard}>
                <div className={styles.reportContent}>
                  <p><strong>신고된 댓글:</strong> {report.commentContent}</p>
                  <p><strong>신고 사유:</strong> {report.reason}</p>
                  <p><strong>신고자:</strong> {report.reporterNickname}</p>
                  <p><strong>댓글 작성자:</strong> {report.commenterNickname}</p>
                  <p><strong>캐릭터 이름:</strong> {report.characterName}</p>
                </div>
                <div className={styles.reportActions}>
                  <button onClick={() => handleProcessReport(report._id, 'delete')} className={styles.deleteButton}>
                    {'댓글 삭제 및 신고 처리'}
                  </button>
                  <button onClick={() => handleProcessReport(report._id, 'resolve')} className={styles.resolveButton}>
                    {'문제 없음 (신고 기각)'}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}