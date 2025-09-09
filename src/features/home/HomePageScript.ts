// frontend/src/features/home/HomePageScript.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function HomePageScript() {
  const authTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // ====== 유틸 ======
    const API = {
      userInfo:        '/api/user-info',
      recentComments:  '/api/recent-comments',
      popularComments: '/api/popular-comments',
    } as const;

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
      const parts = f.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});
      return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
    }

    function escapeHTML(s: unknown) {
      return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function getSafeRedirectParam(): string {
      const currentUrl = window.location.href;
      try {
        const u = new URL(currentUrl);
        if (u.origin !== window.location.origin) return '/index.html';
      } catch {
        return '/index.html';
      }
      // 내부 경로만
      const path = new URL(currentUrl).pathname + new URL(currentUrl).search;
      return path.startsWith('/') ? path : '/index.html';
    }

    // ====== 핸들러 ======
    function redirectToLoginPage() {
      const safe = getSafeRedirectParam();
      window.location.href = `/login.html?redirect=${encodeURIComponent(safe)}`;
    }

    async function fetchUserInfo() {
      const token = authTokenRef.current;
      if (!token) return;

      try {
        const response = await fetch(API.userInfo, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user info');

        const data = await response.json().catch(() => ({} as any));
        const nickEl  = document.getElementById('nickname-display');
        const userInfo = document.getElementById('user-info');
        const loginBtn = document.getElementById('login-button');

        if (nickEl)  nickEl.textContent = String((data as any).nickname ?? '사용자');
        if (userInfo) userInfo.setAttribute('style', 'display: block;');
        if (loginBtn) loginBtn.setAttribute('style', 'display: none;');
      } catch (error) {
        console.error('Error fetching user info:', error);
        localStorage.removeItem('authToken');
        authTokenRef.current = null;
        const loginBtn = document.getElementById('login-button');
        const userInfo = document.getElementById('user-info');
        if (loginBtn) loginBtn.setAttribute('style', 'display: block;');
        if (userInfo) userInfo.setAttribute('style', 'display: none;');
      }
    }

    function logout() {
      localStorage.removeItem('authToken');
      authTokenRef.current = null;
      const loginBtn = document.getElementById('login-button');
      const userInfo = document.getElementById('user-info');
      if (loginBtn) loginBtn.setAttribute('style', 'display: block;');
      if (userInfo) userInfo.setAttribute('style', 'display: none;');
    }

    function searchCharacter() {
      const input = document.getElementById('characterName') as HTMLInputElement | null;
      const characterName = input ? input.value.trim() : '';
      if (!characterName) {
        alert('캐릭터 이름을 입력해주세요!');
        if (input) input.focus();
        return;
      }
      window.location.href = `/chat.html?characterName=${encodeURIComponent(characterName)}`;
    }

    async function loadRecentComments() {
      try {
        const response = await fetch(API.recentComments);
        if (!response.ok) throw new Error('Failed to load recent comments');
        const comments: any[] = await response.json().catch(() => []);

        const container = document.getElementById('recent-comments');
        if (!container) return;
        container.innerHTML = '';

        if (Array.isArray(comments) && comments.length > 0) {
          comments.forEach((comment) => {
            const div = document.createElement('div');
            div.classList.add('comment-item');

            const formattedDate = formatKST(comment.createdAt);
            const displayName =
              comment?.sourceType === 'job'
                ? `직업: ${comment?.displayName ?? ''}`
                : comment?.displayName ?? '';

            div.innerHTML = `
              <p><strong>${escapeHTML(comment?.nickname)}</strong> -> (${escapeHTML(displayName)})</p>
              <p>${escapeHTML(comment?.content)}</p>
              <p class="comment-meta">${escapeHTML(formattedDate)}</p>
            `;
            container.appendChild(div);
          });
        } else {
          container.innerHTML = '<p>최근 댓글이 없습니다.</p>';
        }
      } catch (err) {
        console.error('Error loading recent comments:', err);
        const container = document.getElementById('recent-comments');
        if (container) container.innerHTML = '<p>댓글을 불러오는 중 오류가 발생했습니다.</p>';
      }
    }

    async function loadPopularComments() {
      try {
        const response = await fetch(API.popularComments);
        if (!response.ok) throw new Error('Failed to load popular comments');
        const comments: any[] = await response.json().catch(() => []);

        const container = document.getElementById('popular-comments');
        if (!container) return;
        container.innerHTML = '';

        if (Array.isArray(comments) && comments.length > 0) {
          comments.forEach((comment) => {
            const div = document.createElement('div');
            div.classList.add('comment-item');

            const formattedDate = formatKST(comment.createdAt);
            const likes = Number(comment?.likes ?? 0);

            div.innerHTML = `
              <p><strong>${escapeHTML(comment?.nickname)}</strong> -> (${escapeHTML(comment?.displayName ?? '')})</p>
              <p>${escapeHTML(comment?.content)}</p>
              <p class="comment-meta">추천 수: ${likes} | ${escapeHTML(formattedDate)}</p>
            `;
            container.appendChild(div);
          });
        } else {
          container.innerHTML = '<p>인기 댓글이 없습니다.</p>';
        }
      } catch (err) {
        console.error('Error loading popular comments:', err);
        const container = document.getElementById('popular-comments');
        if (container) container.innerHTML = '<p>인기 댓글을 불러오는 중 오류가 발생했습니다.</p>';
      }
    }

    function initPage() {
      // 우클릭 방지
      const contextHandler = (e: MouseEvent) => e.preventDefault();
      document.addEventListener('contextmenu', contextHandler);

      // 토큰 확인
      authTokenRef.current = localStorage.getItem('authToken');
      if (authTokenRef.current) {
        fetchUserInfo().finally(() => {
          loadRecentComments();
          loadPopularComments();
        });
      } else {
        const loginBtn = document.getElementById('login-button');
        const userInfo = document.getElementById('user-info');
        if (loginBtn) loginBtn.setAttribute('style', 'display: block;');
        if (userInfo) userInfo.setAttribute('style', 'display: none;');
        loadRecentComments();
        loadPopularComments();
      }

      // 버튼/입력창 이벤트
      const loginBtn  = document.getElementById('login-button');
      const logoutBtn = document.getElementById('logout-button');
      const input     = document.getElementById('characterName') as HTMLInputElement | null;
      const searchBtn = document.getElementById('search-button');

      const loginClick = () => redirectToLoginPage();
      const logoutClick = () => logout();
      const keydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') searchCharacter();
      };
      const searchClick = () => searchCharacter();

      if (loginBtn)  loginBtn.addEventListener('click', loginClick);
      if (logoutBtn) logoutBtn.addEventListener('click', logoutClick);
      if (input)     input.addEventListener('keydown', keydown);
      if (searchBtn) searchBtn.addEventListener('click', searchClick);

      // 클린업
      return () => {
        document.removeEventListener('contextmenu', contextHandler);
        if (loginBtn)  loginBtn.removeEventListener('click', loginClick);
        if (logoutBtn) logoutBtn.removeEventListener('click', logoutClick);
        if (input)     input.removeEventListener('keydown', keydown);
        if (searchBtn) searchBtn.removeEventListener('click', searchClick);
      };
    }

    // 초기화 실행
    const cleanup = initPage();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  return null;
}
