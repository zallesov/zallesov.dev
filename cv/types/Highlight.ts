import { z } from "zod";
import { isSchema } from "./isSchema";

export const Highlight = z.object({
  title: z.string(),
  text: z.string(),
});

export type Highlight = z.infer<typeof Highlight>;
