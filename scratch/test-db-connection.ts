import { PrismaClient } from '@prisma/client';

const poolerUrl = 'postgresql://postgres.qixaogotjrpjpfvukazx:d0F4rs42OrLap0zl@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

const prisma = new PrismaClient({
  datasources: { db: { url: poolerUrl } },
});

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 as res');
    console.log('POOLER SUCCESS:', result);
  } catch (err: any) {
    console.error('POOLER ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

