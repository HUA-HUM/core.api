import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptLegalDocumentsDto {
  @ApiProperty({ type: [String] })
  documentIds!: string[];

  @ApiProperty({ example: 'ios' })
  platform!: string;

  @ApiPropertyOptional({ example: '1.0 (21)' })
  appVersion?: string;

  @ApiPropertyOptional({ example: 'es-AR' })
  locale?: string;
}
