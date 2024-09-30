import { z } from "zod";
import { Project } from "./Project";

export const Employment = z.object({
  startDate: z.string(),
  endDate: z.string(),
  company: z.string(),
  text: z.string().optional(),
  projects: z.array(Project),
});

export type Employment = z.infer<typeof Employment>;
