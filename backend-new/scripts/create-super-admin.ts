/**
 * Idempotent super admin bootstrap. Reads credentials from env vars —
 * never commit real credentials to this file or to seed.ts.
 *
 * Usage (Railway):
 *   railway run --service <backend> \
 *     SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='...' \
 *     npx ts-node scripts/create-super-admin.ts
 */
import { PrismaClient, Role, AccountType, Language } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD env vars are required');
  }
  if (password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email_accountType: { email, accountType: AccountType.ADMIN } },
    update: {
      password: hashedPassword,
      roles: [Role.SUPER_ADMIN],
      emailVerified: true,
      loginDisabled: false,
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      accountType: AccountType.ADMIN,
      roles: [Role.SUPER_ADMIN],
      emailVerified: true,
      language: Language.PL,
    },
  });

  console.log(`✓ Super admin ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
