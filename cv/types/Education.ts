import { z } from "zod";

export const Education = z.object({
  startYear: z.string(),
  endYear: z.string(),
  univarsity: z.string(),
  specialisation: z.string().optional(),
});

export type Education = z.infer<typeof Education>;
