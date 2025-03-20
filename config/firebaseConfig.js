import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const rtdb = process.env.RTDB;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: rtdb,
});

const db = admin.firestore();
const rt = admin.database();
const auth = admin.auth(); // Firebase Auth for backend

export { db, auth, rt };
