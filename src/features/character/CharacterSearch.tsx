// src/features/character/CharacterSearch.tsx 

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CharacterSearch() {
  const [name, setName] = useState('');
  const router = useRouter();

  const go = () => {
    const v = name.trim();
    if (!v) {
      alert('캐릭터 이름을 입력해주세요!');
      return;
    }
    router.push(`/chat?characterName=${encodeURIComponent(v)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      go();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        type="text"
        value={name}
        placeholder="캐릭터 이름"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text)',
          fontSize: '16px',
          padding: '10px 12px',
          borderRadius: '8px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}