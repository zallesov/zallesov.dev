import { ZodSchema } from "zod";

export function isSchema<T>(
  value: unknown,
  schema: ZodSchema<T>,
  name: string
): value is T {
  if (value === undefined) return false;

  const result = schema.safeParse(value);

  if (result.success) return true;

  console.error(
      `Invalid schema for ${name}:\n${result.error?.issues
        .map((i) => `${i.code}: "${i.path.join(", ")}" ${i.message}`)
        .join("\n")}`
    )

  return false;
}
