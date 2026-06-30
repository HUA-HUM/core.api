import { ApiProperty } from '@nestjs/swagger';

export class CreateLandingWaitlistLeadDto {
  @ApiProperty({ example: 'Arturo' })
  firstName!: string;

  @ApiProperty({ example: 'Gutierrez' })
  lastName!: string;

  @ApiProperty({ example: 'arturo@example.com' })
  email!: string;

  @ApiProperty({ example: '+5491112345678' })
  phoneNumber!: string;

  @ApiProperty({ example: 'iOS' })
  operatingSystem!: string;
}
