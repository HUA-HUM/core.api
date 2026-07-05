import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ActiveFocusSessionResponseDto } from '../../dtos/focusSessions/ActiveFocusSessionResponseDto';
import { FocusSessionsService } from '../../services/focusSessions/FocusSessionsService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';

@ApiTags('focus-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('focus-sessions')
export class FocusSessionsController {
  constructor(private readonly service: FocusSessionsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get the active focus session for the user' })
  @ApiResponse({ status: 200, type: ActiveFocusSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async active(
    @Req() request: AuthenticatedRequest,
  ): Promise<ActiveFocusSessionResponseDto | null> {
    const active = await this.service.active(request.authUser.id);
    return active ? ActiveFocusSessionResponseDto.fromEntity(active) : null;
  }
}
