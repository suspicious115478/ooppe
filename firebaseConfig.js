const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // this is the JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: https://project-6179641329587689976-default-rtdb.firebaseio.com/ // update this
});

const db = admin.database();
module.exports = db;
