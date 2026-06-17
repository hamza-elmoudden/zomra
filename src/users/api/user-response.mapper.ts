import { User } from '../domain/entities/user.entity';

export function toSafeUser(user: User) {
  const { password_hash, refresh_token, google_id, ...safe } = user as any;
  return safe;
}
