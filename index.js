// ✅ index.js
const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const IV_LENGTH = 16;

// 🧩 Firebase Init
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project-6179641329587689976-default-rtdb.firebaseio.com/'
});
const db = admin.database();

// 🔐 Encrypt Function (will use dynamic key)
function getEncryptionKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest();
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return {
    iv: iv.toString('base64'),
    data: encrypted
  };
}

// 🔐 Middleware to Check API Key against Firebase
async function checkApiKey(req, res, next) {
  const clientKey = req.headers['x-api-key'];
  console.log('➡️ Received x-api-key:', clientKey);

  try {
    const keySnapshot = await db.ref('/config/apiKey').once('value');
    const validKey = keySnapshot.val();

    if (!validKey || clientKey !== validKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    // Attach encryption key to request
    req.encryptionKey = getEncryptionKey(clientKey);
    next();
  } catch (err) {
    console.error('🔥 Error fetching API key from Firebase:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 📦 Routes
app.get('/data/:id', checkApiKey, async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found for the given ID' });
    }
    const encrypted = encrypt(snapshot.val(), req.encryptionKey);
    res.json(encrypted);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
