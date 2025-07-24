// ✅ index.js
const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = 'my-super-key-123';

// 🔐 Crypto setup
const ENCRYPTION_KEY = crypto.createHash('sha256').update(API_KEY).digest();
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return {
    iv: iv.toString('base64'),
    data: encrypted
  };
}

// ✅ FIXED: Use clientKey for logging and validation
function checkApiKey(req, res, next) {
  const clientKey = req.headers['x-api-key'];
  console.log('➡️ Received x-api-key:', clientKey);
  if (clientKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
}

// 🧩 Firebase Init
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});
const db = admin.database();

// 📦 Routes
app.get('/data/:id', checkApiKey, async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found for the given ID' });
    }
    const encrypted = encrypt(snapshot.val());
    res.json(encrypted);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
