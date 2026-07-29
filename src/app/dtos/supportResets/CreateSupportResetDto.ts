import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportResetDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  confirmationEmail!: string;

  @ApiProperty()
  reason!: string;

  @ApiPropertyOptional({ default: false })
  revokeTag?: boolean;
}
