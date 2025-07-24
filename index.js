require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebaseConfig');
const apiAuth = require('./apiAuth');
const { encrypt } = require('./encryptor');

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Full CORS handling including preflight support
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ⚠️ Ensures OPTIONS request doesn’t fail

// ✅ Health check endpoint
app.get('/', (req, res) => {
  res.send('API is live 🚀');
});

// 🔐 Encrypted data route for a specific ID
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔐 Encrypted data route for all data
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
