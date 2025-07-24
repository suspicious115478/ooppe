require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebaseConfig');
const apiAuth = require('./apiAuth'); // Keeps API key checking
const { encrypt } = require('./encryptor'); // Import encryptor module

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.get('/', (req, res) => {
  res.send('API is live 🚀');
});

// 🔒 Encrypted Protected Route for single ID
app.get('/data/:id', apiAuth, async (req, res) => {
  const id = req.params.id;
  const apiKey = req.headers['x-api-key'];
  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found for given ID' });
    }
    const encrypted = encrypt(JSON.stringify(snapshot.val()), apiKey);
    return res.json({ data: encrypted });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔒 Encrypted Protected Route for all data
app.get('/data', apiAuth, async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  try {
    const snapshot = await db.ref('/').once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'No data found' });
    }
    const encrypted = encrypt(JSON.stringify(snapshot.val()), apiKey);
    return res.json({ data: encrypted });
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
