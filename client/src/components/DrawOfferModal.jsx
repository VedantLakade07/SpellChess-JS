import React from 'react';

const DrawOfferModal = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '2px solid var(--primary-neon)' }}>
        <h2 className="title-gradient" style={{ fontSize: '1.8rem' }}>Draw Offered</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your opponent has offered a Draw. Would you like to accept it?</p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%', marginTop: '1rem' }}>
          <button className="btn-primary" onClick={onAccept} style={{ flex: 1 }}>
            Accept Draw
          </button>
          <button className="btn-secondary" onClick={onDecline} style={{ flex: 1 }}>
            Decline Draw
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawOfferModal;
