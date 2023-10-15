import { adminDb } from "../firebase";

export const getDocRef = (collectionName: string, docId: string) => {
  return adminDb.doc([collectionName, docId].join("/"));
};
