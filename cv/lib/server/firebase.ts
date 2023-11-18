
import { credential, } from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, } from "firebase-admin/firestore";


const APP_NAME = "zallesov-dev-cv-app";

const adminApp =
  getApps().find((it) => it.name === APP_NAME) ||
  initializeApp({
    credential: credential.applicationDefault(),
}, APP_NAME);

export const adminDb = getFirestore(adminApp);