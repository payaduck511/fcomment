'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '@/app/chat/page.module.css';
import { useCharacterChat, formatKST } from '@/features/chat/useCharacterChat';

function ChatComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterName = searchParams.get('characterName') ?? '';

  const {
    isAuthed,
    character,
    charLoading,
    comments,
    commentsLoading,
    inputValue,
    setInputWithLimit,
    charCount,
    sendingCooldown,
    postComment,
    toggleLike,
    reportComment,
    redirectToLogin,
    logout,
  } = useCharacterChat(characterName);
  
  const handleReport = (commentId: string) => {
    if (!isAuthed) {
      alert('신고 기능은 로그인 후 이용 가능합니다.');
      redirectToLogin();
      return;
    }
    const reason = prompt("이 댓글을 신고하는 이유를 입력해주세요.");
    if (reason) {
      reportComment(commentId, reason);
    }
  };

  const goToCharInfo = () => {
    if (character?.character_name) {
      router.push(`/charinfo?characterName=${encodeURIComponent(character.character_name)}`);
    }
  };

  if (charLoading) {
    return <main className={`${styles.page} ${styles.centeredContainer}`}><div className={styles.message}>캐릭터 정보를 불러오는 중...</div></main>;
  }

  if (!character) {
    return <main className={`${styles.page} ${styles.centeredContainer}`}><div className={styles.message}>캐릭터 정보가 없습니다.</div></main>;
  }
  
  return (
    <div className={styles.page}>
      <aside className={styles.sidePanel}>
        <div className={styles.characterInfo}>
          <div className={styles.characterImageContainer}>
            <img src={character.character_image} alt={character.character_name} className={styles.characterImage} />
          </div>
          <h2 className={styles.characterName}>{character.character_name}</h2>
          <div className={styles.characterDetails}>
            <p><strong>직업</strong> <span>{character.character_class}</span></p>
            <p><strong>레벨</strong> <span>{character.character_level}</span></p>
            <p><strong>길드</strong> <span>{character.character_guild_name || '없음'}</span></p>
          </div>
          <button className={styles.charinfoButton} onClick={goToCharInfo}>
            캐릭터 상세 정보
          </button>
        </div>
        <div className={styles.authActions}>
            <img src="/assets/images/logo.png" alt="Logo" className={styles.characterLogo} />
        </div>
      </aside>

      <main className={styles.chatContainer}>
        <header className={styles.chatHeader}>
            <h3>{character.character_name}님의 방명록</h3>
            <p>자유롭게 응원의 메시지를 남겨주세요!</p>
        </header>
        <div className={styles.chatBox}>
          {commentsLoading ? (
            <div className={styles.loadingMessage}>댓글을 불러오는 중...</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.nickname || comment.username || '익명'}</span>
                  <span className={styles.commentDate}>{formatKST(comment.createdAt)}</span>
                </div>
                <div className={styles.commentBody}>
                  <p className={styles.commentText}>{comment.content}</p>
                  <div className={styles.commentActions}>
                    <button onClick={() => toggleLike(comment._id)} className={`${styles.likeButton} ${comment.liked ? styles.liked : ''}`}>
                      👍 <span>{comment.likes}</span>
                    </button>
                    <button onClick={() => handleReport(comment._id)} className={styles.reportButton}>
                      신고
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <footer className={styles.chatFooter}>
            <div className={styles.inputBox}>
              <input
                type="text"
                placeholder={isAuthed ? "메시지를 입력하세요..." : "로그인이 필요합니다."}
                maxLength={30}
                value={inputValue}
                onChange={(e) => setInputWithLimit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !sendingCooldown && inputValue.length > 0) {
                    postComment();
                  }
                }}
                disabled={!isAuthed}
              />
                <div className={styles.inputControls}>
                  <span className={styles.charCount}>{charCount}/30</span>
                  <button 
                    onClick={postComment}
                    disabled={!!sendingCooldown || inputValue.length === 0 || !isAuthed}
                  >
                    {sendingCooldown ? `${sendingCooldown}초` : '전송'}
                  </button>
                </div>
            </div>
            <p className={styles.commentInfo}>글자수는 30자로 제한되며, 1분에 한 번씩 메시지를 보낼 수 있습니다.</p>
        </footer>
      </main>
    </div>
  );
}

// Suspense로 감싸서 export
export default function ChatClient() {
  return (
    <Suspense fallback={<main className={`${styles.page} ${styles.centeredContainer}`}><div className={styles.message}>페이지를 불러오는 중...</div></main>}>
      <ChatComponent />
    </Suspense>
  );
}

