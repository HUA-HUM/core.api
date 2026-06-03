import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { FinishRitualSessionDto } from '../../dtos/ritualSessions/FinishRitualSessionDto';
import { RitualSessionResponseDto } from '../../dtos/ritualSessions/RitualSessionResponseDto';
import { StartRitualSessionDto } from '../../dtos/ritualSessions/StartRitualSessionDto';
import { RitualSessionsService } from '../../services/ritualSessions/RitualSessionsService';

@ApiTags('ritualSessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ritual-sessions')
export class RitualSessionsController {
  constructor(private readonly ritualSessionsService: RitualSessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a ritual session for the authenticated user' })
  @ApiResponse({ status: 201, type: RitualSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async start(
    @Req() request: AuthenticatedRequest,
    @Body() body: StartRitualSessionDto,
  ): Promise<RitualSessionResponseDto> {
    const session = await this.ritualSessionsService.start({
      userId: request.authUser.id,
      ritualId: body.ritualId,
      plannedEndAt: body.plannedEndAt,
      startSource: body.startSource,
    });

    return RitualSessionResponseDto.fromEntity(session);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active ritual session for the authenticated user' })
  @ApiResponse({ status: 200, type: RitualSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async active(
    @Req() request: AuthenticatedRequest,
  ): Promise<RitualSessionResponseDto | null> {
    const session = await this.ritualSessionsService.getActive(
      request.authUser.id,
    );

    return session ? RitualSessionResponseDto.fromEntity(session) : null;
  }

  @Get()
  @ApiOperation({ summary: 'List ritual sessions for the authenticated user' })
  @ApiResponse({ status: 200, type: [RitualSessionResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<RitualSessionResponseDto[]> {
    const sessions = await this.ritualSessionsService.list(request.authUser.id);
    return sessions.map((session) => RitualSessionResponseDto.fromEntity(session));
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Finish or cancel a ritual session' })
  @ApiResponse({ status: 200, type: RitualSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async finish(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: FinishRitualSessionDto,
  ): Promise<RitualSessionResponseDto> {
    const session = await this.ritualSessionsService.finish({
      userId: request.authUser.id,
      sessionId: id,
      status: body.status,
      endSource: body.endSource,
    });

    return RitualSessionResponseDto.fromEntity(session);
  }
}
