import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';
import { IRitualPasswordHasher } from '../../adapters/services/rituals/IRitualPasswordHasher';
import { Ritual } from '../../entities/rituals/Ritual';
import { DeleteRitualInteractor } from './DeleteRitualInteractor';
import { RitualProtectionError } from './RitualProtectionError';

describe('DeleteRitualInteractor', () => {
  const ritualsRepository: jest.Mocked<IRitualsRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    deleteById: jest.fn(),
  };
  const passwordHasher: jest.Mocked<IRitualPasswordHasher> = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const interactor = new DeleteRitualInteractor(
    ritualsRepository,
    passwordHasher,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes an unprotected ritual without a password', async () => {
    const ritual = createRitual({ isProtected: false, passwordHash: null });

    await interactor.execute(ritual);

    expect(ritualsRepository.deleteById).toHaveBeenCalledWith(ritual.id);
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it('requires a password for a protected ritual', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });

    await expect(interactor.execute(ritual)).rejects.toEqual(
      new RitualProtectionError('RITUAL_PASSWORD_REQUIRED'),
    );
    expect(ritualsRepository.deleteById).not.toHaveBeenCalled();
  });

  it('rejects an invalid password', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });
    passwordHasher.verify.mockResolvedValue(false);

    await expect(interactor.execute(ritual, 'wrong')).rejects.toEqual(
      new RitualProtectionError('INVALID_RITUAL_PASSWORD'),
    );
    expect(ritualsRepository.deleteById).not.toHaveBeenCalled();
  });

  it('deletes a protected ritual with the correct password', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });
    passwordHasher.verify.mockResolvedValue(true);

    await interactor.execute(ritual, '1234');

    expect(passwordHasher.verify).toHaveBeenCalledWith('1234', 'stored-hash');
    expect(ritualsRepository.deleteById).toHaveBeenCalledWith(ritual.id);
  });
});

function createRitual(overrides: Partial<Ritual> = {}): Ritual {
  return {
    id: 'ritual-id',
    userId: 'user-id',
    title: 'Lectura',
    description: null,
    icon: 'book',
    durationMinutes: 60,
    weekdays: [2],
    startTime: '10:00',
    endTime: '11:00',
    appCount: 1,
    categoryCount: 0,
    domainCount: 0,
    selectionDigest: '1 app',
    isProtected: false,
    nfcUnlockEnabled: false,
    passwordHash: null,
    status: 'active',
    createdAt: new Date('2026-06-09T10:00:00.000Z'),
    updatedAt: new Date('2026-06-09T10:00:00.000Z'),
    ...overrides,
  };
}
