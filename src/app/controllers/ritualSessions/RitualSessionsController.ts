import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { FinishRitualSessionDto } from '../../dtos/ritualSessions/FinishRitualSessionDto';
import { RitualSessionResponseDto } from '../../dtos/ritualSessions/RitualSessionResponseDto';
import { RitualSessionSummaryResponseDto } from '../../dtos/ritualSessions/RitualSessionSummaryResponseDto';
import { StartRitualSessionDto } from '../../dtos/ritualSessions/StartRitualSessionDto';
import { RecordRitualSessionDto } from '../../dtos/ritualSessions/RecordRitualSessionDto';
import { RitualSessionsService } from '../../services/ritualSessions/RitualSessionsService';

@ApiTags('ritualSessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ritual-sessions')
export class RitualSessionsController {
  constructor(private readonly ritualSessionsService: RitualSessionsService) {}

  @Post('record')
  @ApiOperation({ summary: 'Record a ritual session that already happened' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique key used to safely retry this request',
  })
  @ApiResponse({ status: 201, type: RitualSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async record(
    @Req() request: AuthenticatedRequest,
    @Body() body: RecordRitualSessionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RitualSessionResponseDto> {
    const session = await this.ritualSessionsService.record({
      userId: request.authUser.id,
      ritualId: body.ritualId,
      startedAt: body.startedAt,
      plannedEndAt: body.plannedEndAt,
      endedAt: body.endedAt,
      status: body.status,
      startSource: body.startSource,
      endSource: body.endSource,
      idempotencyKey,
    });

    return RitualSessionResponseDto.fromEntity(session);
  }

  @Post('start')
  @ApiOperation({
    summary: 'Start a ritual session for the authenticated user',
  })
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
  @ApiOperation({
    summary: 'Get active ritual session for the authenticated user',
  })
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

  @Get('summary')
  @ApiOperation({
    summary: 'Get ritual session summary for the authenticated user',
  })
  @ApiResponse({ status: 200, type: RitualSessionSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async summary(
    @Req() request: AuthenticatedRequest,
  ): Promise<RitualSessionSummaryResponseDto> {
    const summary = await this.ritualSessionsService.summary(
      request.authUser.id,
    );

    return RitualSessionSummaryResponseDto.fromEntity(summary);
  }

  @Get('ritual/:ritualId')
  @ApiOperation({ summary: 'List ritual sessions by ritual id' })
  @ApiResponse({ status: 200, type: [RitualSessionResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async listByRitual(
    @Req() request: AuthenticatedRequest,
    @Param('ritualId') ritualId: string,
  ): Promise<RitualSessionResponseDto[]> {
    const sessions = await this.ritualSessionsService.listByRitualId(
      request.authUser.id,
      ritualId,
    );

    return sessions.map((session) =>
      RitualSessionResponseDto.fromEntity(session),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List ritual sessions for the authenticated user' })
  @ApiResponse({ status: 200, type: [RitualSessionResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<RitualSessionResponseDto[]> {
    const sessions = await this.ritualSessionsService.list(request.authUser.id);
    return sessions.map((session) =>
      RitualSessionResponseDto.fromEntity(session),
    );
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Finish or cancel a ritual session' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique key used to safely retry this request',
  })
  @ApiResponse({ status: 200, type: RitualSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async finish(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: FinishRitualSessionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RitualSessionResponseDto> {
    const session = await this.ritualSessionsService.finish({
      userId: request.authUser.id,
      sessionId: id,
      status: body.status,
      endSource: body.endSource,
      tagIdentifier: body.tagIdentifier,
      idempotencyKey,
    });

    return RitualSessionResponseDto.fromEntity(session);
  }
}
