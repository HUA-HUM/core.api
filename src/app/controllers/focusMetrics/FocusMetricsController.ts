import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FocusMetricsSummaryResponseDto } from '../../dtos/focusMetrics/FocusMetricsSummaryResponseDto';
import { FocusMetricsService } from '../../services/focusMetrics/FocusMetricsService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';

@ApiTags('focus-metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('focus-metrics')
export class FocusMetricsController {
  constructor(private readonly focusMetricsService: FocusMetricsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get unified ritual and mode metrics for the authenticated user',
  })
  @ApiResponse({ status: 200, type: FocusMetricsSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async summary(
    @Req() request: AuthenticatedRequest,
  ): Promise<FocusMetricsSummaryResponseDto> {
    const summary = await this.focusMetricsService.summary(request.authUser.id);
    return FocusMetricsSummaryResponseDto.fromEntity(summary);
  }
}
