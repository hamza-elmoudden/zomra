import { Events } from 'src/events/domain/entities/events.entities';
import { EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { event_status } from 'generated/prisma/enums';
import * as crypto from 'crypto';

export class MockEventRepository implements EventsRepositories {
  private events: Map<string, Events> = new Map();

  reset(): void {
    this.events.clear();
  }

  addEvent(event: Events): void {
    this.events.set(event.id, event);
  }

  async create(data: Events): Promise<Events> {
    this.events.set(data.id, data);
    return data;
  }

  async findById(id: string): Promise<Events | null> {
    return this.events.get(id) ?? null;
  }

  async findByCity(city: string): Promise<Events[]> {
    return [...this.events.values()].filter((e) => e.city === city);
  }

  async findByLocation(lat: number, lng: number): Promise<Events[]> {
    return [...this.events.values()].filter(
      (e) => e.lat === lat && e.lng === lng,
    );
  }

  async findByCategory(category: string): Promise<Events[]> {
    return [...this.events.values()].filter((e) => e.category === category);
  }

  async findByUser(host_id: string): Promise<Events[]> {
    return [...this.events.values()].filter((e) => e.host_id === host_id);
  }

  async update(id: string, data: Partial<Events>): Promise<Events> {
    const existing = this.events.get(id);
    if (!existing) throw new Error('Event not found');
    const merged = new Events(
      existing.id, data.host_id ?? existing.host_id,
      data.title ?? existing.title, data.category ?? existing.category,
      data.starts_at ?? existing.starts_at,
      data.duration_minutes ?? existing.duration_minutes,
      data.max_participants ?? existing.max_participants,
      data.current_count ?? existing.current_count,
      (data.status as event_status) ?? existing.status,
      data.is_public ?? existing.is_public,
      data.description ?? existing.description,
      data.address ?? existing.address,
      data.city ?? existing.city,
      data.cover_image_url ?? existing.cover_image_url,
      existing.created_at ?? undefined,
      new Date(),
      data.lat ?? existing.lat,
      data.lng ?? existing.lng,
    );
    this.events.set(id, merged);
    return merged;
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
  }

  async findAll(params: {
    city?: string;
    category?: string;
    status?: event_status;
    page?: number;
    limit?: number;
  }): Promise<Events[]> {
    let result = [...this.events.values()];
    if (params.city) result = result.filter((e) => e.city === params.city);
    if (params.category) result = result.filter((e) => e.category === params.category);
    if (params.status) result = result.filter((e) => e.status === params.status);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    return result.slice((page - 1) * limit, page * limit);
  }

  async findNearby(lat: number, lng: number, radiusKm: number = 50): Promise<Events[]> {
    return [...this.events.values()].filter(
      (e) => e.lat !== undefined && e.lng !== undefined,
    );
  }
}

export function createMockEvent(hostId: string, overrides?: Partial<Events>): Events {
  const id = crypto.randomUUID();
  return new Events(
    id, hostId,
    overrides?.title ?? 'Test Event',
    overrides?.category ?? 'sports',
    overrides?.starts_at ?? new Date(Date.now() + 86400000),
    overrides?.duration_minutes ?? 60,
    overrides?.max_participants ?? 10,
    overrides?.current_count ?? 1,
    (overrides?.status as event_status) ?? 'open',
    overrides?.is_public ?? true,
    overrides?.description ?? 'Description',
    overrides?.address ?? '123 Test St',
    overrides?.city ?? 'Casablanca',
    overrides?.cover_image_url,
    undefined, undefined,
    overrides?.lat ?? 33.5731,
    overrides?.lng ?? -7.5898,
  );
}
