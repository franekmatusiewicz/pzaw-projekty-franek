# projekt04 - Menedzer Zadan z Kontami Uzytkownikow

Prosta aplikacja internetowa napisana w `Express`, ktora pozwala rejestrowac uzytkownikow, logowac sie i zarzadzac zadaniami zapisanymi w bazie `SQLite`.

Projekt spelnia wymagania pracy projektowej:

- korzysta z frameworku `Express`,
- obsluguje wiele kombinacji sciezka + metoda, w tym `GET /`,
- przyjmuje dane z formularzy HTML i zapisuje je przez `POST`,
- przechowuje dane nieulotnie w bazie danych,
- posiada skrypt do wypelnienia bazy danymi testowymi,
- umozliwia rejestracje, logowanie i wylogowanie,
- zapisuje hasla jako salted hash,
- ogranicza wybrane funkcje do zalogowanych uzytkownikow,
- tworzy konto administratora,
- pozwala zwyklym uzytkownikom edytowac tylko swoje zadania.

## Uruchomienie

```bash
cd projekt04
npm install
npm run seed
npm start
```

Aplikacja domyslnie dziala pod adresem `http://localhost:8000`.

## Konta testowe

Po uruchomieniu `npm run seed` tworzone sa konta:

- administrator: `admin` / `admin123`
- uzytkownik: `ola` / `haslo123`
- uzytkownik: `jan` / `sekret123`

Mozna tez ustawic zmienne srodowiskowe dla administratora:

```bash
ADMIN_LOGIN=mojadmin
ADMIN_PASSWORD=mojehaslo
```

## Najwazniejsze funkcje

- publiczna lista wszystkich zadan,
- rejestracja nowego konta,
- logowanie i wylogowanie,
- dodawanie zadania po zalogowaniu,
- edycja i usuwanie wlasnych zadan,
- edycja i usuwanie wszystkich zadan przez administratora,
- oznaczanie zadania jako wykonane.

## Przykladowe sciezki

| Metoda | Sciezka | Opis |
| --- | --- | --- |
| GET | `/` | Strona glowna z lista zadan |
| GET | `/register` | Formularz rejestracji |
| POST | `/register` | Tworzenie konta |
| GET | `/login` | Formularz logowania |
| POST | `/login` | Logowanie |
| POST | `/logout` | Wylogowanie |
| GET | `/tasks/new` | Formularz dodawania zadania |
| POST | `/tasks/new` | Zapis nowego zadania |
| GET | `/tasks/:id/edit` | Formularz edycji zadania |
| POST | `/tasks/:id/edit` | Zapis zmian zadania |
| POST | `/tasks/:id/delete` | Usuniecie zadania |
| GET | `/about` | Krotki opis projektu |

## Struktura

```text
projekt04/
|-- app.js
|-- seed.js
|-- package.json
|-- README.md
|-- public/
|   `-- style.css
`-- views/
    |-- about.ejs
    |-- index.ejs
    |-- login.ejs
    |-- register.ejs
    |-- task-form.ejs
    `-- partials/
        `-- header.ejs
```

## Uwagi techniczne

- Hasla nie sa przechowywane w postaci jawnej. Do zapisu wykorzystywany jest `salted hash` oparty na `crypto.pbkdf2Sync`.
- Sesja uzytkownika jest trzymana w bazie danych w tabeli `sessions`, a identyfikator sesji w ciasteczku `sid`.
- Baza danych jest zapisywana w pliku `app.db`.

## Historia rozwoju

Do oddania warto utrzymac liniowa historie commitow pokazujaca kolejne etapy prac, na przyklad:

1. skopiowanie bazy z `projekt03`,
2. dodanie bazy uzytkownikow i logowania,
3. dodanie kontroli uprawnien,
4. poprawa widokow i README.
