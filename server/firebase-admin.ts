import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// For local development, you should download your service account JSON from Firebase Console
// and either set GOOGLE_APPLICATION_CREDENTIALS line in your .env or provide it here.
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountRaw) {
  try {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully.');
  } catch (e: any) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  console.log('✅ Firebase Admin initialized via Application Default Credentials.');
} else {
  console.warn('⚠️ Firebase Admin not initialized. Background tasks and Admin seeding will not work.');
  console.warn('Please provide FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS in .env');
}

export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
