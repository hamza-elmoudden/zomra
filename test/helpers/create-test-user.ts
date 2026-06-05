import { PrismaClient } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  password_hash: string | null;
}

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  const id = crypto.randomUUID();
  const base = {
    id,
    username: `testuser_${id.slice(0, 8)}`,
    email: `test_${id.slice(0, 8)}@example.com`,
    full_name: 'Test User',
    password_hash: await bcrypt.hash('123456789', 10),
    role: 'user',
    status: 'active',
    ...overrides,
  };

  await prisma.users.create({ data: base });
  return base;
}

export async function createTestAdmin(
  prisma: PrismaClient,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  return createTestUser(prisma, { role: 'admin', ...overrides });
}

export async function createTestObserver(
  prisma: PrismaClient,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  return createTestUser(prisma, { role: 'observer', ...overrides });
}
