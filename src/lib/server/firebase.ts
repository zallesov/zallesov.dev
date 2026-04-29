
import { credential } from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync } from "node:fs";
import path from "node:path";

const APP_NAME = "zallesov-dev-cv-app";

// Local dev convenience:
// If the developer has `service-account.json` in the repo but forgot to export
// `GOOGLE_APPLICATION_CREDENTIALS`, firebase-admin will try metadata server and
// can hang for ~30-60s before failing. Auto-wire it in dev to keep DX smooth.
if (
  process.env.NODE_ENV === "development" &&
  !process.env.GOOGLE_APPLICATION_CREDENTIALS
) {
  const candidate = path.join(process.cwd(), "service-account.json");
  if (existsSync(candidate)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = candidate;
  }
}

const adminApp =
  getApps().find((it) => it.name === APP_NAME) ||
  initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
    credential: credential.applicationDefault(),
  }, APP_NAME);

// if (process.env.NODE_ENV === "development") {
//   // Match firebase.json emulators.firestore.port (avoid clashing with Next on 8080)
//   process.env.FIRESTORE_EMULATOR_HOST = "localhost:8090";
// }

export const adminDb = getFirestore(adminApp);