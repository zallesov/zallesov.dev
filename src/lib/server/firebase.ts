
import { credential, } from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APP_NAME = "zallesov-dev-cv-app";

const adminApp =
  getApps().find((it) => it.name === APP_NAME) ||
  initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
    credential: credential.applicationDefault(),
  }, APP_NAME);

// if (process.env.NODE_ENV === "development") {
//   // Assuming the Firestore emulator is running on localhost:8080
//   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
// }

export const adminDb = getFirestore(adminApp);