import { z } from 'zod';

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors: Record<string, string[]> };

/**
 * Parses unknown input against a Zod schema, returning a structured success or field-error result.
 */
export function parseSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  fallbackMessage = 'Validation failed.',
): ParseResult<z.infer<TSchema>> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_form';
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }

  return {
    ok: false,
    message: result.error.issues[0]?.message ?? fallbackMessage,
    fieldErrors,
  };
}
