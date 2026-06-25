import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InternalAnalyticsOverviewResponseDto } from '../../dtos/internalAnalytics/InternalAnalyticsOverviewResponseDto';
import { InternalAnalyticsPeriodMetricsResponseDto } from '../../dtos/internalAnalytics/InternalAnalyticsPeriodMetricsResponseDto';
import { InternalAnalyticsRitualHistoryResponseDto } from '../../dtos/internalAnalytics/InternalAnalyticsRitualHistoryResponseDto';
import { InternalAnalyticsStreaksResponseDto } from '../../dtos/internalAnalytics/InternalAnalyticsStreaksResponseDto';
import { InternalAnalyticsService } from '../../services/internalAnalytics/InternalAnalyticsService';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';

@ApiTags('internal-analytics')
@UseGuards(InternalAnalyticsGuard)
@Controller('internal/analytics')
export class InternalAnalyticsController {
  constructor(
    private readonly internalAnalyticsService: InternalAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Internal monitor overview for Rituo operations' })
  @ApiHeader({
    name: 'x-internal-api-key',
    required: true,
    description: 'Internal analytics API key',
  })
  @ApiResponse({ status: 200, type: InternalAnalyticsOverviewResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid internal API key',
  })
  async overview(): Promise<InternalAnalyticsOverviewResponseDto> {
    const overview = await this.internalAnalyticsService.overview();
    return InternalAnalyticsOverviewResponseDto.fromEntity(overview);
  }

  @Get('rituals/:ritualId/history')
  @ApiOperation({ summary: 'Internal ritual session history by ritual id' })
  @ApiHeader({
    name: 'x-internal-api-key',
    required: true,
    description: 'Internal analytics API key',
  })
  @ApiResponse({ status: 200, type: InternalAnalyticsRitualHistoryResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid internal API key',
  })
  async ritualHistory(
    @Param('ritualId') ritualId: string,
    @Query('limit') limit?: string,
  ): Promise<InternalAnalyticsRitualHistoryResponseDto> {
    const history = await this.internalAnalyticsService.ritualHistory(
      ritualId,
      limit,
    );

    return InternalAnalyticsRitualHistoryResponseDto.fromEntity(history);
  }

  @Get('periods/:period')
  @ApiOperation({ summary: 'Internal weekly or monthly analytics buckets' })
  @ApiHeader({
    name: 'x-internal-api-key',
    required: true,
    description: 'Internal analytics API key',
  })
  @ApiResponse({ status: 200, type: InternalAnalyticsPeriodMetricsResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid internal API key',
  })
  async periodMetrics(
    @Param('period') period: string,
    @Query('buckets') buckets?: string,
  ): Promise<InternalAnalyticsPeriodMetricsResponseDto> {
    const metrics = await this.internalAnalyticsService.periodMetrics(
      period,
      buckets,
    );

    return InternalAnalyticsPeriodMetricsResponseDto.fromEntity(metrics);
  }

  @Get('streaks')
  @ApiOperation({ summary: 'Internal user streak leaderboard' })
  @ApiHeader({
    name: 'x-internal-api-key',
    required: true,
    description: 'Internal analytics API key',
  })
  @ApiResponse({ status: 200, type: InternalAnalyticsStreaksResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid internal API key',
  })
  async streaks(
    @Query('limit') limit?: string,
  ): Promise<InternalAnalyticsStreaksResponseDto> {
    const streaks = await this.internalAnalyticsService.streaks(limit);
    return InternalAnalyticsStreaksResponseDto.fromEntity(streaks);
  }
}
