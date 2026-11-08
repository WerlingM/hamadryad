import { MemberRole, YardLocation } from "@prisma/client";
import { builder } from "./builder";

export const MemberRoleEnum = builder.enumType(MemberRole, { name: "MemberRole" });
export const YardLocationEnum = builder.enumType(YardLocation, { name: "YardLocation" });
