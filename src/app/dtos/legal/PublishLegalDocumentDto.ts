import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LegalDocumentType } from '../../../core/entities/legal/LegalDocument';

export class PublishLegalDocumentDto {
  @ApiProperty({ enum: ['terms', 'privacy'] })
  type!: LegalDocumentType;

  @ApiProperty({ example: '1.1' })
  version!: string;

  @ApiProperty({ example: 'Términos y Condiciones Generales Rituo' })
  title!: string;

  @ApiProperty({
    description: 'Immutable complete text of the published document',
  })
  content!: string;

  @ApiPropertyOptional({
    example: 'https://rituo.io/legal/terminos-y-condiciones-1.1.pdf',
  })
  sourceUrl?: string;

  @ApiProperty({ example: '2026-08-15T00:00:00.000-03:00' })
  effectiveAt!: string;
}
