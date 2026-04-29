import { credential } from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { CV as CVSchema, type CV } from "../src/types/CV";
import baseCv from "../.content/zallesov.dev";

const APP_NAME = "zallesov-dev-seed-cv";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function buildCv(id: string): CV {
  return CVSchema.parse({
    ...(baseCv as any),
    id,
  });
}

async function main() {
  const id = process.argv[2] || process.env.NEXT_PUBLIC_CV_ID || "zallesov.dev";
  const projectId = requiredEnv("GCLOUD_PROJECT");

  const adminApp =
    getApps().find((it) => it.name === APP_NAME) ||
    initializeApp(
      {
        projectId,
        credential: credential.applicationDefault(),
      },
      APP_NAME
    );

  const db = getFirestore(adminApp);
  const cv = buildCv(id);

  await db.doc(["cvs", id].join("/")).set(cv);
  // eslint-disable-next-line no-console
  console.log(`Seeded CV: cvs/${id}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

