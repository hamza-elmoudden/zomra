import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://localhost:5432/zomra_test';

const pool = new Pool({ connectionString: TEST_DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TABLES_TO_CLEAR = [
  'reviews',
  'group_event_messages',
  'messages',
  'conversations',
  'event_participants',
  'media',
  'notifications',
  'reports',
  'events',
  'user_interests',
  'users',
  'interests',
];

export async function cleanDatabase(): Promise<void> {
  for (const table of TABLES_TO_CLEAR) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}" CASCADE`);
  }
}

export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}
