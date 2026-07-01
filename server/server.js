require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDb, run } = require('./db');
const { router: authRouter } = require('./auth');
const chessLogic = require('./chessLogic');

const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// General rate limiter: max 1000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth (login/register): max 150 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use(globalLimiter);
app.use('/api/auth', authLimiter);

// Mount auth API routes
app.use('/api/auth', authRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Active game rooms stored in-memory
// Room ID -> { roomId, players: { w, b }, gameState, rematch: { w, b } }
const rooms = new Map();

// Helper to generate a unique room code
const generateRoomId = () => {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
};

// Clean up rooms on player disconnect
const handleUserDisconnect = (socket) => {
  for (const [roomId, room] of rooms.entries()) {
    let disconnectedColor = null;

    if (room.players.w && room.players.w.socketId === socket.id) {
      disconnectedColor = 'w';
    } else if (room.players.b && room.players.b.socketId === socket.id) {
      disconnectedColor = 'b';
    }

    if (disconnectedColor) {
      // Notify the opponent
      const opponentColor = disconnectedColor === 'w' ? 'b' : 'w';
      const opponent = room.players[opponentColor];

      if (opponent) {
        const isGameActive = room.gameState && room.gameState.status === 'active';

        if (isGameActive) {
          io.to(opponent.socketId).emit('opponent-disconnected', {
            message: 'Your opponent disconnected. You win by default or can leave.'
          });

          room.gameState.status = 'aborted';
          room.gameState.winner = opponentColor;
          
          // Save to match history asynchronously
          saveMatchToDb(roomId, room, opponent.userId).catch(err => 
            console.error('Error saving aborted match to DB:', err)
          );
        } else {
          io.to(opponent.socketId).emit('opponent-left-lobby', {
            message: 'Your opponent has left the lobby.'
          });
        }
      }

      // Remove the room immediately or keep it for spectator sync
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted because player ${disconnectedColor} disconnected.`);
    }
  }
};

// Async helper to save match results to the SQLite DB
const saveMatchToDb = async (roomId, room, winnerUserId = null) => {
  try {
    const whitePlayerId = room.players.w?.userId;
    const blackPlayerId = room.players.b?.userId;
    
    // Safety check
    if (!whitePlayerId || !blackPlayerId) {
      console.warn(`Cannot save match ${roomId} to DB because player IDs are incomplete.`);
      return;
    }

    let winnerId = null;

    if (winnerUserId) {
      winnerId = winnerUserId;
    } else if (room.gameState.winner === 'w') {
      winnerId = whitePlayerId;
    } else if (room.gameState.winner === 'b') {
      winnerId = blackPlayerId;
    }

    const movesLogJson = JSON.stringify({
      status: room.gameState.status,
      winner: room.gameState.winner,
      history: room.gameState.history || []
    });

    await run(
      `INSERT OR REPLACE INTO matches (id, white_player_id, black_player_id, winner_id, moves_log, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        whitePlayerId,
        blackPlayerId,
        winnerId,
        movesLogJson,
        room.gameState.status === 'checkmate' ? 'completed' : room.gameState.status
      ]
    );
    console.log(`Match ${roomId} results saved to database.`);
  } catch (err) {
    console.error('Failed to save match to DB:', err);
  }
};

const startTimeoutChecker = (roomId) => {
  const room = rooms.get(roomId);
  if (!room || room.gameState.status !== 'active') return;

  if (room.timeoutId) clearTimeout(room.timeoutId);

  const turn = room.gameState.turn;
  const timeRemainingMs = room.clocks[turn] * 1000;

  room.timeoutId = setTimeout(() => {
    handleTimeout(roomId, turn);
  }, timeRemainingMs);
};

const handleTimeout = (roomId, color) => {
  const room = rooms.get(roomId);
  if (!room || room.gameState.status !== 'active') return;

  const opponentColor = color === 'w' ? 'b' : 'w';
  
  room.gameState.status = 'timeout';
  room.gameState.winner = opponentColor;

  saveMatchToDb(roomId, room).catch(err => console.error(err));

  io.to(roomId).emit('state-updated', room.gameState);
  io.to(roomId).emit('game-over', {
    winner: opponentColor,
    status: 'timeout'
  });

  if (room.timeoutId) {
    clearTimeout(room.timeoutId);
    room.timeoutId = null;
  }
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Event: Get room state
  socket.on('get-room-state', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit('room-state', {
      players: {
        w: room.players.w ? { username: room.players.w.username, id: room.players.w.userId } : null,
        b: room.players.b ? { username: room.players.b.username, id: room.players.b.userId } : null
      },
      gameState: room.gameState
    });
  });

  // Event: Create room
  socket.on('create-room', ({ userId, username, timeLimit, preferredColor }) => {
    const roomId = generateRoomId();
    
    // Choose color
    let color = 'w';
    if (preferredColor === 'b') color = 'b';
    else if (preferredColor === 'random') color = Math.random() < 0.5 ? 'w' : 'b';

    const room = {
      roomId,
      timeLimit: timeLimit || 10,
      players: {
        w: color === 'w' ? { userId, username, socketId: socket.id } : null,
        b: color === 'b' ? { userId, username, socketId: socket.id } : null
      },
      gameState: chessLogic.createInitialGameState(),
      rematch: { w: false, b: false },
      clocks: { w: (timeLimit || 10) * 60, b: (timeLimit || 10) * 60 },
      lastTurnTimestamp: null,
      timeoutId: null
    };

    // Attach clock details to gameState so it automatically propagates to client
    room.gameState.clocks = { ...room.clocks };
    room.gameState.timeLimit = room.timeLimit;

    rooms.set(roomId, room);
    socket.join(roomId);

    socket.emit('room-created', { roomId, color });
    console.log(`Room ${roomId} created by ${username} (Color: ${color}, Time: ${room.timeLimit}m)`);
  });

  // Event: Join room
  socket.on('join-room', ({ roomId, userId, username }) => {
    const room = rooms.get(roomId);

    if (!room) {
      return socket.emit('join-error', { message: 'Room not found.' });
    }

    if (room.players.w && room.players.b) {
      return socket.emit('join-error', { message: 'Room is full.' });
    }

    // Connect to the empty slot
    let color = 'b';
    if (!room.players.w) {
      color = 'w';
      room.players.w = { userId, username, socketId: socket.id };
    } else {
      room.players.b = { userId, username, socketId: socket.id };
    }

    socket.join(roomId);
    socket.emit('room-joined', { roomId, color });

    // Start game if both players joined
    if (room.players.w && room.players.b) {
      room.lastTurnTimestamp = Date.now();
      
      // Start timeout checker for current turn (White goes first)
      startTimeoutChecker(roomId);

      io.to(roomId).emit('game-start', {
        roomId,
        players: {
          w: { username: room.players.w.username, id: room.players.w.userId },
          b: { username: room.players.b.username, id: room.players.b.userId }
        },
        gameState: room.gameState
      });
      console.log(`Room ${roomId} fully occupied. Game starting.`);
    }
  });

  // Event: Make a move
  socket.on('make-move', ({ roomId, from, to, promotion }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error-msg', { message: 'Room not found.' });

    const playerColor = room.players.w?.socketId === socket.id ? 'w' : (room.players.b?.socketId === socket.id ? 'b' : null);

    if (!playerColor) {
      return socket.emit('error-msg', { message: 'You are not a player in this room.' });
    }

    if (room.gameState.turn !== playerColor) {
      return socket.emit('error-msg', { message: "It's not your turn." });
    }

    // Deduct elapsed time
    if (room.lastTurnTimestamp) {
      const elapsed = Math.floor((Date.now() - room.lastTurnTimestamp) / 1000);
      room.clocks[playerColor] = Math.max(0, room.clocks[playerColor] - elapsed);
      room.gameState.clocks = { ...room.clocks };
    }

    const fromPiece = room.gameState.board[from.r][from.c];

    const success = chessLogic.makeMove(room.gameState, from, to, promotion);

    if (!success) {
      return socket.emit('error-msg', { message: 'Invalid chess move.' });
    }

    // Add move to history log
    if (!room.gameState.history) room.gameState.history = [];
    room.gameState.history.push({
      type: 'move',
      player: playerColor,
      fromPiece: fromPiece ? { type: fromPiece.type } : null,
      from,
      to,
      timestamp: new Date()
    });

    // If game concluded, clear timeout, otherwise reset clock timestamp and start next timeout checker
    if (room.gameState.status !== 'active') {
      if (room.timeoutId) {
        clearTimeout(room.timeoutId);
        room.timeoutId = null;
      }
      saveMatchToDb(roomId, room).catch(err => console.error(err));
      io.to(roomId).emit('state-updated', room.gameState);
      io.to(roomId).emit('game-over', {
        winner: room.gameState.winner,
        status: room.gameState.status
      });
    } else {
      room.lastTurnTimestamp = Date.now();
      startTimeoutChecker(roomId);
      io.to(roomId).emit('state-updated', room.gameState);
    }
  });

  // Event: Cast spell
  socket.on('cast-spell', ({ roomId, spellId, targetPos }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error-msg', { message: 'Room not found.' });

    const playerColor = room.players.w?.socketId === socket.id ? 'w' : (room.players.b?.socketId === socket.id ? 'b' : null);

    if (!playerColor) {
      return socket.emit('error-msg', { message: 'You are not a player in this room.' });
    }

    if (room.gameState.turn !== playerColor) {
      return socket.emit('error-msg', { message: "It's not your turn." });
    }

    // Deduct elapsed time
    if (room.lastTurnTimestamp) {
      const elapsed = Math.floor((Date.now() - room.lastTurnTimestamp) / 1000);
      room.clocks[playerColor] = Math.max(0, room.clocks[playerColor] - elapsed);
      room.gameState.clocks = { ...room.clocks };
      room.lastTurnTimestamp = Date.now();
      startTimeoutChecker(roomId); // Restart timeout checker for the remaining time
    }

    const result = chessLogic.castSpell(room.gameState, spellId, targetPos);

    if (!result.success) {
      return socket.emit('error-msg', { message: result.error });
    }

    // Add spell to history log
    if (!room.gameState.history) room.gameState.history = [];
    room.gameState.history.push({
      type: 'spell',
      player: playerColor,
      spellId,
      targetPos,
      timestamp: new Date()
    });

    // Broadcast updated state and notification text
    io.to(roomId).emit('state-updated', room.gameState);
    
    let spellNameText = spellId === 'freeze' ? 'Freeze' : (spellId === 'double_move' ? 'Double Move' : 'Move Changer');
    io.to(roomId).emit('spell-cast-alert', {
      player: room.players[playerColor].username,
      spell: spellNameText,
      color: playerColor
    });
  });

  // Event: Chat message
  socket.on('send-chat', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.players.w?.socketId === socket.id ? room.players.w.username : (room.players.b?.socketId === socket.id ? room.players.b.username : 'Spectator');
    io.to(roomId).emit('chat-message', {
      sender,
      message,
      timestamp: new Date()
    });
  });

  // Event: Rematch request
  socket.on('request-rematch', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const playerColor = room.players.w?.socketId === socket.id ? 'w' : (room.players.b?.socketId === socket.id ? 'b' : null);
    if (!playerColor) return;

    room.rematch[playerColor] = true;
    
    // Broadcast who requested rematch
    io.to(roomId).emit('rematch-requested', { color: playerColor });

    // If both players accepted, restart the match
    if (room.rematch.w && room.rematch.b) {
      room.gameState = chessLogic.createInitialGameState();
      room.rematch = { w: false, b: false };
      room.clocks = { w: room.timeLimit * 60, b: room.timeLimit * 60 };
      room.gameState.clocks = { ...room.clocks };
      room.gameState.timeLimit = room.timeLimit;
      room.lastTurnTimestamp = Date.now();
      startTimeoutChecker(roomId);

      io.to(roomId).emit('game-start', {
        roomId,
        players: {
          w: { username: room.players.w.username, id: room.players.w.userId },
          b: { username: room.players.b.username, id: room.players.b.userId }
        },
        gameState: room.gameState
      });
      console.log(`Rematch started in room ${roomId}.`);
    }
  });

  // Event: Leave game / Exit room
  socket.on('leave-room', ({ roomId }) => {
    // Clear room timeout if it was deleted
    const room = rooms.get(roomId);
    if (room && room.timeoutId) {
      clearTimeout(room.timeoutId);
      room.timeoutId = null;
    }
    socket.leave(roomId);
    handleUserDisconnect(socket);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    handleUserDisconnect(socket);
  });
});

const PORT = process.env.PORT || 5000;

// Start server after database is initialized
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Spell Chess server running on port ${PORT}`);
  });
});
