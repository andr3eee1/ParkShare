import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const reservations = await prisma.reservation.findMany({ where: { status: 'ACTIVE' } });
  for (const r of reservations) {
    if (r.startTime > new Date()) {
       console.log(`Fixing active reservation ${r.id}`);
       const newStartTime = new Date(r.startTime.getTime() - 180 * 60000);
       await prisma.reservation.update({
         where: { id: r.id },
         data: { startTime: newStartTime }
       });
    }
  }
  console.log('Done active');
}
main().catch(console.error).finally(() => prisma.$disconnect());
