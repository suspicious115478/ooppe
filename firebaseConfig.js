const admin = require('firebase-admin');

// DEBUG: Log which env vars are present
console.log("=== Firebase Config Logs ===");
console.log("PROJECT_ID:", process.env.PROJECT_ID);
console.log("PRIVATE_KEY_ID:", process.env.PRIVATE_KEY_ID);
console.log("CLIENT_EMAIL:", process.env.CLIENT_EMAIL);
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
console.log("PRIVATE_KEY sample (first 50 chars):", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.slice(0, 50) : "undefined");

const serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
};

// DEBUG: Log sanitized service account (mask private key)
console.log("Sanitized serviceAccount:", {
  ...serviceAccount,
  private_key: "****REDACTED****",
});

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://project-6179641329587689976-default-rtdb.firebaseio.com/"
  });
  console.log("✅ Firebase Admin initialized successfully.");
} catch (err) {
  console.error("❌ Firebase Admin initialization failed:", err);
}

const db = admin.database();
module.exports = db;
