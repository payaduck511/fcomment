// /src/features/chat/ChatClient.tsx

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
    redirectToLogin,
    logout,
  } = useCharacterChat(characterName);
  
  const goToCharInfo = () => {
    if (character?.character_name) {
      router.push(`/charinfo?characterName=${encodeURIComponent(character.character_name)}`);
    }
  };

  if (charLoading) {
    return <main className={styles.page}><div className={styles.message}>캐릭터 정보를 불러오는 중...</div></main>;
  }

  if (!character) {
    return <main className={styles.page}><div className={styles.message}>캐릭터 정보가 없습니다.</div></main>;
  }
  
  return (
    <div className={styles.page}>
      <aside className={styles.characterInfo}>
        {isAuthed ? (
          <button className={styles.logoutBtn} onClick={logout}>로그아웃</button>
        ) : (
          <button className={styles.loginBtn} onClick={redirectToLogin}>로그인</button>
        )}
        
        <h2>{character.character_name}</h2>

        <div className={styles.characterImageContainer}>
          <img src={character.character_image} alt={character.character_name} />
        </div>

        <p><strong>직업:</strong> <span>{character.character_class}</span></p>
        <p><strong>레벨:</strong> <span>{character.character_level}</span></p>
        <p><strong>길드:</strong> <span>{character.character_guild_name || '없음'}</span></p>
        
        <button className={styles.charinfoButton} onClick={goToCharInfo}>
          캐릭터 상세 정보
        </button>

        <img src="/assets/images/logo.png" alt="Logo" className={styles.characterLogo} />
      </aside>

      <main className={styles.chatContainer}>
        <div className={styles.chatBox}>
          {commentsLoading ? (
            <div className={styles.comment}>댓글을 불러오는 중...</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.nickname || '익명'}:</span>
                  <span className={styles.commentDate}>{formatKST(comment.createdAt)}</span>
                </div>
                <p className={styles.commentText}>{comment.content}</p>
                <div className={styles.commentFooter}>
                  <button onClick={() => toggleLike(comment._id)} className={`${styles.likeButton} ${comment.liked ? styles.liked : ''}`}>
                    👍 {comment.likes}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.inputBox}>
          <input
            type="text"
            placeholder={isAuthed ? "댓글을 입력하세요" : "로그인이 필요합니다."}
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
          <span className={styles.charCount}>{charCount}/30</span>
          <button 
            onClick={postComment}
            disabled={!!sendingCooldown || inputValue.length === 0 || !isAuthed}
          >
            {sendingCooldown ? `${sendingCooldown}초` : '전송'}
          </button>
        </div>

        <p className={styles.commentInfo}>글자수는 30자로 제한되고 1분에 한번씩 채팅이 가능합니다.</p>
      </main>
    </div>
  );
}

// Suspense로 감싸서 export
export default function ChatClient() {
  return (
    <Suspense fallback={<main className={styles.page}><div className={styles.message}>로딩 중...</div></main>}>
      <ChatComponent />
    </Suspense>
  );
}