import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MonthlyRankingResponseDto } from '../../dtos/ranking/MonthlyRankingResponseDto';
import { RankingService } from '../../services/ranking/RankingService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';

@ApiTags('ranking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  @ApiOperation({
    summary:
      'Monthly focus-time ranking. Shows every position, but only the authenticated user is identified by name',
  })
  @ApiResponse({ status: 200, type: MonthlyRankingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async monthly(
    @Req() request: AuthenticatedRequest,
  ): Promise<MonthlyRankingResponseDto> {
    const ranking = await this.rankingService.monthly(request.authUser.id);
    return MonthlyRankingResponseDto.fromEntity(ranking);
  }
}
