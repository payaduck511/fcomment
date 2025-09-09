'use client';

import { useEffect, useState } from 'react';
import { api, ENDPOINTS } from '@/lib/api';
import type { UserInfo } from '@/types';

export default function AuthBar() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('authToken'));
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await api<UserInfo>(ENDPOINTS.userInfo, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(me);
      } catch (err) {
        console.error('AuthBar fetch error:', err);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    })();
  }, [token]);

  const onLogin = () => {
    const currentUrl = window.location.href;
    window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
  };

  const onLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  if (user) {
    return (
      <div id="user-info" style={{ display: 'block' }}>
        <p>
          <strong id="nickname-display">{user.nickname}</strong> 님 환영합니다!
        </p>
        <button className="logout-btn" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button id="login-button" onClick={onLogin}>
      로그인
    </button>
  );
}
