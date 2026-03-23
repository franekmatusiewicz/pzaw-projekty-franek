const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'app.db');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Blad przy polaczeniu z baza danych:', err);
    process.exit(1);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

async function seed() {
  await run('DROP TABLE IF EXISTS sessions');
  await run('DROP TABLE IF EXISTS tasks');
  await run('DROP TABLE IF EXISTS users');

  await run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const adminHash = hashPassword(ADMIN_PASSWORD);
  const userHash = hashPassword('haslo123');
  const secondUserHash = hashPassword('sekret123');

  const admin = await run(
    'INSERT INTO users (login, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
    [ADMIN_LOGIN, adminHash.hash, adminHash.salt, 'admin']
  );
  const ola = await run(
    'INSERT INTO users (login, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
    ['ola', userHash.hash, userHash.salt, 'user']
  );
  const jan = await run(
    'INSERT INTO users (login, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
    ['jan', secondUserHash.hash, secondUserHash.salt, 'user']
  );

  await run(
    'INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, ?)',
    [admin.lastID, 'Sprawdzic panel administracyjny', 'Administrator moze edytowac wszystkie zadania.', 0]
  );
  await run(
    'INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, ?)',
    [ola.lastID, 'Oddac projekt z PZAW', 'Przygotowac README i upewnic sie, ze seed dziala.', 0]
  );
  await run(
    'INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, ?)',
    [jan.lastID, 'Przetestowac logowanie', 'Sprawdzic rejestracje, logowanie i wylogowanie.', 1]
  );

  console.log('Baza danych zostala przygotowana.');
  console.log(`Admin: ${ADMIN_LOGIN} / ${ADMIN_PASSWORD}`);
  console.log('Uzytkownik testowy: ola / haslo123');
  console.log('Drugi uzytkownik: jan / sekret123');
}

seed()
  .catch((err) => {
    console.error('Blad podczas seedowania:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
