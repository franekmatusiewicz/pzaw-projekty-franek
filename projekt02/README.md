# projekt02

## Opis
Prosty serwer HTTP z użyciem Express, obsługujący dynamiczne widoki (EJS). Projekt spełnia wymagania: Express, GET /, minimum 3 kombinacje ścieżka+metoda, dynamiczna strona główna z odzwierciedleniem treści z POST.

## Zawartość
- `app.js` — główny serwer
- `views/` — widoki EJS
- `public/` — pliki statyczne (opcjonalne)
- `package.json`

## Uruchomienie lokalnie
1. Sklonuj repozytorium:
   ```bash
   git clone <URL_REPO> projekt02
   cd projekt02
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Uruchom aplikację:
   ```bash
   npm start
   ```
   Domyślnie aplikacja działa na `http://localhost:3000`.

## Wymagane ścieżki
- `GET /` — strona główna (dynamiczna, pokazuje wiadomości)
- `GET /about` — informacja o projekcie
- `GET /items/:id` — przykład ścieżki z parametrem (zwraca JSON)
- `POST /submit` — przyjmuje `text` i po dodaniu przekierowuje na stronę główną, gdzie nowa treść jest widoczna

## Termin
Projekt należy oddać do końca dnia **12.11.2025**. Oddanie po terminie może skutkować obniżeniem oceny.
