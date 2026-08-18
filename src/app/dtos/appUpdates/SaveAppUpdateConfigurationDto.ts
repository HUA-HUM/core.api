import { ApiProperty } from '@nestjs/swagger';

export class SaveAppUpdateConfigurationDto {
  @ApiProperty({ enum: ['ios', 'android'], example: 'ios' })
  platform!: string;

  @ApiProperty({ example: '1.1.0' })
  latestVersion!: string;

  @ApiProperty({ example: 120 })
  latestBuild!: number;

  @ApiProperty({
    example: 120,
    description:
      'Builds below this value must update before continuing. Use the latest build to force everyone on an older build to update.',
  })
  minimumBuild!: number;

  @ApiProperty({ example: 'Hay una nueva versión de rituo' })
  title!: string;

  @ApiProperty({
    example:
      'Actualizá la app para seguir usando las últimas mejoras y protecciones.',
  })
  message!: string;

  @ApiProperty({
    example: 'https://apps.apple.com/app/id0000000000',
  })
  storeUrl!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
