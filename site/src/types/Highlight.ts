import { z } from "zod";

export const Highlight = z.object({
  title: z.string(),
  text: z.string(),
});

export type Highlight = z.infer<typeof Highlight>;
