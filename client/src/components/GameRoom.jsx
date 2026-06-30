import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { getLegalMoves } from '../chessLogic';
import PieceSVG from './ChessPieces';
import { Copy, Check, MessageSquare, Send, ArrowLeft, RefreshCw } from 'lucide-react';

const GameRoom = ({ roomId, playerColor, onLeave }) => {
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState({ w: null, b: null });
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [spellCastActive, setSpellCastActive] = useState(null); // 'freeze' or null
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [rematchRequested, setRematchRequested] = useState({ w: false, b: false });
  const [copied, setCopied] = useState(false);
  const [spellAlert, setSpellAlert] = useState(null); // { message, color }
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [opponentLeftLobby, setOpponentLeftLobby] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    // Scroll chat to bottom on new messages
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    // Sockets listeners
    socket.on('game-start', ({ players: p, gameState: gs }) => {
      setPlayers(p);
      setGameState(gs);
      setRematchRequested({ w: false, b: false });
      setOpponentDisconnected(false);
      setOpponentLeftLobby(false);
    });

    socket.on('state-updated', (gs) => {
      setGameState(gs);
      // Clear selections when state updates
      setSelectedSquare(null);
      setValidMoves([]);
      setSpellCastActive(null);
    });

    socket.on('spell-cast-alert', ({ player, spell, color }) => {
      setSpellAlert({ message: `${player} casted ${spell}!`, color });
      setTimeout(() => {
        setSpellAlert(null);
      }, 3500);
    });

    socket.on('chat-message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('rematch-requested', ({ color }) => {
      setRematchRequested((prev) => ({ ...prev, [color]: true }));
    });

    socket.on('opponent-disconnected', () => {
      setOpponentDisconnected(true);
    });

    socket.on('opponent-left-lobby', () => {
      setOpponentLeftLobby(true);
    });

    socket.on('error-msg', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('game-start');
      socket.off('state-updated');
      socket.off('spell-cast-alert');
      socket.off('chat-message');
      socket.off('rematch-requested');
      socket.off('opponent-disconnected');
      socket.off('opponent-left-lobby');
      socket.off('error-msg');
    };
  }, []);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSquareClick = (r, c) => {
    if (!gameState || gameState.status !== 'active' || opponentDisconnected) return;

    // Check if it's our turn
    const isOurTurn = gameState.turn === playerColor;
    if (!isOurTurn) return;

    const piece = gameState.board[r][c];

    // If a spell cast targeting is active (Freeze)
    if (spellCastActive === 'freeze') {
      if (piece && piece.color !== playerColor) {
        // Valid target: opponent piece
        socket.emit('cast-spell', { roomId, spellId: 'freeze', targetPos: { r, c } });
        setSpellCastActive(null);
      } else {
        // Cancel casting
        setSpellCastActive(null);
      }
      return;
    }

    // Select piece
    if (piece && piece.color === playerColor) {
      setSelectedSquare({ r, c });
      const moves = getLegalMoves(gameState, r, c);
      setValidMoves(moves);
      return;
    }

    // Make move if clicking a valid move square
    const isMoveValid = validMoves.some((m) => m.r === r && m.c === c);
    if (selectedSquare && isMoveValid) {
      socket.emit('make-move', { roomId, from: selectedSquare, to: { r, c } });
      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handleCastSelfSpell = (spellId) => {
    if (!gameState || gameState.status !== 'active' || gameState.turn !== playerColor) return;
    socket.emit('cast-spell', { roomId, spellId });
  };

  const handleCastFreezeInitiate = () => {
    if (!gameState || gameState.status !== 'active' || gameState.turn !== playerColor) return;
    setSpellCastActive('freeze');
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('send-chat', { roomId, message: chatInput.trim() });
    setChatInput('');
  };

  const handleRematchRequest = () => {
    socket.emit('request-rematch', { roomId });
  };

  const handleLeaveGame = () => {
    socket.emit('leave-room', { roomId });
    onLeave();
  };

  // Render variables
  if (!gameState) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', margin: 'auto', maxWidth: '500px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <h3 className="title-gradient" style={{ fontSize: '1.8rem' }}>Waiting for Opponent</h3>
        <p style={{ color: 'var(--text-muted)' }}>Share this room code with your friend so they can join:</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(102, 252, 241, 0.2)' }}>
          <span style={{ fontSize: '1.8rem', letterSpacing: '4px', fontWeight: 'bold', color: 'var(--primary-neon)' }}>{roomId}</span>
          <button onClick={copyRoomCode} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            {copied ? <Check size={20} style={{ stroke: '#00e676' }} /> : <Copy size={20} />}
          </button>
        </div>

        <button className="btn-secondary" onClick={handleLeaveGame} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Lobby
        </button>
      </div>
    );
  }

  // Set up board coordinate lists so player sees their side at the bottom
  const rowIndices = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const colIndices = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const currentTurnPlayer = gameState.turn === 'w' ? players.w : players.b;
  const isMyTurn = gameState.turn === playerColor;

  // Active spells checks for active player glow
  const doubleMoveActive = gameState.activeSpells[playerColor]?.doubleMove;
  const moveChangerActive = gameState.activeSpells[playerColor]?.moveChanger;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Alert Banner for Spell Casts */}
      {spellAlert && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: spellAlert.color === 'w' ? 'rgba(102, 252, 241, 0.95)' : 'rgba(155, 93, 229, 0.95)',
          color: spellAlert.color === 'w' ? 'black' : 'white',
          padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
          fontSize: '1.1rem', pointerEvents: 'none', animation: 'freeze-shiver 0.3s ease-out'
        }}>
          ✨ {spellAlert.message}
        </div>
      )}

      {/* Top controls and game header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn-secondary" onClick={handleLeaveGame} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Exit Game
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ROOM CODE: </span>
          <span style={{ fontWeight: 'bold', color: 'var(--primary-neon)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={copyRoomCode}>
            {roomId} {copied ? <Check size={14} style={{ stroke: '#00e676' }} /> : <Copy size={14} />}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {doubleMoveActive && <span className="glass-panel" style={{ padding: '6px 12px', border: '1px solid var(--double-gold)', color: 'var(--double-gold)', fontSize: '0.8rem', fontWeight: 'bold' }}>⚡ DOUBLE MOVE ACTIVE</span>}
          {moveChangerActive && <span className="glass-panel" style={{ padding: '6px 12px', border: '1px solid var(--changer-purple)', color: 'var(--changer-purple)', fontSize: '0.8rem', fontWeight: 'bold' }}>✨ MOVE CHANGER ACTIVE</span>}
        </div>
      </div>

      {/* Main Grid */}
      <div className="game-grid">
        
        {/* Left Side: Game Board & Player Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Opponent Card */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${playerColor === 'w' ? 'var(--secondary-neon)' : 'var(--primary-neon)'}` }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {playerColor === 'w' ? players.b?.username : players.w?.username} (Opponent)
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {!isMyTurn && gameState.status === 'active' && !opponentDisconnected ? 'Thinking...' : ''}
            </span>
          </div>

          {/* Chess Board */}
          <div className="chessboard-container">
            {/* Spell Targeting Prompt */}
            {spellCastActive === 'freeze' && (
              <div className="spell-casting-overlay">
                SELECT OPPONENT PIECE TO FREEZE
              </div>
            )}

            {rowIndices.map((r) =>
              colIndices.map((c) => {
                const piece = gameState.board[r][c];
                const isSelected = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;
                const isHighlighted = validMoves.some((m) => m.r === r && m.c === c);
                const isCapture = isHighlighted && piece && piece.color !== playerColor;
                
                const isLastMove = gameState.lastMove && (
                  (gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) ||
                  (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c)
                );

                const squareClass = (r + c) % 2 === 0 ? 'light' : 'dark';

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`square ${squareClass} ${isSelected ? 'selected' : ''} ${isHighlighted && !isCapture ? 'highlighted' : ''} ${isCapture ? 'capture-highlighted' : ''} ${isLastMove ? 'last-move' : ''} ${piece && piece.frozenTurns > 0 ? 'frozen' : ''}`}
                  >
                    {piece && (
                      <PieceSVG
                        type={piece.type}
                        color={piece.color}
                        className={`chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Player Card */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${playerColor === 'w' ? 'var(--primary-neon)' : 'var(--secondary-neon)'}` }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {playerColor === 'w' ? players.w?.username : players.b?.username} (You)
            </span>
            <span style={{ fontSize: '0.85rem', color: isMyTurn ? 'var(--primary-neon)' : 'var(--text-muted)', fontWeight: isMyTurn ? 'bold' : 'normal' }}>
              {opponentDisconnected ? 'Opponent Disconnected' : (isMyTurn && gameState.status === 'active' ? 'YOUR TURN' : 'Opponent\'s Turn')}
            </span>
          </div>
        </div>

        {/* Right Side: Spell Controls & Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          {/* Spells Panel */}
          <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ color: 'var(--primary-neon)', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>✨ Spell Book</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {/* Freeze Spell */}
              <button
                className={`spell-button ${spellCastActive === 'freeze' ? 'active' : ''}`}
                onClick={handleCastFreezeInitiate}
                disabled={!isMyTurn || gameState.spells[playerColor].freeze === 0 || gameState.status !== 'active' || opponentDisconnected}
              >
                <span className="spell-icon">❄️</span>
                <div className="spell-details">
                  <span className="spell-name">Frost Freeze</span>
                  <span className="spell-desc">Freeze an opponent's piece for 2 turns</span>
                </div>
                <span className={`spell-charge ${gameState.spells[playerColor].freeze === 0 ? 'depleted' : ''}`}>
                  {gameState.spells[playerColor].freeze}/1
                </span>
              </button>

              {/* Double Move Spell */}
              <button
                className="spell-button"
                onClick={() => handleCastSelfSpell('double_move')}
                disabled={!isMyTurn || gameState.spells[playerColor].double_move === 0 || gameState.status !== 'active' || opponentDisconnected || doubleMoveActive}
              >
                <span className="spell-icon">⚡</span>
                <div className="spell-details">
                  <span className="spell-name">Time Warp (Double Move)</span>
                  <span className="spell-desc">Take 2 moves in a row this turn</span>
                </div>
                <span className={`spell-charge ${gameState.spells[playerColor].double_move === 0 ? 'depleted' : ''}`}>
                  {gameState.spells[playerColor].double_move}/1
                </span>
              </button>

              {/* Move Changer Spell */}
              <button
                className="spell-button"
                onClick={() => handleCastSelfSpell('move_changer')}
                disabled={!isMyTurn || gameState.spells[playerColor].move_changer === 0 || gameState.status !== 'active' || opponentDisconnected || moveChangerActive}
              >
                <span className="spell-icon">✨</span>
                <div className="spell-details">
                  <span className="spell-name">Move Changer</span>
                  <span className="spell-desc">Bishops move like Kings, Queens like Knights (1 turn)</span>
                </div>
                <span className={`spell-charge ${gameState.spells[playerColor].move_changer === 0 ? 'depleted' : ''}`}>
                  {gameState.spells[playerColor].move_changer}/1
                </span>
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="glass-panel chat-container">
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ stroke: 'var(--primary-neon)' }} />
              <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-neon)' }}>Room Chat</h3>
            </div>
            
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <span className="chat-sender">{msg.sender}:</span>
                  <span>{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="chat-input-form">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" style={{ background: 'transparent', border: 'none', color: 'var(--primary-neon)' }}>
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Game Over / Opponent Disconnected Modal Dialog */}
      {(gameState.status !== 'active' || opponentDisconnected || opponentLeftLobby) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '3rem', maxWidth: '450px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '2px solid var(--primary-neon)' }}>
            <h2 className="title-gradient" style={{ fontSize: '2rem' }}>
              {opponentLeftLobby ? 'Opponent Left' : (opponentDisconnected ? 'Match Aborted' : 'Match Concluded')}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              {opponentLeftLobby ? (
                'Your opponent has left the room lobby.'
              ) : opponentDisconnected ? (
                'Your opponent disconnected from the match.'
              ) : gameState.status === 'checkmate' ? (
                gameState.winner === playerColor ? '🎉 Checkmate! You are victorious! 🎉' : '💀 Checkmate! You have been defeated. 💀'
              ) : (
                '🤝 Match ended in a Stalemate. 🤝'
              )}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%', marginTop: '1rem' }}>
              {!opponentDisconnected && !opponentLeftLobby && (
                <button
                  className="btn-primary"
                  onClick={handleRematchRequest}
                  disabled={rematchRequested[playerColor]}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={16} />
                  {rematchRequested[playerColor] ? 'Waiting...' : 'Request Rematch'}
                </button>
              )}
              <button className="btn-secondary" onClick={handleLeaveGame}>
                Return to Lobby
              </button>
            </div>
            
            {!opponentDisconnected && !opponentLeftLobby && rematchRequested[playerColor === 'w' ? 'b' : 'w'] && (
              <p style={{ fontSize: '0.85rem', color: 'var(--primary-neon)' }}>Opponent has requested a rematch!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
