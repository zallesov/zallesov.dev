import { z } from "zod";

export const EmploymentProjects = z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    preambule: z.string().optional(),
    postambule: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    urls: z.array(z.string().optional()),
    stack: z.string().optional(),
});

export const Employment = z.object({
  startDate: z.string(),
  endDate: z.string(),
  company: z.string(),
  text: z.string().optional(),
  projects: z.array(EmploymentProjects),
});

export type Employment = z.infer<typeof Employment>;
export type EmploymentSection = z.infer<typeof EmploymentProjects>;
