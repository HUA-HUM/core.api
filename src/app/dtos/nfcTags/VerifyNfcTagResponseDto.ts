import { NfcTagClaimResponseDto } from './NfcTagClaimResponseDto';

export class VerifyNfcTagResponseDto {
  valid!: boolean;
  claim!: NfcTagClaimResponseDto | null;
}
