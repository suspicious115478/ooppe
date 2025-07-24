// apiAuth.js
module.exports = (req, res, next) => {
  const clientKey = req.headers['x-api-key'];

  if (!clientKey) {
    return res.status(401).json({ error: 'Missing API Key' });
  }

  if (clientKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }

  next(); // Proceed if valid
};
