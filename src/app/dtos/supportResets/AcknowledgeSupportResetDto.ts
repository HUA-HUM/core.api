import { ApiPropertyOptional } from '@nestjs/swagger';

export class AcknowledgeSupportResetDto {
  @ApiPropertyOptional()
  appVersion?: string;

  @ApiPropertyOptional()
  appBuild?: string;
}
