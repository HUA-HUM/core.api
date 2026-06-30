import { LandingWaitlistLead } from '../../../core/entities/landingWaitlistLeads/LandingWaitlistLead';
import { requiredDateISOString } from '../common/dateResponse';

export class LandingWaitlistLeadResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phoneNumber!: string;
  operatingSystem!: string;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(lead: LandingWaitlistLead): LandingWaitlistLeadResponseDto {
    return {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      operatingSystem: lead.operatingSystem,
      createdAt: requiredDateISOString(lead.createdAt, 'createdAt'),
      updatedAt: requiredDateISOString(lead.updatedAt, 'updatedAt'),
    };
  }
}
