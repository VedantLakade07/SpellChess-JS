import React from 'react';

const PromotionModal = ({ promotionPending, onSelect, onCancel }) => {
  if (!promotionPending) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '2px solid var(--primary-neon)' }}>
        <h2 className="title-gradient" style={{ fontSize: '1.8rem' }}>Pawn Promotion</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Choose which piece to promote your pawn to:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '0.5rem' }}>
          {[
            { type: 'q', label: 'Queen', icon: '♕' },
            { type: 'r', label: 'Rook', icon: '♖' },
            { type: 'b', label: 'Bishop', icon: '♗' },
            { type: 'n', label: 'Knight', icon: '♘' }
          ].map((opt) => (
            <button
              key={opt.type}
              className="btn-secondary"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => onSelect(opt.type)}
            >
              <span style={{ fontSize: '2.2rem', color: 'var(--primary-neon)', lineHeight: '1' }}>{opt.icon}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{opt.label}</span>
            </button>
          ))}
        </div>

        <button className="btn-secondary" onClick={onCancel} style={{ marginTop: '0.5rem' }}>
          Cancel Move
        </button>
      </div>
    </div>
  );
};

export default PromotionModal;
