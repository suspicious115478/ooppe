require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebaseConfig'); // Firebase Realtime DB

const app = express();
const PORT = process.env.PORT || 8080;
const VALID_API_KEY = process.env.API_KEY;

app.use(cors());
app.use(express.json());

// 🔐 API key middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey || apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid or missing API key' });
  }

  next();
});

app.get('/', (req, res) => {
  res.send('✅ API is live and protected by API key');
});

// 🔍 Get all data
app.get('/data', async (req, res) => {
  try {
    const snapshot = await db.ref('/').once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'No data found' });
    }
    res.json(snapshot.val());
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔍 Get data by ID
app.get('/data/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found for the given ID' });
    }
    res.json(snapshot.val());
  } catch (error) {
    console.error('Error fetching data by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
