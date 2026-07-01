import React from 'react';
import { RefreshCw } from 'lucide-react';

const ConcludedModal = ({
  isOpen,
  gameState,
  playerColor,
  opponentLeftLobby,
  opponentDisconnected,
  rematchRequested,
  onRematch,
  onLeave,
  getConcludedTitle,
  getConcludedClass
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '450px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '2px solid var(--primary-neon)' }}>
        <h2 className={getConcludedClass()} style={{ fontSize: '2.5rem' }}>
          {getConcludedTitle()}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {opponentLeftLobby ? (
            'Your opponent has left the room lobby.'
          ) : opponentDisconnected ? (
            'Your opponent disconnected from the match.'
          ) : gameState?.status === 'timeout' ? (
            gameState.winner === playerColor ? '⏰ Timeout! You won on time! ⏰' : '⏰ Timeout! You ran out of time. ⏰'
          ) : gameState?.status === 'checkmate' ? (
            gameState.winner === playerColor ? '🎉 Checkmate! You are victorious! 🎉' : '💀 Checkmate! You have been defeated. 💀'
          ) : gameState?.status === 'draw-agreement' ? (
            ' Match ended in a Draw by Agreement. '
          ) : (
            ' Match ended in a Stalemate. '
          )}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%', marginTop: '1rem' }}>
          {!opponentDisconnected && !opponentLeftLobby && (
            <button
              className="btn-primary"
              onClick={onRematch}
              disabled={rematchRequested[playerColor]}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} />
              {rematchRequested[playerColor] ? 'Waiting...' : 'Request Rematch'}
            </button>
          )}
          <button className="btn-secondary" onClick={onLeave}>
            Return to Lobby
          </button>
        </div>
        
        {!opponentDisconnected && !opponentLeftLobby && rematchRequested[playerColor === 'w' ? 'b' : 'w'] && (
          <p style={{ fontSize: '0.85rem', color: 'var(--primary-neon)' }}>Opponent has requested a rematch!</p>
        )}
      </div>
    </div>
  );
};

export default ConcludedModal;
