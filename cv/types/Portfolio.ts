import { z } from "zod";

export const Portfolio = z.object({
  title: z.string(),
  index: z.number(),
  text: z.string(),
  images: z.array(z.string()).optional(),
});

export type Portfolio = z.infer<typeof Portfolio>;