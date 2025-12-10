const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Błąd przy połączeniu z bazą danych:', err);
    process.exit(1);
  } else {
    console.log('Połączono z bazą danych SQLite');
    seedDatabase();
  }
});

const sampleTasks = [
  {
    title: 'Przygotować prezentację',
    description: 'Stworzyć slajdy do prezentacji na spotkaniu zespołu',
    completed: 0
  },
  {
    title: 'Przejrzeć kod projektu',
    description: 'Code review pullrequesta od kolegi z zespołu',
    completed: 0
  },
  {
    title: 'Zaktualizować dokumentację',
    description: 'Dodać nową sekcję do README projektu',
    completed: 1
  },
  {
    title: 'Naprawić bug w logowaniu',
    description: 'Użytkownicy nie mogą się zalogować przez Google OAuth',
    completed: 0
  },
  {
    title: 'Zorganizować spotkanie',
    description: 'Umówić się na spotkanie retrospektywne zespołu',
    completed: 1
  },
  {
    title: 'Testowanie aplikacji mobilnej',
    description: 'Przetestować nową wersję aplikacji na Android i iOS',
    completed: 0
  }
];

function seedDatabase() {
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
      closeDatabaseAndExit();
      return;
    }

    console.log('Tabela tasks gotowa');

    db.run('DELETE FROM tasks', (err) => {
      if (err) {
        console.error('Błąd przy usuwaniu danych:', err);
        closeDatabaseAndExit();
        return;
      }

      console.log('Usunięto stare dane');

      const insertStmt = db.prepare(
        'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)'
      );

      sampleTasks.forEach((task, index) => {
        insertStmt.run([task.title, task.description, task.completed], (err) => {
          if (err) {
            console.error(`Błąd przy wstawianiu zadania ${index + 1}:`, err);
          } else {
            console.log(`✓ Dodano zadanie: "${task.title}"`);
          }
        });
      });

      insertStmt.finalize((err) => {
        if (err) {
          console.error('Błąd przy finalizacji:', err);
        } else {
          console.log('\n✅ Baza danych została załadowana pomyślnie!');
        }
        closeDatabaseAndExit();
      });
    });
  });
}

function closeDatabaseAndExit() {
  db.close((err) => {
    if (err) {
      console.error('Błąd przy zamykaniu bazy danych:', err);
    } else {
      console.log('Połączenie z bazą danych zamknięte');
    }
    process.exit(0);
  });
}
