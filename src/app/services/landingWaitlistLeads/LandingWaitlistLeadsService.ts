import { BadRequestException, Injectable } from '@nestjs/common';
import { LandingWaitlistLead } from '../../../core/entities/landingWaitlistLeads/LandingWaitlistLead';
import { CreateLandingWaitlistLeadInteractor } from '../../../core/interactors/landingWaitlistLeads/CreateLandingWaitlistLeadInteractor';
import { ListLandingWaitlistLeadsInteractor } from '../../../core/interactors/landingWaitlistLeads/ListLandingWaitlistLeadsInteractor';

export interface CreateLandingWaitlistLeadServiceData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  operatingSystem: string;
}

@Injectable()
export class LandingWaitlistLeadsService {
  constructor(
    private readonly createLandingWaitlistLeadInteractor: CreateLandingWaitlistLeadInteractor,
    private readonly listLandingWaitlistLeadsInteractor: ListLandingWaitlistLeadsInteractor,
  ) {}

  async create(
    data: CreateLandingWaitlistLeadServiceData,
  ): Promise<LandingWaitlistLead> {
    return this.createLandingWaitlistLeadInteractor.execute({
      firstName: this.normalizeRequiredText(data.firstName, 'firstName', 120),
      lastName: this.normalizeRequiredText(data.lastName, 'lastName', 120),
      email: this.normalizeEmail(data.email),
      phoneNumber: this.normalizeRequiredText(
        data.phoneNumber,
        'phoneNumber',
        40,
      ),
      operatingSystem: this.normalizeRequiredText(
        data.operatingSystem,
        'operatingSystem',
        80,
      ),
    });
  }

  async list(): Promise<LandingWaitlistLead[]> {
    return this.listLandingWaitlistLeadsInteractor.execute();
  }

  private normalizeRequiredText(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} is required`);
    }

    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    if (normalized.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must have at most ${maxLength} characters`,
      );
    }

    return normalized;
  }

  private normalizeEmail(value: unknown): string {
    const email = this.normalizeRequiredText(value, 'email', 320).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('email must be valid');
    }

    return email;
  }
}
