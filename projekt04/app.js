const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8000;
const DB_PATH = path.join(__dirname, 'app.db');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TTL_DAYS = 7;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

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

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function parseCookies(cookieHeader = '') {
  const cookies = {};
  cookieHeader.split(';').forEach((part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) {
      return;
    }
    cookies[rawName] = decodeURIComponent(rawValue.join('='));
  });
  return cookies;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function toSqliteDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function addDays(days) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return toSqliteDate(expiresAt);
}

function setSessionCookie(res, sessionId) {
  res.setHeader('Set-Cookie', `sid=${sessionId}; HttpOnly; Path=/; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
}

async function ensureAdminUser() {
  const existingAdmin = await get('SELECT id FROM users WHERE login = ?', [ADMIN_LOGIN]);
  if (existingAdmin) {
    return;
  }

  const { salt, hash } = hashPassword(ADMIN_PASSWORD);
  await run(
    'INSERT INTO users (login, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
    [ADMIN_LOGIN, hash, salt, 'admin']
  );
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
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

  await run('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
  await ensureAdminUser();
}

async function createSession(res, userId) {
  const sessionId = createSessionToken();
  await run(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    [sessionId, userId, addDays(SESSION_TTL_DAYS)]
  );
  setSessionCookie(res, sessionId);
}

function buildTaskFormData(task = {}) {
  return {
    id: task.id || null,
    title: task.title || '',
    description: task.description || '',
    completed: Number(task.completed) || 0
  };
}

function canManageTask(user, task) {
  return Boolean(user) && (user.role === 'admin' || user.id === task.user_id);
}

app.use(async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    if (!cookies.sid) {
      req.currentUser = null;
      res.locals.currentUser = null;
      return next();
    }

    const session = await get(
      `
        SELECT sessions.id, sessions.expires_at, users.id AS user_id, users.login, users.role
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.id = ?
      `,
      [cookies.sid]
    );

    if (!session || new Date(session.expires_at) <= new Date()) {
      if (session) {
        await run('DELETE FROM sessions WHERE id = ?', [cookies.sid]);
      }
      req.currentUser = null;
      res.locals.currentUser = null;
      clearSessionCookie(res);
      return next();
    }

    req.currentUser = {
      id: session.user_id,
      login: session.login,
      role: session.role
    };
    res.locals.currentUser = req.currentUser;
    next();
  } catch (err) {
    next(err);
  }
});

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect('/login');
  }
  next();
}

app.get('/', async (req, res, next) => {
  try {
    const tasks = await all(
      `
        SELECT tasks.*, users.login AS owner_login
        FROM tasks
        JOIN users ON users.id = tasks.user_id
        ORDER BY tasks.created_at DESC
      `
    );
    res.render('index', { tasks });
  } catch (err) {
    next(err);
  }
});

app.get('/register', (req, res) => {
  res.render('register', { error: null, form: { login: '' } });
});

app.post('/register', async (req, res, next) => {
  const login = (req.body.login || '').trim();
  const password = req.body.password || '';
  const confirmPassword = req.body.confirmPassword || '';

  if (login.length < 3) {
    return res.status(400).render('register', {
      error: 'Login musi miec co najmniej 3 znaki.',
      form: { login }
    });
  }

  if (password.length < 6) {
    return res.status(400).render('register', {
      error: 'Haslo musi miec co najmniej 6 znakow.',
      form: { login }
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).render('register', {
      error: 'Hasla musza byc identyczne.',
      form: { login }
    });
  }

  try {
    const existingUser = await get('SELECT id FROM users WHERE login = ?', [login]);
    if (existingUser) {
      return res.status(400).render('register', {
        error: 'Taki login jest juz zajety.',
        form: { login }
      });
    }

    const { salt, hash } = hashPassword(password);
    const result = await run(
      'INSERT INTO users (login, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
      [login, hash, salt, 'user']
    );
    await createSession(res, result.lastID);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, form: { login: '' } });
});

app.post('/login', async (req, res, next) => {
  const login = (req.body.login || '').trim();
  const password = req.body.password || '';

  try {
    const user = await get('SELECT * FROM users WHERE login = ?', [login]);
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return res.status(400).render('login', {
        error: 'Niepoprawny login lub haslo.',
        form: { login }
      });
    }

    await createSession(res, user.id);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.post('/logout', async (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  try {
    if (cookies.sid) {
      await run('DELETE FROM sessions WHERE id = ?', [cookies.sid]);
    }
    clearSessionCookie(res);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.get('/tasks/new', requireAuth, (req, res) => {
  res.render('task-form', {
    pageTitle: 'Nowe zadanie',
    action: '/tasks/new',
    submitLabel: 'Dodaj zadanie',
    error: null,
    task: buildTaskFormData()
  });
});

app.post('/tasks/new', requireAuth, async (req, res, next) => {
  const task = buildTaskFormData(req.body);

  if (!task.title.trim()) {
    return res.status(400).render('task-form', {
      pageTitle: 'Nowe zadanie',
      action: '/tasks/new',
      submitLabel: 'Dodaj zadanie',
      error: 'Tytul jest wymagany.',
      task
    });
  }

  try {
    await run(
      'INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, ?)',
      [req.currentUser.id, task.title.trim(), task.description.trim() || null, task.completed ? 1 : 0]
    );
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.get('/tasks/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const task = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).send('Nie znaleziono zadania.');
    }
    if (!canManageTask(req.currentUser, task)) {
      return res.status(403).send('Brak uprawnien do edycji tego zadania.');
    }

    res.render('task-form', {
      pageTitle: 'Edycja zadania',
      action: `/tasks/${task.id}/edit`,
      submitLabel: 'Zapisz zmiany',
      error: null,
      task: buildTaskFormData(task)
    });
  } catch (err) {
    next(err);
  }
});

app.post('/tasks/:id/edit', requireAuth, async (req, res, next) => {
  const taskId = req.params.id;
  const formTask = buildTaskFormData({ ...req.body, id: taskId });

  if (!formTask.title.trim()) {
    return res.status(400).render('task-form', {
      pageTitle: 'Edycja zadania',
      action: `/tasks/${taskId}/edit`,
      submitLabel: 'Zapisz zmiany',
      error: 'Tytul jest wymagany.',
      task: formTask
    });
  }

  try {
    const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).send('Nie znaleziono zadania.');
    }
    if (!canManageTask(req.currentUser, task)) {
      return res.status(403).send('Brak uprawnien do edycji tego zadania.');
    }

    await run(
      `
        UPDATE tasks
        SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [formTask.title.trim(), formTask.description.trim() || null, formTask.completed ? 1 : 0, taskId]
    );
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.post('/tasks/:id/delete', requireAuth, async (req, res, next) => {
  try {
    const task = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).send('Nie znaleziono zadania.');
    }
    if (!canManageTask(req.currentUser, task)) {
      return res.status(403).send('Brak uprawnien do usuniecia tego zadania.');
    }

    await run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.use((req, res) => {
  res.status(404).send('Nie znaleziono zasobu.');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Wystapil blad serwera.');
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Aplikacja dziala na http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Nie udalo sie zainicjalizowac bazy danych:', err);
    process.exit(1);
  });

process.on('SIGINT', () => {
  db.close(() => {
    process.exit(0);
  });
});
