import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { getLegalMoves } from '../chessLogic';
import PieceSVG from './ChessPieces';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import BattleLog from './BattleLog';
import ChatPanel from './ChatPanel';
import PromotionModal from './PromotionModal';
import DrawOfferModal from './DrawOfferModal';
import ConcludedModal from './ConcludedModal';
import SpellBook from './SpellBook';
import { playMoveSound, playCaptureSound, playSpellSound, playGameOverSound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

const GameRoom = ({ roomId, playerColor, onLeave }) => {
  const { user } = useAuth();
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
  const [drawOfferedByMe, setDrawOfferedByMe] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);

  const [promotionPending, setPromotionPending] = useState(null);
  const [clocks, setClocks] = useState({ w: 600, b: 600 });

  const isFirstLoadRef = useRef(true);
  const prevHistoryLengthRef = useRef(0);
  const prevStatusRef = useRef('active');

  useEffect(() => {
    if (gameState && gameState.clocks) {
      setClocks(gameState.clocks);
    }
  }, [gameState]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'active' || opponentDisconnected || opponentLeftLobby) return;

    const activeColor = gameState.turn;

    const interval = setInterval(() => {
      setClocks(prev => {
        const nextClocks = {
          ...prev,
          [activeColor]: Math.max(0, prev[activeColor] - 1)
        };
        return nextClocks;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.turn, gameState?.status, opponentDisconnected, opponentLeftLobby]);

  // Audio chimes synchronizer hook
  useEffect(() => {
    if (!gameState) return;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevHistoryLengthRef.current = gameState.history ? gameState.history.length : 0;
      prevStatusRef.current = gameState.status;
      return;
    }

    // Play Game Over chords on state transition
    if (gameState.status !== 'active' && prevStatusRef.current === 'active') {
      if (gameState.status === 'checkmate' || gameState.status === 'timeout') {
        const outcome = gameState.winner === playerColor ? 'win' : 'lose';
        playGameOverSound(outcome);
      } else if (gameState.status === 'draw' || gameState.status === 'draw-agreement' || gameState.status === 'stalemate') {
        playGameOverSound('draw');
      }
    }
    prevStatusRef.current = gameState.status;

    // Play Move, Capture, or Spell sounds when history grows
    if (gameState.history && gameState.history.length > prevHistoryLengthRef.current) {
      const lastAction = gameState.history[gameState.history.length - 1];
      if (lastAction.type === 'spell') {
        playSpellSound(lastAction.spellId);
      } else if (lastAction.type === 'move') {
        if (lastAction.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }
      }
    }
    prevHistoryLengthRef.current = gameState.history ? gameState.history.length : 0;
  }, [gameState, playerColor]);

  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getChessNotation = (r, c) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rank = 8 - r;
    return `${files[c]}${rank}`;
  };

  useEffect(() => {
    const handleConnect = () => {
      setSpellAlert({ message: 'Connected to game server!', color: 'w' });
      setTimeout(() => setSpellAlert(null), 2500);
      if (user && user.id) {
        socket.emit('rejoin-room', { roomId, userId: user.id });
      } else {
        socket.emit('get-room-state', { roomId });
      }
    };

    const handleDisconnect = () => {
      setSpellAlert({ message: 'You disconnected. Trying to reconnect...', color: 'error' });
    };

    if (socket.connected) {
      if (user && user.id) {
        socket.emit('rejoin-room', { roomId, userId: user.id });
      } else {
        socket.emit('get-room-state', { roomId });
      }
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('room-state', ({ players: p, gameState: gs }) => {
      if (p) setPlayers(p);
      if (gs) setGameState(gs);
    });

    // Sockets listeners
    socket.on('game-start', ({ players: p, gameState: gs }) => {
      setPlayers(p);
      setGameState(gs);
      setRematchRequested({ w: false, b: false });
      setOpponentDisconnected(false);
      setOpponentLeftLobby(false);
      setDrawOfferedByMe(false);
      setDrawOfferReceived(false);
    });

    socket.on('draw-offered', () => {
      setDrawOfferReceived(true);
    });

    socket.on('draw-declined', () => {
      setSpellAlert({ message: 'Opponent declined your draw offer.', color: 'error' });
      setTimeout(() => setSpellAlert(null), 4000);
      setDrawOfferedByMe(false);
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

    socket.on('opponent-disconnected', ({ message }) => {
      setSpellAlert({ message: message || 'Opponent disconnected. Waiting 30s for reconnection...', color: 'error' });
    });

    socket.on('opponent-reconnected', ({ message }) => {
      setSpellAlert({ message: message || 'Opponent reconnected!', color: 'w' });
      setTimeout(() => setSpellAlert(null), 3000);
    });

    socket.on('game-over', ({ winner, status, message }) => {
      if (status === 'aborted') {
        setOpponentDisconnected(true);
      }
    });

    socket.on('opponent-left-lobby', () => {
      setOpponentLeftLobby(true);
    });

    socket.on('error-msg', ({ message }) => {
      setSpellAlert({ message, color: 'error' });
      setTimeout(() => setSpellAlert(null), 4000);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room-state');
      socket.off('game-start');
      socket.off('state-updated');
      socket.off('spell-cast-alert');
      socket.off('chat-message');
      socket.off('rematch-requested');
      socket.off('opponent-disconnected');
      socket.off('opponent-reconnected');
      socket.off('game-over');
      socket.off('opponent-left-lobby');
      socket.off('error-msg');
      socket.off('draw-offered');
      socket.off('draw-declined');
    };
  }, [roomId, user?.id]);

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
      const movingPiece = gameState.board[selectedSquare.r][selectedSquare.c];
      const isPawnPromotion = movingPiece && movingPiece.type === 'p' && (r === 0 || r === 7);
      if (isPawnPromotion) {
        setPromotionPending({ from: selectedSquare, to: { r, c } });
      } else {
        socket.emit('make-move', { roomId, from: selectedSquare, to: { r, c } });
      }
      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handleDragStart = (e, r, c) => {
    if (!gameState || gameState.status !== 'active' || opponentDisconnected) return;
    const isOurTurn = gameState.turn === playerColor;
    if (!isOurTurn) {
      e.preventDefault();
      return;
    }

    const piece = gameState.board[r][c];
    if (!piece || piece.color !== playerColor || piece.frozenTurns > 0) {
      e.preventDefault();
      return;
    }

    setSelectedSquare({ r, c });
    const moves = getLegalMoves(gameState, r, c);
    setValidMoves(moves);

    e.dataTransfer.setData('text/plain', JSON.stringify({ r, c }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, r, c) => {
    const isMoveValid = validMoves.some((m) => m.r === r && m.c === c);
    if (isMoveValid) {
      e.preventDefault();
    }
  };

  const handleDrop = (e, r, c) => {
    e.preventDefault();
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const isMoveValid = validMoves.some((m) => m.r === r && m.c === c);
      
      if (dragData && isMoveValid) {
        const movingPiece = gameState.board[dragData.r][dragData.c];
        const isPawnPromotion = movingPiece && movingPiece.type === 'p' && (r === 0 || r === 7);
        if (isPawnPromotion) {
          setPromotionPending({ from: dragData, to: { r, c } });
        } else {
          socket.emit('make-move', { roomId, from: dragData, to: { r, c } });
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
    
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleDragEnd = () => {
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleCastSelfSpell = (spellId) => {
    if (!gameState || gameState.status !== 'active' || gameState.turn !== playerColor) return;
    socket.emit('cast-spell', { roomId, spellId });
  };

  const handleSelectPromotion = (type) => {
    if (!promotionPending) return;
    socket.emit('make-move', {
      roomId,
      from: promotionPending.from,
      to: promotionPending.to,
      promotion: type
    });
    setPromotionPending(null);
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

  const handleOfferDraw = () => {
    if (!gameState || gameState.status !== 'active') return;
    socket.emit('offer-draw', { roomId });
    setDrawOfferedByMe(true);
  };

  const handleRespondDraw = (accept) => {
    socket.emit('respond-draw', { roomId, accept });
    setDrawOfferReceived(false);
  };

  // Render variables
  if (!gameState || !players.w || !players.b) {
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

  const getConcludedTitle = () => {
    if (opponentLeftLobby) return 'Opponent Left';
    if (opponentDisconnected) return 'Match Aborted';
    
    if (gameState.status === 'checkmate' || gameState.status === 'timeout') {
      return gameState.winner === playerColor ? 'YOU WON' : 'YOU LOST';
    }
    
    if (gameState.status === 'stalemate' || gameState.status === 'draw' || gameState.status === 'draw-agreement') {
      return 'MATCH DRAWN';
    }
    
    return 'Match Concluded';
  };

  const getConcludedClass = () => {
    if (opponentLeftLobby || opponentDisconnected) return 'title-gradient';
    
    if (gameState.status === 'checkmate' || gameState.status === 'timeout') {
      return gameState.winner === playerColor ? 'win-gradient' : 'lose-gradient';
    }
    
    return 'title-gradient';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Alert Banner for Spell Casts */}
      {spellAlert && (
        <div style={{
          position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(21, 28, 38, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--text-white)',
          padding: '16px 28px', 
          borderRadius: '12px', 
          fontWeight: '600', 
          zIndex: 1000,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
          border: `2px solid ${
            spellAlert.color === 'w' 
              ? 'var(--primary-neon)' 
              : (spellAlert.color === 'error' 
                ? 'var(--accent-pink)' 
                : 'var(--changer-purple)')
          }`,
          borderLeftWidth: '8px',
          fontFamily: 'var(--font-title)',
          fontSize: '1.05rem', 
          pointerEvents: 'none', 
          animation: 'freeze-shiver 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ 
            fontSize: '1.3rem', 
            color: spellAlert.color === 'w' 
              ? 'var(--primary-neon)' 
              : (spellAlert.color === 'error' 
                ? 'var(--accent-pink)' 
                : 'var(--changer-purple)')
          }}>
            {spellAlert.color === 'error' ? '⚠️' : '✨'}
          </span> 
          <span>{spellAlert.message}</span>
        </div>
      )}

      {/* Top controls and game header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleLeaveGame} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Exit Game
          </button>
          {gameState.status === 'active' && !opponentDisconnected && (
            <button
              className="btn-secondary"
              onClick={handleOfferDraw}
              disabled={drawOfferedByMe}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(255,255,255,0.1)' }}
            >
               {drawOfferedByMe ? 'Draw Offered' : 'Offer Draw'}
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ROOM CODE: </span>
          <span style={{ fontWeight: 'bold', color: 'var(--primary-neon)' }}>
            {roomId}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {!isMyTurn && gameState.status === 'active' && !opponentDisconnected && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thinking...</span>}
              {gameState?.clocks && (
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: !isMyTurn ? 'var(--primary-neon)' : 'var(--text-muted)' }}>
                  {formatTime(clocks[playerColor === 'w' ? 'b' : 'w'])}
                </span>
              )}
            </div>
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
                    onDragOver={(e) => handleDragOver(e, r, c)}
                    onDrop={(e) => handleDrop(e, r, c)}
                    className={`square ${squareClass} ${isSelected ? 'selected' : ''} ${isHighlighted && !isCapture ? 'highlighted' : ''} ${isCapture ? 'capture-highlighted' : ''} ${isLastMove ? 'last-move' : ''} ${piece && piece.frozenTurns > 0 ? 'frozen' : ''}`}
                  >
                    {piece && (
                      <div
                        draggable={isMyTurn && piece.color === playerColor && piece.frozenTurns === 0 && spellCastActive !== 'freeze'}
                        onDragStart={(e) => handleDragStart(e, r, c)}
                        onDragEnd={handleDragEnd}
                        style={{
                          width: '80%',
                          height: '80%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: (isMyTurn && piece.color === playerColor && piece.frozenTurns === 0) ? 'grab' : 'default'
                        }}
                      >
                        <PieceSVG
                          type={piece.type}
                          color={piece.color}
                          className={`chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}
                          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                        />
                      </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.85rem', color: isMyTurn ? 'var(--primary-neon)' : 'var(--text-muted)', fontWeight: isMyTurn ? 'bold' : 'normal' }}>
                {opponentDisconnected ? 'Opponent Disconnected' : (isMyTurn && gameState.status === 'active' ? 'YOUR TURN' : 'Opponent\'s Turn')}
              </span>
              {gameState?.clocks && (
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: isMyTurn ? 'var(--primary-neon)' : 'var(--text-muted)' }}>
                  {formatTime(clocks[playerColor])}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Spell Controls & Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          <SpellBook
            spells={gameState.spells[playerColor]}
            playerColor={playerColor}
            isMyTurn={isMyTurn}
            spellCastActive={spellCastActive}
            moveChangerActive={moveChangerActive}
            doubleMoveActive={doubleMoveActive}
            gameState={gameState}
            opponentDisconnected={opponentDisconnected}
            onCastFreezeInitiate={handleCastFreezeInitiate}
            onCastSelfSpell={handleCastSelfSpell}
          />

          <BattleLog
            history={gameState.history}
            getChessNotation={getChessNotation}
          />

          <ChatPanel
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSubmit={handleSendChat}
          />

        </div>
      </div>

      <ConcludedModal
        isOpen={gameState.status !== 'active' || opponentDisconnected || opponentLeftLobby}
        gameState={gameState}
        playerColor={playerColor}
        opponentLeftLobby={opponentLeftLobby}
        opponentDisconnected={opponentDisconnected}
        rematchRequested={rematchRequested}
        onRematch={handleRematchRequest}
        onLeave={handleLeaveGame}
        getConcludedTitle={getConcludedTitle}
        getConcludedClass={getConcludedClass}
      />

      <PromotionModal
        promotionPending={promotionPending}
        onSelect={handleSelectPromotion}
        onCancel={() => setPromotionPending(null)}
      />

      <DrawOfferModal
        isOpen={drawOfferReceived}
        onAccept={() => handleRespondDraw(true)}
        onDecline={() => handleRespondDraw(false)}
      />
    </div>
  );
};

export default GameRoom;
