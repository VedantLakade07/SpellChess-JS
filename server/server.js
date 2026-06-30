require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDb, run } = require('./db');
const { router: authRouter } = require('./auth');
const chessLogic = require('./chessLogic');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

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
    const whitePlayerId = room.players.w.userId;
    const blackPlayerId = room.players.b.userId;
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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Event: Create room
  socket.on('create-room', ({ userId, username }) => {
    const roomId = generateRoomId();
    
    const room = {
      roomId,
      players: {
        w: { userId, username, socketId: socket.id },
        b: null
      },
      gameState: chessLogic.createInitialGameState(),
      rematch: { w: false, b: false }
    };

    rooms.set(roomId, room);
    socket.join(roomId);

    socket.emit('room-created', { roomId, color: 'w' });
    console.log(`Room ${roomId} created by ${username} (White)`);
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

    // Connect as Black if White is taken, otherwise Connect as White
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
      io.to(roomId).emit('game-start', {
        roomId,
        players: {
          w: { username: room.players.w.username, id: room.players.w.userId },
          b: { username: room.players.b.username, id: room.players.b.userId }
        },
        gameState: room.gameState
      });
    }
  });

  // Event: Request game state (for synchronization)
  socket.on('request-game-state', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    socket.emit('game-state-sync', {
      players: {
        w: room.players.w ? { username: room.players.w.username, id: room.players.w.userId } : null,
        b: room.players.b ? { username: room.players.b.username, id: room.players.b.userId } : null
      },
      gameState: room.players.w && room.players.b ? room.gameState : null
    });
  });

  // Event: Make a move
  socket.on('make-move', ({ roomId, from, to }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error-msg', { message: 'Room not found.' });

    const playerColor = room.players.w?.socketId === socket.id ? 'w' : (room.players.b?.socketId === socket.id ? 'b' : null);

    if (!playerColor) {
      return socket.emit('error-msg', { message: 'You are not a player in this room.' });
    }

    if (room.gameState.turn !== playerColor) {
      return socket.emit('error-msg', { message: "It's not your turn." });
    }

    const success = chessLogic.makeMove(room.gameState, from, to);

    if (!success) {
      return socket.emit('error-msg', { message: 'Invalid chess move.' });
    }

    // Add move to history log
    if (!room.gameState.history) room.gameState.history = [];
    room.gameState.history.push({
      type: 'move',
      player: playerColor,
      from,
      to,
      timestamp: new Date()
    });

    // Broadcast updated state
    io.to(roomId).emit('state-updated', room.gameState);

    // Save match if complete
    if (room.gameState.status === 'checkmate' || room.gameState.status === 'stalemate') {
      saveMatchToDb(roomId, room).catch(err => console.error(err));
      io.to(roomId).emit('game-over', {
        winner: room.gameState.winner,
        status: room.gameState.status
      });
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
