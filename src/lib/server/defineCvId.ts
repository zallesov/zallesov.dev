import { headers } from "next/headers";

/** Firestore document id under collection `cvs` for this résumé site. */
const CANONICAL_CV_DOC_ID = "zallesov.dev";

/** Custom domains that should resolve to the canonical CV doc (same bucket/project). */
const DOMAIN_TO_CV_ID: Record<string, string> = {
  "zall.dev": CANONICAL_CV_DOC_ID,
  "www.zall.dev": CANONICAL_CV_DOC_ID,
};

function resolveCvId(raw: string): string {
  const id = raw.trim();
  const key = id.toLowerCase();
  return DOMAIN_TO_CV_ID[key] ?? id;
}

/**
 * CV id matches the Firestore doc. Production uses NEXT_PUBLIC_CV_ID from apphosting.yaml;
 * zall.dev is aliased to the canonical doc id so we never request a missing cvs/zall.dev doc.
 */
export const defineCvId = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_CV_ID?.trim();
  if (fromEnv) return resolveCvId(fromEnv);

  const host = headers().get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return CANONICAL_CV_DOC_ID;
  }

  if (DOMAIN_TO_CV_ID[host]) return DOMAIN_TO_CV_ID[host];

  if (
    host.endsWith(".web.app") ||
    host.endsWith(".firebaseapp.com") ||
    host.endsWith(".run.app")
  ) {
    return CANONICAL_CV_DOC_ID;
  }

  return resolveCvId(host);
};
