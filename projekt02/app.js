const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;
const messages = [];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { messages });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/items/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = { id, name: `Przykładowy przedmiot #${id}`, createdAt: new Date().toISOString() };
  res.json(item);
});

app.post('/submit', (req, res) => {
  const text = req.body.text && String(req.body.text).trim();
  if (!text) {
    return res.status(400).send('Pole "text" jest wymagane.');
  }
  const entry = { id: messages.length + 1, text, createdAt: new Date().toISOString() };
  messages.unshift(entry);
  res.redirect('/');
});

app.use((req, res) => {
  res.status(404).send('Nie znaleziono zasobu.');
});

app.listen(PORT, () => {
  console.log(`Aplikacja uruchomiona: http://localhost:${PORT}`);
});
