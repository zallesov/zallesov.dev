import { z } from "zod";
import { Education } from "./Education";
import { Employment } from "./Employment";
import { Highlight } from "./Highlight";
import { Portfolio } from "./Portfolio";
import { Project } from "./Project";
import { Article } from "./Article";
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
  articles: z.array(Article).optional(),
  highlights: z.array(Highlight).optional(),
  educations: z.array(Education).optional(),
  portfolioQuote: z.string().optional(),
  portfolios: z.array(Portfolio).optional(),
  employmentQuote: z.string().optional(),
  employments: z.array(Employment).optional(),
  sideProjects: z.array(Project).optional(),
  sideProjectsQuote: z.string().optional(),
  footerNote: z.string().optional(),
  footerUrl: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export type CV = z.infer<typeof CV>;

export function isCV(obj: unknown): obj is CV {
  return isSchema(obj, CV, "CV");
}
