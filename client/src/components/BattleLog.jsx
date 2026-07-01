import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

const BattleLog = ({ history, getChessNotation }) => {
  const battleLogContainerRef = useRef(null);

  useEffect(() => {
    if (battleLogContainerRef.current) {
      battleLogContainerRef.current.scrollTop = battleLogContainerRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '160px', maxHeight: '200px' }}>
      <h3 style={{ color: 'var(--primary-neon)', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={18} style={{ stroke: 'var(--primary-neon)' }} />
        Battle Log
      </h3>
      
      <div ref={battleLogContainerRef} style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.95rem', paddingRight: '4px' }}>
        {(!history || history.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>No moves made yet.</p>
        ) : (
          history.map((hist, index) => {
            const playerLabel = hist.player === 'w' ? 'White' : 'Black';
            const labelColor = hist.player === 'w' ? '#e2fcfb' : 'var(--primary-neon)';
            const pieceSymbols = { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' };

            return (
              <div key={index} style={{ display: 'flex', gap: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: `3px solid ${hist.player === 'w' ? '#66fcf1' : '#45a29e'}` }}>
                <span style={{ fontWeight: 'bold', color: labelColor }}>{playerLabel}:</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {hist.type === 'move' ? (
                    <>
                      {pieceSymbols[hist.fromPiece?.type] || ''} {getChessNotation(hist.from.r, hist.from.c)} → {getChessNotation(hist.to.r, hist.to.c)}
                    </>
                  ) : (
                    <>
                      {hist.spellId === 'freeze' ? '❄️ casted Freeze' : (hist.spellId === 'double_move' ? '⚡ casted Double Move' : '✨ casted Move Changer')}
                      {hist.targetPos && ` on ${getChessNotation(hist.targetPos.r, hist.targetPos.c)}`}
                    </>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BattleLog;
