import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";


const ADMIN_APP_NAME = "firebase-frameworks";
  const adminApp =
    getApps().find((it) => it.name === ADMIN_APP_NAME) ||
    initializeApp({
      projectId: process.env.GCLOUD_PROJECT,
      // credential: credential.applicationDefault(),
  }, ADMIN_APP_NAME);

export const adminDb = getFirestore(adminApp);

const args = process.argv 

const id = args[2]

if (!id) {
  console.error("Run command with id of CV to update. `ts-node updateCV.ts <id>`")
  process.exit(1) 
}

const cv = require(`./${id}`).default

console.log("read CV", cv)

const ref = adminDb.doc(['cvs', id].join("/"));

console.log(`Updating CV ${id}`);

ref.set(cv);

console.log("done")