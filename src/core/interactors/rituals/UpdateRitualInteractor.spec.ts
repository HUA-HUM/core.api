import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';
import { IRitualPasswordHasher } from '../../adapters/services/rituals/IRitualPasswordHasher';
import { Ritual } from '../../entities/rituals/Ritual';
import {
  UpdateRitualInteractor,
  UpdateRitualInteractorData,
} from './UpdateRitualInteractor';
import { RitualProtectionError } from './RitualProtectionError';

describe('UpdateRitualInteractor', () => {
  const ritualsRepository: jest.Mocked<IRitualsRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  };
  const passwordHasher: jest.Mocked<IRitualPasswordHasher> = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const interactor = new UpdateRitualInteractor(
    ritualsRepository,
    passwordHasher,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    ritualsRepository.updateById.mockResolvedValue(createRitual());
  });

  it('updates an unprotected ritual without a password', async () => {
    const ritual = createRitual({ isProtected: false, passwordHash: null });

    await interactor.execute(ritual, updateData({ isProtected: false }));

    expect(ritualsRepository.updateById).toHaveBeenCalledWith(
      ritual.id,
      expect.objectContaining({ isProtected: false, passwordHash: null }),
    );
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it('requires a password to edit an already-protected ritual', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });

    await expect(
      interactor.execute(ritual, updateData({ isProtected: true })),
    ).rejects.toEqual(new RitualProtectionError('RITUAL_PASSWORD_REQUIRED'));
    expect(ritualsRepository.updateById).not.toHaveBeenCalled();
  });

  it('requires the current password even to remove protection', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });

    await expect(
      interactor.execute(ritual, updateData({ isProtected: false })),
    ).rejects.toEqual(new RitualProtectionError('RITUAL_PASSWORD_REQUIRED'));
    expect(ritualsRepository.updateById).not.toHaveBeenCalled();
  });

  it('rejects an invalid password', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });
    passwordHasher.verify.mockResolvedValue(false);

    await expect(
      interactor.execute(
        ritual,
        updateData({ isProtected: true, password: 'wrong' }),
      ),
    ).rejects.toEqual(new RitualProtectionError('INVALID_RITUAL_PASSWORD'));
    expect(ritualsRepository.updateById).not.toHaveBeenCalled();
  });

  it('re-hashes the verified password and updates a protected ritual', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });
    passwordHasher.verify.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('new-hash');

    await interactor.execute(
      ritual,
      updateData({ isProtected: true, password: '1234' }),
    );

    expect(passwordHasher.verify).toHaveBeenCalledWith('1234', 'stored-hash');
    expect(passwordHasher.hash).toHaveBeenCalledWith('1234');
    expect(ritualsRepository.updateById).toHaveBeenCalledWith(
      ritual.id,
      expect.objectContaining({ isProtected: true, passwordHash: 'new-hash' }),
    );
  });

  it('authorizes removing protection with the correct password', async () => {
    const ritual = createRitual({
      isProtected: true,
      passwordHash: 'stored-hash',
    });
    passwordHasher.verify.mockResolvedValue(true);

    await interactor.execute(
      ritual,
      updateData({ isProtected: false, password: '1234' }),
    );

    expect(passwordHasher.verify).toHaveBeenCalledWith('1234', 'stored-hash');
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(ritualsRepository.updateById).toHaveBeenCalledWith(
      ritual.id,
      expect.objectContaining({ isProtected: false, passwordHash: null }),
    );
  });

  it('hashes a fresh password when protecting a previously open ritual', async () => {
    const ritual = createRitual({ isProtected: false, passwordHash: null });
    passwordHasher.hash.mockResolvedValue('new-hash');

    await interactor.execute(
      ritual,
      updateData({ isProtected: true, password: '1234' }),
    );

    expect(passwordHasher.verify).not.toHaveBeenCalled();
    expect(passwordHasher.hash).toHaveBeenCalledWith('1234');
    expect(ritualsRepository.updateById).toHaveBeenCalledWith(
      ritual.id,
      expect.objectContaining({ isProtected: true, passwordHash: 'new-hash' }),
    );
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

function updateData(
  overrides: Partial<UpdateRitualInteractorData> = {},
): UpdateRitualInteractorData {
  return {
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
    password: null,
    ...overrides,
  };
}
