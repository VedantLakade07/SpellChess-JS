import React from 'react';

const SpellBook = ({
  spells,
  playerColor,
  isMyTurn,
  spellCastActive,
  moveChangerActive,
  doubleMoveActive,
  gameState,
  opponentDisconnected,
  onCastFreezeInitiate,
  onCastSelfSpell
}) => {
  if (!gameState) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <h3 style={{ color: 'var(--primary-neon)', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>✨ Spell Book</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        {/* Freeze Spell */}
        <button
          className={`spell-button ${spellCastActive === 'freeze' ? 'active' : ''}`}
          onClick={onCastFreezeInitiate}
          disabled={!isMyTurn || spells.freeze === 0 || gameState.status !== 'active' || opponentDisconnected || gameState.spellCastThisTurn}
        >
          <span className="spell-icon">❄️</span>
          <div className="spell-details">
            <span className="spell-name">Frost Freeze</span>
            <span className="spell-desc">Freeze an opponent piece for 2 turns</span>
          </div>
          <span className={`spell-charge ${spells.freeze === 0 ? 'depleted' : ''}`}>
            {spells.freeze}/1
          </span>
        </button>

        {/* Double Move Spell */}
        <button
          className="spell-button"
          onClick={() => onCastSelfSpell('double_move')}
          disabled={!isMyTurn || spells.double_move === 0 || gameState.status !== 'active' || opponentDisconnected || doubleMoveActive || gameState.spellCastThisTurn}
        >
          <span className="spell-icon">⚡</span>
          <div className="spell-details">
            <span className="spell-name">Time Warp</span>
            <span className="spell-desc">Make two moves in one turn</span>
          </div>
          <span className={`spell-charge ${spells.double_move === 0 ? 'depleted' : ''}`}>
            {spells.double_move}/1
          </span>
        </button>

        {/* Move Changer Spell */}
        <button
          className="spell-button"
          onClick={() => onCastSelfSpell('move_changer')}
          disabled={!isMyTurn || spells.move_changer === 0 || gameState.status !== 'active' || opponentDisconnected || moveChangerActive || gameState.spellCastThisTurn}
        >
          <span className="spell-icon">✨</span>
          <div className="spell-details">
            <span className="spell-name">Move Changer</span>
            <span className="spell-desc">Bishops move like Kings, Queens like Knights (1 turn)</span>
          </div>
          <span className={`spell-charge ${spells.move_changer === 0 ? 'depleted' : ''}`}>
            {spells.move_changer}/1
          </span>
        </button>
      </div>
    </div>
  );
};

export default SpellBook;
