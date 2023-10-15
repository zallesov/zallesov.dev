import { DocumentData, DocumentSnapshot } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

export const parseDataFromDoc = <T>(
  isT: (obj: unknown) => obj is T,
  doc: DocumentSnapshot<DocumentData>
): T => {
  if (!doc.exists) {
    throw new Error(`Document with id ${doc.id} could not be found.`);
  }

  const data = doc.data();

  if (!isT(data)) {
    throw new Error(`Document with id ${doc.id} is invalidly typed.`);
  }

  logger.log(`Document with id ${doc.id} was parsed successfully.`, data)
  
  return data!;
};
