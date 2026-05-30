import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// One-off, idempotent user inserts. Re-runnable — uses upsert by email.
// Does NOT touch any other rows.
async function main() {
  const SALT_ROUNDS = 10;

  const accounts = [
    {
      email: 'con@deped.gov.ph',
      firstName: 'Con',
      lastName: 'Administrator',
      role: Role.Admin,
      employeeId: 'A-0002',
      avatarColor: '#1E3A8A',
      password: 'rosales_portalv1',
    },
    {
      email: 'reymart.alo@deped.gov.ph',
      firstName: 'Reymart',
      lastName: 'Alo',
      role: Role.Teacher,
      employeeId: 'T-1004',
      avatarColor: '#2E7D32',
      password: 'rosales_portalv1',
    },
  ];

  for (const a of accounts) {
    const passwordHash = await bcrypt.hash(a.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {
        firstName: a.firstName,
        lastName: a.lastName,
        role: a.role,
        employeeId: a.employeeId,
        avatarColor: a.avatarColor,
        passwordHash,
      },
      create: {
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        role: a.role,
        employeeId: a.employeeId,
        avatarColor: a.avatarColor,
        passwordHash,
      },
    });
    console.log(`✓ ${user.role.padEnd(7)} ${user.email}  (id: ${user.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
