'use client';

import MiniGameCanvas from './MiniGameCanvas';
import MiniGameHud from './MiniGameHud';
import { GameStateProvider } from './state/gameState';

export default function MiniGame() {
  return (
    <GameStateProvider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MiniGameCanvas />
        </div>
        <MiniGameHud />
      </div>
    </GameStateProvider>
  );
}
