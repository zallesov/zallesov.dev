import { isCV } from "@/types/CV";
import { logger } from "firebase-functions";
import { getDocRef } from "./utils/getDocRef";
import { parseDataFromDoc } from "./utils/parseDataFromDoc";

export const getCV = async (id: string) => {
  const ref = getDocRef("cvs", id);
  
  logger.log(`Getting CV with id ${id}`);
  const doc = await ref.get();
  return parseDataFromDoc(isCV, doc);
};
