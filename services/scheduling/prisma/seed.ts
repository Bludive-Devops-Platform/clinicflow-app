import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = [
    { name: 'General Consultation', durationMinutes: 30 },
    { name: 'Follow-up', durationMinutes: 20 },
    { name: 'Vaccination', durationMinutes: 15 },
  ];

  for (const s of data) {
    await prisma.clinicService.upsert({
      where: { name: s.name },
      update: { durationMinutes: s.durationMinutes, active: true },
      create: s,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
