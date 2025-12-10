const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Błąd przy połączeniu z bazą danych:', err);
  } else {
    console.log('Połączono z bazą danych SQLite');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Błąd przy tworzeniu tabeli:', err);
    } else {
      console.log('Tabela tasks gotowa');
    }
  });
}

app.get('/', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Błąd przy pobieraniu danych:', err);
      return res.status(500).send('Błąd serwera');
    }
    res.render('index', { tasks: rows || [] });
  });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/add', (req, res) => {
  res.render('add');
});


app.post('/add', (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).render('add', { error: 'Tytuł jest wymagany' });
  }

  db.run(
    'INSERT INTO tasks (title, description) VALUES (?, ?)',
    [title.trim(), description.trim() || null],
    function(err) {
      if (err) {
        console.error('Błąd przy dodawaniu zadania:', err);
        return res.status(500).send('Błąd serwera');
      }
      res.redirect('/');
    }
  );
});

app.get('/edit/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Zadanie nie znalezione');
    }
    res.render('edit', { task: row });
  });
});

app.post('/edit/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, completed } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).render('edit', {
      task: { id, title, description },
      error: 'Tytuł jest wymagany'
    });
  }

  const completedValue = completed ? 1 : 0;
  db.run(
    'UPDATE tasks SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title.trim(), description.trim() || null, completedValue, id],
    function(err) {
      if (err) {
        console.error('Błąd przy aktualizacji zadania:', err);
        return res.status(500).send('Błąd serwera');
      }
      res.redirect('/');
    }
  );
});

app.post('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Błąd przy usuwaniu zadania:', err);
      return res.status(500).send('Błąd serwera');
    }
    res.redirect('/');
  });
});

app.use((req, res) => {
  res.status(404).send('Nie znaleziono zasobu.');
});

app.listen(PORT, () => {
  console.log(`Aplikacja uruchomiona na: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Błąd przy zamykaniu bazy danych:', err);
    } else {
      console.log('Baza danych zamknięta');
    }
    process.exit(0);
  });
});
