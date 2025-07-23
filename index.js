require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebaseConfig');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// ✅ Route to get a specific ID (already present)
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

// ✅ NEW: Route to get all data from the root
app.get('/alldata', async (req, res) => {
  try {
    const snapshot = await db.ref('/').once('value'); // reads root-level data
    const data = snapshot.val();
    res.json(data);
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: 'Failed to fetch all data' });
  }
});

// Root confirmation route
app.get('/', (req, res) => {
  res.send('API is live 🚀');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
