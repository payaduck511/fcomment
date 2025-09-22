'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './NavBar.module.css';

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);

  useEffect(() => {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (authToken) {
      setIsLoggedIn(true);
      setUserName('Guest');
    }
  }, []);

  // 데스크톱 레이아웃 보호: 모바일 폭일 때만 모바일 메뉴/버튼 렌더
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
        setOpenMobileDropdown(null);
        document.body.style.overflow = '';
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 모바일 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isMobile, isMobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserName('');
    window.location.href = '/';
  };

  return (
    <nav className={styles.navbar}>
      {/* === 아래부터 데스크톱 네비: 원본 그대로 === */}
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
      {/* === 여기까지 데스크톱 네비 원본 === */}

      {/* 모바일 요소: 모바일 해상도에서만 렌더 */}
      {isMobile && (
        <>
          <button
            className={`${styles.navToggleBtn} ${isMobileOpen ? styles.isOpen : ''}`}
            aria-label="메뉴 열기"
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen(v => !v)}
          >
            <span />
          </button>

          <div
            className={`${styles.mobileMenu} ${isMobileOpen ? styles.isOpen : ''}`}
            aria-hidden={!isMobileOpen}
          >
            <ul className={styles.mobileMenuList}>
              <li>
                <Link className={styles.mobileMenuLink} href="/" onClick={() => setIsMobileOpen(false)}>
                  홈
                </Link>
              </li>
              <li>
                <Link className={styles.mobileMenuLink} href="/job" onClick={() => setIsMobileOpen(false)}>
                  직업 채팅
                </Link>
              </li>

              <li className={styles.mobileMenuItemDropdown}>
                <button
                  className={styles.mobileMenuLink}
                  aria-expanded={openMobileDropdown === 'sim'}
                  onClick={() =>
                    setOpenMobileDropdown(cur => (cur === 'sim' ? null : 'sim'))
                  }
                >
                  시뮬레이션
                </button>
                {openMobileDropdown === 'sim' && (
                  <ul className={styles.mobileDropdownPanel}>
                    <li>
                      <Link
                        className={styles.mobileDropdownLink}
                        href="/applesim"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        플래티넘 애플
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={styles.mobileDropdownLink}
                        href="/cubesim"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        큐브
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={styles.mobileDropdownLink}
                        href="/bossringsim"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        보스 반지상자
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link className={styles.mobileMenuLink} href="/cooldown" onClick={() => setIsMobileOpen(false)}>
                  사냥
                </Link>
              </li>
              <li>
                <Link className={styles.mobileMenuLink} href="/mycomment" onClick={() => setIsMobileOpen(false)}>
                  내댓글
                </Link>
              </li>
            </ul>

            <div style={{ marginTop: 24 }}>
              {isLoggedIn ? (
                <>
                  <div className={styles.userName} style={{ marginBottom: 8 }}>
                    {userName}님
                  </div>
                  <button className={styles.authBtn} onClick={handleLogout}>
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  className={styles.authBtn}
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
