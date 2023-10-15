import { z } from "zod";
import { Education } from "./Education";
import { Employment } from "./Employment";
import { Highlight } from "./Highlight";
import { Portfolio } from "./Portfolio";
import { isSchema } from "./isSchema";


export const CV = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  title: z.string(),
  photoPath: z.string(),
  pdf: z.string().optional(),
  chatLink: z.string().optional(),
  quotes: z.array(z.string()).optional(),
  highlights: z.array(Highlight).optional(),
  educations: z.array(Education).optional(),
  portfolioQuote: z.string().optional(),
  portfolios: z.array(Portfolio).optional(),
  employmentQuote: z.string().optional(),
  employments: z.array(Employment).optional(),
  footerNote: z.string().optional(),
  footerUrl: z.string().optional(),
  // userId: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  skills: z.array(z.string()).optional(),
  // address: z.string().optional(),
  // city: z.string().optional(),
  // country: z.string().optional(),
  // zipCode: z.string().optional(),
  // about: z.string().optional(),
  // skills: z.string().optional(),
  // photo: z.string().optional(),
});

export type CV = z.infer<typeof CV>;

export function isCV(obj: unknown): obj is CV {
  return isSchema(obj, CV, "CV");
}
