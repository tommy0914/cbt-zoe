import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@cbt.com' },
    update: {},
    create: {
      email: 'superadmin@cbt.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.superAdmin,
    },
  });

  console.log({ superAdmin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
