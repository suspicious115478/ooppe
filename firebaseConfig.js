const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // this is the JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<your-project-id>.firebaseio.com' // update this
});

const db = admin.database();
module.exports = db;
