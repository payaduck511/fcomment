'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './NavBar.module.css';

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // localStorage에서 'authToken' 키를 확인하여 로그인 상태를 판단합니다.
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      // 실제로는 API를 통해 토큰의 유효성을 검증하고 사용자 이름을 가져오는 로직이 필요합니다.
      // 예시를 위해 임시로 'Guest'라는 이름을 사용합니다.
      setIsLoggedIn(true);
      setUserName('Guest'); 
    }
  }, []);

  const handleLogout = () => {
    // 로그아웃 시 localStorage에서 'authToken' 키를 삭제합니다.
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserName('');
    // 로그아웃 후 홈 페이지로 리다이렉트
    window.location.href = '/';
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLogos}>
        <div className={styles.logo2} />
      </div>

      <ul className={styles.menu}>
        <li className={styles.menuItem}>
          <Link className={styles.menuLink} href="/">홈</Link>
        </li>
        <li className={styles.menuItem}>
          <Link className={styles.menuLink} href="/job">직업 채팅</Link>
        </li>
        <li className={`${styles.menuItem} ${styles.menuItemDropdown}`}>
          <button
            type="button"
            className={styles.menuLink}
            aria-haspopup="true"
            aria-expanded="false"
          >
            시뮬레이션
          </button>
          <div className={styles.dropdownPanel}>
            <ul className={styles.dropdownList}>
              <li>
                <Link className={styles.dropdownLink} href="/applesim">
                  플래티넘 애플
                </Link>
              </li>
              <li>
                <Link className={styles.dropdownLink} href="/cubesim">
                  큐브
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className={styles.menuItem}>
          <Link className={styles.menuLink} href="/cooldown">사냥</Link>
        </li>
        <li className={styles.menuItem}>
          <Link className={styles.menuLink} href="/mycomment">내댓글</Link>
        </li>
      </ul>

      {/* 우측 로그인/사용자 영역 */}
      <div className={styles.navRight}>
        {isLoggedIn ? (
          <>
            <span className={styles.userName}>{userName}님</span>
            <button className={styles.authBtn} onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <Link className={styles.authBtn} href="/login">로그인</Link>
        )}
      </div>
    </nav>
  );
}