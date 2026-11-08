import type { PrismaClient, YardLocation } from "@prisma/client";

interface SampleHome {
  name: string;
  address: string;
  yards: { name: string; location: YardLocation }[];
}

const SAMPLE_HOMES: SampleHome[] = [
  {
    name: "Suburban Home",
    address: "123 Maple Street",
    yards: [
      { name: "Front Yard", location: "FRONT" },
      { name: "Back Yard", location: "BACK" },
    ],
  },
  {
    name: "Richmond Rental",
    address: "456 Grace Street, Richmond, VA",
    yards: [
      { name: "Front Yard", location: "FRONT" },
      { name: "Back Yard", location: "BACK" },
    ],
  },
];

/** Create the sample homes for a user. Skips any home name the user already owns. */
export async function seedHomes(prisma: PrismaClient, ownerId: string): Promise<void> {
  for (const sample of SAMPLE_HOMES) {
    const existing = await prisma.home.findFirst({
      where: { ownerId, name: sample.name },
      select: { id: true },
    });
    if (existing) {
      console.log(`Home already exists: ${sample.name} — skipping.`);
      continue;
    }

    await prisma.home.create({
      data: {
        name: sample.name,
        address: sample.address,
        ownerId,
        members: { create: { userId: ownerId, role: "OWNER" } },
        yards: {
          create: sample.yards.map((yard, sortOrder) => ({ ...yard, sortOrder })),
        },
      },
    });
    console.log(`Created home: ${sample.name}`);
  }
}
