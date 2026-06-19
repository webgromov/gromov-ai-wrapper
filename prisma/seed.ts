import { prisma } from '../src/libs/prisma';

await prisma.user.upsert({
  where: { email: 'hello@gromov.live' },
  update: {},
  create: {
    email: 'hello@gromov.live',
    name: 'Admin',
    balance: 100,
  },
});

console.log('Seeded: admin@example.com with balance 100');
await prisma.$disconnect();
