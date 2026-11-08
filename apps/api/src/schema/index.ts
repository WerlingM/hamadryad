// builder.ts declares queryType and mutationType on the builder singleton,
// so it must be the first import. All subsequent imports register fields
// against those root types.
import { builder } from "./builder";

import "./scalars";
import "./enums";
import "./types/user";
import "./types/auth";
import "./types/homeMember";
import "./types/bed";
import "./types/yard";
import "./types/home";
import "./queries/me";
import "./queries/homes";
import "./mutations/auth";
import "./mutations/homes";
import "./mutations/yards";
import "./mutations/parcel";

export const schema = builder.toSchema();
