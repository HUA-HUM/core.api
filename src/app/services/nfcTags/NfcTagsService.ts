import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimNfcTagInteractor } from '../../../core/interactors/nfcTags/ClaimNfcTagInteractor';
import { ListUserNfcTagClaimsInteractor } from '../../../core/interactors/nfcTags/ListUserNfcTagClaimsInteractor';
import { VerifyNfcTagInteractor } from '../../../core/interactors/nfcTags/VerifyNfcTagInteractor';
import { RevokeNfcTagClaimInteractor } from '../../../core/interactors/nfcTags/RevokeNfcTagClaimInteractor';
import { NfcTagClaimNotFoundError } from '../../../core/interactors/nfcTags/NfcTagClaimNotFoundError';
import { UpdateNfcTagClaimLabelInteractor } from '../../../core/interactors/nfcTags/UpdateNfcTagClaimLabelInteractor';
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
    private readonly revokeNfcTagClaimInteractor: RevokeNfcTagClaimInteractor,
    private readonly updateNfcTagClaimLabelInteractor: UpdateNfcTagClaimLabelInteractor,
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

  async revoke(userId: string, claimId: string): Promise<void> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(claimId, 'claimId');

    try {
      await this.revokeNfcTagClaimInteractor.execute(claimId, userId);
    } catch (error) {
      if (error instanceof NfcTagClaimNotFoundError) {
        const currentClaim = await this.findCurrentClaim(userId);

        if (!currentClaim) {
          return;
        }

        await this.revokeNfcTagClaimInteractor.execute(currentClaim.id, userId);
        return;
      }

      throw error;
    }
  }

  async updateLabel(
    userId: string,
    claimId: string,
    label: string,
  ): Promise<NfcTagClaim> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(claimId, 'claimId');
    const normalizedLabel = label?.trim();

    if (!normalizedLabel) {
      throw new BadRequestException('label is required');
    }

    if (normalizedLabel.length > 60) {
      throw new BadRequestException('label must have at most 60 characters');
    }

    try {
      return await this.updateNfcTagClaimLabelInteractor.execute(
        claimId,
        userId,
        normalizedLabel,
      );
    } catch (error) {
      if (error instanceof NfcTagClaimNotFoundError) {
        const currentClaim = await this.findCurrentClaim(userId);

        if (!currentClaim) {
          throw new NotFoundException('NFC tag claim not found');
        }

        return this.updateNfcTagClaimLabelInteractor.execute(
          currentClaim.id,
          userId,
          normalizedLabel,
        );
      }

      throw error;
    }
  }

  private async findCurrentClaim(userId: string): Promise<NfcTagClaim | null> {
    const claims = await this.listUserNfcTagClaimsInteractor.execute(userId);
    return claims[0] ?? null;
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
