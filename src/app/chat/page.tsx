'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/features/common/NavBar';
import styles from './page.module.css';
import { useCharacterChat } from '@/features/chat/useCharacterChat';

export default function ChatPage() {
  // ✅ URL 쿼리에서 캐릭터 이름 읽기 (?characterName=XXX)
  const searchParams = useSearchParams();
  const initialName = searchParams.get('characterName') ?? '';

  // ✅ 훅에 초기 캐릭터 이름 전달
  const {
    character,
    inputValue,
    setInputWithLimit,
    charCount,
    sendingCooldown,
    postComment,
    redirectToLogin,
    logout,
  } = useCharacterChat(initialName);

  // 페이지 진입 시 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ 캐릭터 정보 패널 DOM 채우기
  useEffect(() => {
    const nameEl = document.getElementById('character-name');
    const imgEl = document.getElementById('character-image') as HTMLImageElement | null;
    const clsEl = document.getElementById('character-class');
    const lvlEl = document.getElementById('character-level');
    const guildEl = document.getElementById('character-guild');

    if (nameEl) nameEl.textContent = character?.character_name ?? 'Character Name';
    if (imgEl) imgEl.src = character?.character_image ?? '';
    if (clsEl) clsEl.textContent = character?.character_class ?? '';
    if (lvlEl) lvlEl.textContent = character?.character_level ? String(character.character_level) : '';
    if (guildEl) guildEl.textContent = character?.character_guild_name ?? '';
  }, [character]);

  // ✅ 기존 window.* 의존성 유지 (이 페이지에서만 바인딩)
  useEffect(() => {
    (window as any).postComment = () => postComment();

    (window as any).checkCommentLength = () => {
      const input = document.getElementById('comment-input') as HTMLInputElement | null;
      const counter = document.getElementById('char-count');
      const v = input?.value ?? '';
      setInputWithLimit(v);
      if (counter) counter.textContent = `${Math.min(v.length, 30)}/30`;
    };

    (window as any).goToCharInfo = () => {
      if (character?.character_name) {
        window.location.href = `/charinfo?name=${encodeURIComponent(character.character_name)}`;
      }
    };

    (window as any).redirectToLoginPage = () => redirectToLogin();
    (window as any).logout = () => logout();

    return () => {
      (window as any).postComment = undefined;
      (window as any).checkCommentLength = undefined;
      (window as any).goToCharInfo = undefined;
      (window as any).redirectToLoginPage = undefined;
      (window as any).logout = undefined;
    };
  }, [postComment, setInputWithLimit, character?.character_name, redirectToLogin, logout]);

  // 글자수/쿨타임 표시 동기화
  useEffect(() => {
    const counter = document.getElementById('char-count');
    if (counter) counter.textContent = `${charCount}/30`;
  }, [charCount]);

  useEffect(() => {
    const btn = document.getElementById('send-button') as HTMLButtonElement | null;
    if (!btn) return;
    if (sendingCooldown && sendingCooldown > 0) {
      btn.disabled = true;
      btn.textContent = `${sendingCooldown}s`;
    } else {
      btn.disabled = false;
      btn.textContent = '전송';
    }
  }, [sendingCooldown]);

  return (
    <div className={styles.page}>
      {/* 좌측 배경 장식 */}
      <div className={styles.leftImage}></div>

      {/* 네비게이션 바 */}
      <NavBar />

      {/* 캐릭터 정보 패널 */}
      <aside className={styles.characterInfo}>
        <button className={`${styles.loginBtn}`} style={{ display: 'none' }} onClick={() => (window as any).redirectToLoginPage?.()}>
          로그인
        </button>
        <button className={`${styles.logoutBtn}`} style={{ display: 'none' }} onClick={() => (window as any).logout?.()}>
          로그아웃
        </button>

        <h2 id="character-name">Character Name</h2>

        <div className={styles.characterImageContainer}>
          <img id="character-image" src="" alt="Character" />
        </div>

        <p>
          <strong>직업:</strong> <span id="character-class"></span>
        </p>
        <p>
          <strong>레벨:</strong> <span id="character-level"></span>
        </p>
        <p>
          <strong>길드:</strong> <span id="character-guild"></span>
        </p>
        <button id="charinfo-button" onClick={() => (window as any).goToCharInfo?.()}>
          캐릭터 상세 정보
        </button>

        <img src="/assets/images/logo.png" alt="Logo" className={styles.characterLogo} />
      </aside>

      {/* 채팅 박스 */}
      <main className={styles.chatContainer}>
        <div className={styles.chatBox} id="chat-box"></div>

        <div className={styles.inputBox}>
          <input
            type="text"
            id="comment-input"
            placeholder="댓글을 입력하세요"
            maxLength={30}
            onInput={() => (window as any).checkCommentLength?.()}
            defaultValue={inputValue}
          />
          <span id="char-count">0/30</span>
          <button id="send-button" onClick={() => (window as any).postComment?.()}>
            전송
          </button>
        </div>

        <p className="comment-info">글자수는 30자로 제한되고 1분에 한번씩 채팅이 가능합니다.</p>
      </main>

      {/* 우측 배경 장식 */}
      <div className={styles.rightImage}></div>
    </div>
  );
}
