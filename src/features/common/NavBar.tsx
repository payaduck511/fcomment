'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './NavBar.module.css';

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setIsLoggedIn(true);
      setUserName('Guest');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserName('');
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
              <li>
                <Link className={styles.dropdownLink} href="/bossringsim">
                  보스 반지상자
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
