import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InternalAnalyticsOverviewResponseDto } from '../../dtos/internalAnalytics/InternalAnalyticsOverviewResponseDto';
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
  @ApiUnauthorizedResponse({ description: 'Missing or invalid internal API key' })
  async overview(): Promise<InternalAnalyticsOverviewResponseDto> {
    const overview = await this.internalAnalyticsService.overview();
    return InternalAnalyticsOverviewResponseDto.fromEntity(overview);
  }
}
