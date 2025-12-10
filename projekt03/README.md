# Projekt03 - Menedżer Zadań

Aplikacja do zarządzania zadaniami (TODO List) w Express.js + SQLite3.

## Szybki Start

```bash
# 1.
cd projekt03

# 2.
npm install

# 3.
npm run seed

# 4.
npm start
```

Aplikacja będzie dostępna na: **http://localhost:8000**

## Funkcje

Dodawanie nowych zadań  
Edytowanie zadań  
Usuwanie zadań  
Oznaczanie jako ukończone  
Przechowywanie w bazie danych (SQLite)  
Responsywny interfejs  

## Struktura projektu

```
projekt03/
├── app.js           # Główna aplikacja
├── seed.js          # Dane testowe
├── package.json     # Zależności
├── README.md        # Ten plik
├── tasks.db         # Baza danych (utworzona automatycznie)
├── public/
│   └── style.css    # Style
└── views/
    ├── index.ejs    # Strona główna
    ├── add.ejs      # Formularz dodawania
    ├── edit.ejs     # Formularz edycji
    └── about.ejs    # O projekcie
```

## Dostępne ścieżki

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/` | Lista zadań |
| GET | `/add` | Formularz dodawania |
| POST | `/add` | Zapisz nowe zadanie |
| GET | `/edit/:id` | Formularz edycji |
| POST | `/edit/:id` | Zapisz edycję |
| POST | `/delete/:id` | Usuń zadanie |
| GET | `/about` | O projekcie |

## 💻 Technologia

- Node.js + Express.js
- SQLite3 (baza danych)
- EJS (szablony HTML)
- CSS3 (responsywny design)

## Konfiguracja

Port aplikacji: **8000** (można zmienić w `app.js`)

```javascript
const PORT = process.env.PORT || 8000;
```

## Użycie

### Dodawanie zadania
1. Kliknij "Dodaj nowe zadanie"
2. Wpisz tytuł i opcjonalnie opis
3. Kliknij "Dodaj"

### Edytowanie zadania
1. Obok zadania kliknij "Edytuj"
2. Zmień dane
3. Kliknij "Zapisz zmiany"

### Usuwanie zadania
1. Kliknij "Usuń"
2. Potwierdź w oknie dialogowym

## Rozwiązywanie problemów

**Problem: Port 8000 jest zajęty**
```bash
PORT=3001 npm start
```

**Problem: Brakuje modułów**
```bash
npm install
```

**Problem: Baza danych jest pusta**
```bash
npm run seed
```

## Termin oddania

Projekt należy oddać **do 10.12.2025** w repozytorium GitHub jako folder `projekt03`.


Franek Matusiewicz - Projekt na potrzeby kursu PZAW 2025
