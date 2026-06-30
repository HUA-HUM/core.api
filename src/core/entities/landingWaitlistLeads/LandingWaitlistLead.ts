export interface LandingWaitlistLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  operatingSystem: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLandingWaitlistLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  operatingSystem: string;
}
