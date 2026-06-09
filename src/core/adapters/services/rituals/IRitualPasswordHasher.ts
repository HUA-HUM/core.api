export const RITUAL_PASSWORD_HASHER = Symbol('RITUAL_PASSWORD_HASHER');

export interface IRitualPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}
