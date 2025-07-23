require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebaseConfig');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

app.get('/', (req, res) => {
  res.send('API is live 🚀');
});

// Fetch specific ID
app.get('/data/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.ref(`/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data not found for given ID' });
    }
    return res.json({ [id]: snapshot.val() });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch all data
app.get('/data', async (req, res) => {
  try {
    const snapshot = await db.ref('/').once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'No data found' });
    }
    return res.json(snapshot.val());
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
