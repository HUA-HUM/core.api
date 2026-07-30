import { ApiProperty } from '@nestjs/swagger';
import { NfcTagClaimResponseDto } from './NfcTagClaimResponseDto';

export class ReviewDemoTagResponseDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({
    description:
      'Ephemeral client credential that represents the App Review virtual tag.',
  })
  tagIdentifier: string;

  @ApiProperty({ type: NfcTagClaimResponseDto })
  claim: NfcTagClaimResponseDto;
}
