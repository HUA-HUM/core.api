import { ApiProperty } from '@nestjs/swagger';

export class RecordRitualSessionDto {
  @ApiProperty()
  ritualId!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty({ required: false, nullable: true })
  plannedEndAt?: string | null;

  @ApiProperty({ required: false, nullable: true })
  endedAt?: string | null;

  @ApiProperty({ enum: ['completed', 'cancelled'] })
  status!: 'completed' | 'cancelled';

  @ApiProperty({ enum: ['manual', 'schedule', 'nfc'] })
  startSource!: 'manual' | 'schedule' | 'nfc';

  @ApiProperty({ enum: ['timer', 'manual', 'nfc', 'schedule'] })
  endSource!: 'timer' | 'manual' | 'nfc' | 'schedule';
}
