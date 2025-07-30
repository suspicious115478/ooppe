// ✅ index.js — Firebase API Server with API Usage Logging
const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const IV_LENGTH = 16;

// 🔧 Firebase Admin SDK setup
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project-6179641329587689976-default-rtdb.firebaseio.com/'
});
const db = admin.database();

// 🔐 Utility to encrypt data with AES-256-CBC
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

// 🔐 Middleware: Validate API Key
async function checkApiKey(req, res, next) {
  const clientKey = req.headers['x-api-key'];
  if (!clientKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  try {
    const snapshot = await db.ref('/apiKeys').once('value');
    const allKeys = snapshot.val();

    for (const org in allKeys) {
      if (allKeys[org].apiKey === clientKey) {
        req.encryptionKey = crypto.createHash('sha256').update(clientKey).digest();
        req.orgKey = org; // for logging
        req.orgName = allKeys[org].name;
        return next();
      }
    }

    res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  } catch (err) {
    console.error('API key validation failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 📦 Protected route: Get encrypted data by ID
app.get('/data/:id', checkApiKey, async (req, res) => {
  const id = req.params.id;

  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const encrypted = encrypt(snapshot.val(), req.encryptionKey);
    res.json(encrypted);

    // 🔍 Log the API usage
    const usageLog = {
      id: id,
      timestamp: Date.now()
    };

    await db.ref(`/apiUsageLogs/${req.orgKey}`).push(usageLog);
  } catch (err) {
    console.error('Data fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🏢 Organization registration: Generates and stores new API key
app.post('/register-org', async (req, res) => {
  const orgName = req.body.orgName?.trim();
  if (!orgName) {
    return res.status(400).json({ error: 'Organization name is required' });
  }

  const apiKey = crypto.randomBytes(32).toString('hex');
  const orgKey = orgName.toLowerCase().replace(/\s+/g, '_');

  const data = {
    name: orgName,
    apiKey: apiKey,
    createdAt: Date.now()
  };

  try {
    await db.ref(`/apiKeys/${orgKey}`).set(data);
    res.json({ name: orgName, apiKey: apiKey });
  } catch (err) {
    console.error('Error creating API key:', err);
    res.status(500).json({ error: 'Failed to register organization' });
  }
});

// 🚀 Start the API server
app.listen(PORT, () => {
  console.log(`✅ API Server running on port ${PORT}`);
});
