const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'spellchess.db');
const db = new sqlite3.Database(dbPath);

// Helper functions wrapping sqlite3 in promises
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Initialize database schema
const initDb = async () => {
  try {
    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create matches table
    await run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        white_player_id INTEGER NOT NULL,
        black_player_id INTEGER NOT NULL,
        winner_id INTEGER,
        moves_log TEXT,
        status TEXT NOT NULL,
        ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (white_player_id) REFERENCES users (id),
        FOREIGN KEY (black_player_id) REFERENCES users (id),
        FOREIGN KEY (winner_id) REFERENCES users (id)
      )
    `);

    console.log('SQLite database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    process.exit(1);
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
