import { GraphQLError } from "graphql";
import { z } from "zod";

/** Parse input against a zod schema, throwing a BAD_USER_INPUT GraphQL error on failure. */
export function parseInput<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.errors[0];
    const field = issue.path.join(".");
    throw new GraphQLError(field ? `${field}: ${issue.message}` : issue.message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  return parsed.data;
}

export const uuid = z.string().uuid();
