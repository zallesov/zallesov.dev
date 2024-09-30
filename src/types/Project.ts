import { z } from "zod";

export const Project = z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    preambule: z.string().optional(),
    postambule: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    urls: z.array(z.string().optional()),
    stack: z.string().optional(),
});

export type Project = z.infer<typeof Project>;
