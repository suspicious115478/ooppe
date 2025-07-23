require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebaseConfig');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

app.get('/data/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const snapshot = await db.ref(`/data/${userId}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(snapshot.val());
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.send('API is live 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
