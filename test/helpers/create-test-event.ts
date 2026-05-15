import { PrismaClient } from '../../generated/prisma/client';
import crypto from 'crypto';

export interface TestEvent {
  id: string;
  host_id: string;
  title: string;
  category: string;
  starts_at: Date;
  duration_minutes: number;
  max_participants: number;
  current_count: number;
  status: string;
  is_public: boolean;
  city: string | null;
}

export async function createTestEvent(
  prisma: PrismaClient,
  hostId: string,
  overrides: Partial<TestEvent> = {},
): Promise<TestEvent> {
  const id = crypto.randomUUID();
  const base = {
    id,
    host_id: hostId,
    title: 'Test Event',
    description: 'A test event description',
    category: 'sports',
    starts_at: new Date(Date.now() + 86400000),
    duration_minutes: 60,
    max_participants: 10,
    current_count: 1,
    status: 'open',
    is_public: true,
    city: 'Casablanca',
    ...overrides,
  };

  await prisma.events.create({ data: base });
  return base;
}
