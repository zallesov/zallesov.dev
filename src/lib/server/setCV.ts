import { CV } from "@/types/CV";
import { logger } from "firebase-functions";
import { UpdateData } from "firebase/firestore";
import { getDocRef } from "./utils/getDocRef";

export const updateCV = async (id: string, cv: UpdateData<CV>) => {
  const ref = getDocRef("cvs", id);
  
  logger.log(`Updating CV with id ${id}`);
  await ref.update(cv);
};
