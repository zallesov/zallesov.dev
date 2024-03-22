import { z } from "zod";

export const Article = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
});

export type Article = z.infer<typeof Article>;
