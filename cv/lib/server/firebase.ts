
import { credential, } from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, } from "firebase-admin/firestore";


const ADMIN_APP_NAME = "firebase-frameworks";
  const adminApp =
    getApps().find((it) => it.name === ADMIN_APP_NAME) ||
    initializeApp({
      credential: credential.applicationDefault(),
  }, ADMIN_APP_NAME);

export const adminDb = getFirestore(adminApp);