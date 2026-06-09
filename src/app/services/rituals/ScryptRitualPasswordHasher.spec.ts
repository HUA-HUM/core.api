import { ScryptRitualPasswordHasher } from './ScryptRitualPasswordHasher';

describe('ScryptRitualPasswordHasher', () => {
  const hasher = new ScryptRitualPasswordHasher();

  it('hashes and verifies a password', async () => {
    const passwordHash = await hasher.hash('1234');

    await expect(hasher.verify('1234', passwordHash)).resolves.toBe(true);
    await expect(hasher.verify('4321', passwordHash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(hasher.verify('1234', 'invalid-hash')).resolves.toBe(false);
  });
});
