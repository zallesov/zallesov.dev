import { z } from "zod";

export const Education = z.object({
  startYear: z.string(),
  endYear: z.string(),
  university: z.string().optional(),
  specialisation: z.string().optional(),
});

export type Education = z.infer<typeof Education>;
