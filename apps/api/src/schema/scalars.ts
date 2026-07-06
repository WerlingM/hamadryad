import { DateTimeResolver, DateResolver, JSONResolver } from "graphql-scalars";
import { builder } from "./builder";

builder.addScalarType("DateTime", DateTimeResolver, {});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("JSON", JSONResolver, {});
