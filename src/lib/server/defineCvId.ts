import { logger } from "firebase-functions";
import { headers } from "next/headers";

/**
 * CV id is equal to the domain name of the site.
 * For local testing id is set in the .env file.
 */
export const defineCvId = () => {
  headers().forEach((k, v) => logger.info(k, v));
  return process.env.NEXT_PUBLIC_CV_ID || "zallesov.dev";

  //TODO define 
  // const hostname = headers().get("host");

  // if (hostname?.includes("localhost") && process.env.NEXT_PUBLIC_CV_ID) {
  //   return process.env.NEXT_PUBLIC_CV_ID;
  // } else if (hostname) {
  //   return hostname;
  // } else {
  //   return "zallesov.dev";
  // }
};