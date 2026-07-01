require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();

// Fail fast if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Please check your .env file.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and dashes (no spaces or special characters).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const result = await db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username.trim(), passwordHash]
    );

    const token = jwt.sign({ userId: result.lastID, username: username.trim() }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.lastID, username: username.trim() }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile & Match History endpoint
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await db.get('SELECT id, username, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch user matches
    const matches = await db.all(
      `SELECT m.*, 
              u1.username as white_username, 
              u2.username as black_username, 
              u3.username as winner_username
       FROM matches m
       JOIN users u1 ON m.white_player_id = u1.id
       JOIN users u2 ON m.black_player_id = u2.id
       LEFT JOIN users u3 ON m.winner_id = u3.id
       WHERE m.white_player_id = ? OR m.black_player_id = ?
       ORDER BY m.ended_at DESC`,
      [userId, userId]
    );

    // Calculate stats
    let wins = 0;
    let losses = 0;
    let draws = 0;

    matches.forEach(match => {
      if (match.winner_id === userId) {
        wins++;
      } else if (match.winner_id === null) {
        draws++;
      } else {
        losses++;
      }
    });

    res.json({
      user,
      stats: {
        totalMatches: matches.length,
        wins,
        losses,
        draws,
        winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0
      },
      matches: matches.map(m => ({
        id: m.id,
        whitePlayer: m.white_username,
        blackPlayer: m.black_username,
        winner: m.winner_username || (m.status === 'completed' || m.status === 'draw' ? 'Draw' : 'Aborted'),
        status: m.status,
        endedAt: m.ended_at
      }))
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = {
  router,
  authenticateToken
};
