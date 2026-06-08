import { createHash } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ClaimNfcTagInteractor } from '../../../core/interactors/nfcTags/ClaimNfcTagInteractor';
import { ListUserNfcTagClaimsInteractor } from '../../../core/interactors/nfcTags/ListUserNfcTagClaimsInteractor';
import { VerifyNfcTagInteractor } from '../../../core/interactors/nfcTags/VerifyNfcTagInteractor';
import { NfcTagClaim } from '../../../core/entities/nfcTags/NfcTag';

export interface ClaimNfcTagServiceData {
  userId: string;
  tagIdentifier: string;
  label?: string | null;
}

export interface VerifyNfcTagServiceData {
  userId: string;
  tagIdentifier: string;
}

@Injectable()
export class NfcTagsService {
  constructor(
    private readonly claimNfcTagInteractor: ClaimNfcTagInteractor,
    private readonly listUserNfcTagClaimsInteractor: ListUserNfcTagClaimsInteractor,
    private readonly verifyNfcTagInteractor: VerifyNfcTagInteractor,
  ) {}

  async listByUserId(userId: string): Promise<NfcTagClaim[]> {
    this.validateRequiredText(userId, 'userId');
    return this.listUserNfcTagClaimsInteractor.execute(userId);
  }

  async claim(data: ClaimNfcTagServiceData): Promise<NfcTagClaim> {
    this.validateRequiredText(data.userId, 'userId');
    const tagHash = this.hashTagIdentifier(data.tagIdentifier);

    return this.claimNfcTagInteractor.execute({
      userId: data.userId,
      tagHash,
      label: this.normalizeNullableText(data.label),
    });
  }

  async verify(data: VerifyNfcTagServiceData): Promise<NfcTagClaim | null> {
    this.validateRequiredText(data.userId, 'userId');
    const tagHash = this.hashTagIdentifier(data.tagIdentifier);

    return this.verifyNfcTagInteractor.execute({
      userId: data.userId,
      tagHash,
    });
  }

  private hashTagIdentifier(tagIdentifier: string): string {
    const normalized = tagIdentifier?.trim();

    if (!normalized) {
      throw new BadRequestException('tagIdentifier is required');
    }

    if (normalized.length < 6) {
      throw new BadRequestException('tagIdentifier is too short');
    }

    return createHash('sha256').update(normalized).digest('hex');
  }

  private validateRequiredText(value: string, fieldName: string): void {
    if (!value?.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
