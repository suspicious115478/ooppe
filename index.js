const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const IV_LENGTH = 16;

// 🔧 Firebase Initialization
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project-6179641329587689976-default-rtdb.firebaseio.com/'
});
const db = admin.database();

// 🧩 Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // serve frontend HTML

// 🔐 API Key Generator (64-character hex)
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// 🔐 SHA256 Key Derivation
function getEncryptionKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest();
}

// 🔐 AES-256-CBC Encryption
function encrypt(data, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return {
    iv: iv.toString('base64'),
    data: encrypted
  };
}

// 🌐 Serve Registration Form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📝 Register Organization and Generate API Key
app.post('/register', async (req, res) => {
  const orgName = req.body.orgName?.trim();
  if (!orgName) return res.status(400).send('Organization name is required');

  const apiKey = generateApiKey();
  const orgId = orgName.toLowerCase().replace(/\s+/g, '_');

  const orgData = {
    name: orgName,
    apiKey,
    createdAt: Date.now()
  };

  try {
    await db.ref(`/apiKeys/${orgId}`).set(orgData);
    res.send(`
      <h2>API Key for <i>${orgName}</i></h2>
      <p><strong>${apiKey}</strong></p>
      <p>Save this key. You won't be able to retrieve it again!</p>
    `);
  } catch (error) {
    console.error('❌ Error storing API key:', error);
    res.status(500).send('Failed to register organization');
  }
});

// ✅ Middleware: Validate API Key
async function checkApiKey(req, res, next) {
  const clientKey = req.headers['x-api-key'];
  if (!clientKey) return res.status(401).json({ error: 'Missing API key' });

  try {
    const snapshot = await db.ref('/apiKeys').once('value');
    const allKeys = snapshot.val();
    let valid = false;

    for (const org in allKeys) {
      if (allKeys[org].apiKey === clientKey) {
        req.encryptionKey = getEncryptionKey(clientKey);
        req.orgName = allKeys[org].name;
        valid = true;
        break;
      }
    }

    if (!valid) return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    next();
  } catch (err) {
    console.error('❌ Error validating API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 📦 Protected Route: Encrypted Data Fetch
app.get('/data/:id', checkApiKey, async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const encrypted = encrypt(snapshot.val(), req.encryptionKey);
    res.json(encrypted);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
