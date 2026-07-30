import { createHash, createHmac } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ClaimNfcTagInteractor } from '../../../core/interactors/nfcTags/ClaimNfcTagInteractor';
import { ListUserNfcTagClaimsInteractor } from '../../../core/interactors/nfcTags/ListUserNfcTagClaimsInteractor';
import { VerifyNfcTagInteractor } from '../../../core/interactors/nfcTags/VerifyNfcTagInteractor';
import { RevokeNfcTagClaimInteractor } from '../../../core/interactors/nfcTags/RevokeNfcTagClaimInteractor';
import { NfcTagClaimNotFoundError } from '../../../core/interactors/nfcTags/NfcTagClaimNotFoundError';
import { UpdateNfcTagClaimLabelInteractor } from '../../../core/interactors/nfcTags/UpdateNfcTagClaimLabelInteractor';
import { NfcTagClaim } from '../../../core/entities/nfcTags/NfcTag';
import { NfcTagAlreadyClaimedError } from '../../../core/interactors/nfcTags/NfcTagAlreadyClaimedError';
import { GetActiveModeSessionInteractor } from '../../../core/interactors/modeSessions/GetActiveModeSessionInteractor';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';
import { ApiErrorCode, apiError } from '../../errors/ApiErrorResponse';
import { NfcTagLostError } from '../../../core/interactors/nfcTags/NfcTagLostError';
import { env } from '../../../config/env';

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
    private readonly getActiveModeSessionInteractor: GetActiveModeSessionInteractor,
    private readonly getActiveRitualSessionInteractor: GetActiveRitualSessionInteractor,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async prepareReviewDemo(
    userId: string,
  ): Promise<{ tagIdentifier: string; claim: NfcTagClaim }> {
    this.validateRequiredText(userId, 'userId');

    const rows = await this.entityManager.query<
      Array<{ email: string | null }>
    >(
      `
        select email
        from users
        where id = $1
          and status = 'active'
        limit 1
      `,
      [userId],
    );
    const authenticatedEmail = rows[0]?.email?.trim().toLowerCase();
    const reviewEmail = env.appReviewAccountEmail.trim().toLowerCase();

    if (!authenticatedEmail || authenticatedEmail !== reviewEmail) {
      throw new ForbiddenException(
        'virtual tag is only available to the configured App Review account',
      );
    }

    if (!env.jwtAccessSecret) {
      throw new Error('JWT_ACCESS_SECRET is required for the App Review tag');
    }

    const digest = createHmac('sha256', env.jwtAccessSecret)
      .update(`rituo-app-review-tag:${userId}`)
      .digest('hex')
      .toUpperCase();
    const tagIdentifier = `RITUO-REVIEW-${digest}`;
    const claim = await this.claim({
      userId,
      tagIdentifier,
      label: 'Cuenta de demostración',
    });

    return { tagIdentifier, claim };
  }

  async listByUserId(userId: string): Promise<NfcTagClaim[]> {
    this.validateRequiredText(userId, 'userId');
    return this.listUserNfcTagClaimsInteractor.execute(userId);
  }

  async claim(data: ClaimNfcTagServiceData): Promise<NfcTagClaim> {
    this.validateRequiredText(data.userId, 'userId');
    const tagHash = this.hashTagIdentifier(data.tagIdentifier);

    try {
      return await this.claimNfcTagInteractor.execute({
        userId: data.userId,
        tagHash,
        label: this.normalizeNullableText(data.label),
      });
    } catch (error) {
      if (error instanceof NfcTagAlreadyClaimedError) {
        throw new ConflictException(
          apiError(
            ApiErrorCode.nfcTagAlreadyClaimed,
            'nfc tag already belongs to another user',
          ),
        );
      }

      if (error instanceof NfcTagLostError) {
        throw new ConflictException(
          apiError(
            ApiErrorCode.nfcTagLost,
            'nfc tag was marked as lost and cannot be claimed',
          ),
        );
      }

      throw error;
    }
  }

  async verify(data: VerifyNfcTagServiceData): Promise<NfcTagClaim | null> {
    this.validateRequiredText(data.userId, 'userId');
    const tagHash = this.hashTagIdentifier(data.tagIdentifier);

    return this.verifyNfcTagInteractor.execute({
      userId: data.userId,
      tagHash,
    });
  }

  async requireActiveTag(userId: string): Promise<void> {
    this.validateRequiredText(userId, 'userId');
    const claims = await this.listUserNfcTagClaimsInteractor.execute(userId);

    if (claims.length === 0) {
      throw new ForbiddenException(
        apiError(ApiErrorCode.nfcTagRequired, 'nfc tag required'),
      );
    }
  }

  async verifyRequiredTag(data: VerifyNfcTagServiceData): Promise<NfcTagClaim> {
    const claim = await this.verify(data);

    if (!claim) {
      throw new ForbiddenException(
        apiError(ApiErrorCode.invalidNfcTag, 'invalid nfc tag'),
      );
    }

    return claim;
  }

  async revoke(userId: string, claimId: string): Promise<void> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(claimId, 'claimId');

    const targetClaim = await this.findClaimForUser(userId, claimId);

    if (!targetClaim) {
      return;
    }

    const [activeModeSession, activeRitualSession] = await Promise.all([
      this.getActiveModeSessionInteractor.execute(userId),
      this.getActiveRitualSessionInteractor.execute(userId),
    ]);

    if (activeModeSession || activeRitualSession) {
      throw new ConflictException(
        apiError(
          ApiErrorCode.nfcTagInUse,
          'cannot revoke nfc tag while a focus session is active',
        ),
      );
    }

    try {
      await this.revokeNfcTagClaimInteractor.execute(targetClaim.id, userId);
    } catch (error) {
      if (error instanceof NfcTagClaimNotFoundError) {
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

    const targetClaim = await this.findClaimForUser(userId, claimId);

    if (!targetClaim) {
      throw new NotFoundException('NFC tag claim not found');
    }

    try {
      return await this.updateNfcTagClaimLabelInteractor.execute(
        targetClaim.id,
        userId,
        normalizedLabel,
      );
    } catch (error) {
      if (error instanceof NfcTagClaimNotFoundError) {
        throw new NotFoundException('NFC tag claim not found');
      }

      throw error;
    }
  }

  private async findClaimForUser(
    userId: string,
    preferredClaimId: string,
  ): Promise<NfcTagClaim | null> {
    const claims = await this.listUserNfcTagClaimsInteractor.execute(userId);
    return claims.find((claim) => claim.id === preferredClaimId) ?? null;
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
