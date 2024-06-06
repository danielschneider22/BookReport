import { ServiceAccount } from "firebase-admin";
import admin from 'firebase-admin';

const firebasePrivateKey = `-----BEGIN PRIVATE KEY-----\n${process.env.FIREBASE_PRIVATE_KEY}\n-----END PRIVATE KEY-----\n`?.replace(/\\n/g, '\n');
const firebaseConfig: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: firebasePrivateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};  

let firebaseAdminInstance: admin.app.App;

export function getFirebaseAdmin() {
  if (!firebaseAdminInstance) {
    if (admin.apps.length === 0) {
      firebaseAdminInstance = admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        databaseURL: "https://bookreports-default-rtdb.firebaseio.com"
      });
    } else {
      firebaseAdminInstance = admin.app();
    }
  }
  return firebaseAdminInstance;
}