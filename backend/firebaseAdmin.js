const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

try {
  // Graceful initialization relying on environment variables.
  // Because Firebase Admin expects a structured private key, we re-parse any escaped newlines if passed in ENV.
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin Initialized Successfully.');
} catch (error) {
  console.log('Firebase Admin Init skipped or failed (Ensure .env contains standard Admin SDK creds).');
}

module.exports = admin;
