// builder.ts declares queryType and mutationType on the builder singleton,
// so it must be the first import. All subsequent imports register fields
// against those root types.
import { builder } from "./builder";

import "./scalars";
import "./types/user";
import "./types/auth";
import "./queries/me";
import "./mutations/auth";

export const schema = builder.toSchema();
