import { BadRequestException } from '@nestjs/common';
import {
  CreateLandingWaitlistLeadData,
  LandingWaitlistLead,
} from '../../../core/entities/landingWaitlistLeads/LandingWaitlistLead';
import { CreateLandingWaitlistLeadInteractor } from '../../../core/interactors/landingWaitlistLeads/CreateLandingWaitlistLeadInteractor';
import { ListLandingWaitlistLeadsInteractor } from '../../../core/interactors/landingWaitlistLeads/ListLandingWaitlistLeadsInteractor';
import { LandingWaitlistLeadsService } from './LandingWaitlistLeadsService';

describe('LandingWaitlistLeadsService', () => {
  it('normalizes lead data before saving it', async () => {
    const createdAt = new Date('2026-06-30T10:00:00.000Z');
    const updatedAt = new Date('2026-06-30T10:00:00.000Z');
    const executeCreate = jest.fn(
      (data: CreateLandingWaitlistLeadData): Promise<LandingWaitlistLead> =>
        Promise.resolve({
          id: 'lead-id',
          ...data,
          createdAt,
          updatedAt,
        }),
    );
    const createInteractor = {
      execute: executeCreate,
    } as unknown as CreateLandingWaitlistLeadInteractor;
    const listInteractor = {
      execute: jest.fn(),
    } as unknown as ListLandingWaitlistLeadsInteractor;
    const service = new LandingWaitlistLeadsService(
      createInteractor,
      listInteractor,
    );

    const result = await service.create({
      firstName: ' Arturo ',
      lastName: ' Gutierrez ',
      email: ' Arturo@Example.COM ',
      phoneNumber: ' +5491112345678 ',
      operatingSystem: ' iOS ',
    });

    expect(executeCreate).toHaveBeenCalledWith({
      firstName: 'Arturo',
      lastName: 'Gutierrez',
      email: 'arturo@example.com',
      phoneNumber: '+5491112345678',
      operatingSystem: 'iOS',
    });
    expect(result).toMatchObject({
      id: 'lead-id',
      email: 'arturo@example.com',
    });
  });

  it('rejects invalid emails', async () => {
    const executeCreate = jest.fn();
    const createInteractor = {
      execute: executeCreate,
    } as unknown as CreateLandingWaitlistLeadInteractor;
    const listInteractor = {
      execute: jest.fn(),
    } as unknown as ListLandingWaitlistLeadsInteractor;
    const service = new LandingWaitlistLeadsService(
      createInteractor,
      listInteractor,
    );

    await expect(
      service.create({
        firstName: 'Arturo',
        lastName: 'Gutierrez',
        email: 'not-an-email',
        phoneNumber: '+5491112345678',
        operatingSystem: 'iOS',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(executeCreate).not.toHaveBeenCalled();
  });
});
