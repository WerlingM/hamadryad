import { MemberRole, Moisture, Sunlight, YardLocation } from "@prisma/client";
import { builder } from "./builder";

export const MemberRoleEnum = builder.enumType(MemberRole, { name: "MemberRole" });
export const YardLocationEnum = builder.enumType(YardLocation, { name: "YardLocation" });
export const SunlightEnum = builder.enumType(Sunlight, { name: "Sunlight" });
export const MoistureEnum = builder.enumType(Moisture, { name: "Moisture" });
