import { ApiProperty } from '@nestjs/swagger';
import { MonthlyRanking } from '../../../core/entities/ranking/MonthlyRanking';

export class RankingEntryResponseDto {
  @ApiProperty({ description: 'Position (ties share the same position)' })
  position!: number;

  @ApiProperty()
  totalFocusSeconds!: number;

  @ApiProperty()
  totalFocusMinutes!: number;

  @ApiProperty({ description: 'True for the authenticated user' })
  isMe!: boolean;

  @ApiProperty({
    example: 'Usuario 23',
    description:
      'Text to show: the real name for the authenticated user, a stable anonymous "Usuario N" for others',
  })
  label!: string;

  @ApiProperty({
    nullable: true,
    description: 'Only set when isMe is true; other users are anonymous',
  })
  displayName!: string | null;
}

export class RankingMeResponseDto {
  @ApiProperty({
    nullable: true,
    description: 'null when the user has no focus time this month',
  })
  position!: number | null;

  @ApiProperty({ nullable: true })
  displayName!: string | null;

  @ApiProperty()
  totalFocusSeconds!: number;

  @ApiProperty()
  totalFocusMinutes!: number;
}

export class MonthlyRankingResponseDto {
  @ApiProperty({ example: 'month' })
  period!: 'month';

  @ApiProperty({ description: 'ISO start of the month (inclusive)' })
  periodStart!: string;

  @ApiProperty({ description: 'ISO start of next month (exclusive)' })
  periodEnd!: string;

  @ApiProperty({ example: 'America/Argentina/Buenos_Aires' })
  timeZone!: string;

  @ApiProperty({ description: 'Total active users of the app' })
  totalUsers!: number;

  @ApiProperty({ description: 'Users with focus time this month' })
  participants!: number;

  @ApiProperty({ type: RankingMeResponseDto })
  me!: RankingMeResponseDto;

  @ApiProperty({ type: [RankingEntryResponseDto] })
  entries!: RankingEntryResponseDto[];

  static fromEntity(ranking: MonthlyRanking): MonthlyRankingResponseDto {
    return {
      period: 'month',
      periodStart: ranking.periodStart.toISOString(),
      periodEnd: ranking.periodEnd.toISOString(),
      timeZone: ranking.timeZone,
      totalUsers: ranking.totalUsers,
      participants: ranking.participants,
      me: {
        ...ranking.me,
        totalFocusMinutes: Math.floor(ranking.me.totalFocusSeconds / 60),
      },
      entries: ranking.entries.map((entry) => ({
        ...entry,
        totalFocusMinutes: Math.floor(entry.totalFocusSeconds / 60),
      })),
    };
  }
}
