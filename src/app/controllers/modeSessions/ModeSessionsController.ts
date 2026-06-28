import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { FinishModeSessionDto } from '../../dtos/modeSessions/FinishModeSessionDto';
import { ModeSessionResponseDto } from '../../dtos/modeSessions/ModeSessionResponseDto';
import { ModeSessionSummaryResponseDto } from '../../dtos/modeSessions/ModeSessionSummaryResponseDto';
import { StartModeSessionDto } from '../../dtos/modeSessions/StartModeSessionDto';
import { ModeSessionsService } from '../../services/modeSessions/ModeSessionsService';

@ApiTags('modeSessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mode-sessions')
export class ModeSessionsController {
  constructor(private readonly modeSessionsService: ModeSessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a mode session for the authenticated user' })
  @ApiResponse({ status: 201, type: ModeSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async start(
    @Req() request: AuthenticatedRequest,
    @Body() body: StartModeSessionDto,
  ): Promise<ModeSessionResponseDto> {
    const session = await this.modeSessionsService.start({
      userId: request.authUser.id,
      modeId: body.modeId,
      startSource: body.startSource,
    });

    return ModeSessionResponseDto.fromEntity(session);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active mode session for the authenticated user',
  })
  @ApiResponse({ status: 200, type: ModeSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async active(
    @Req() request: AuthenticatedRequest,
  ): Promise<ModeSessionResponseDto | null> {
    const session = await this.modeSessionsService.getActive(
      request.authUser.id,
    );

    return session ? ModeSessionResponseDto.fromEntity(session) : null;
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get mode session summary for the authenticated user',
  })
  @ApiResponse({ status: 200, type: ModeSessionSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async summary(
    @Req() request: AuthenticatedRequest,
  ): Promise<ModeSessionSummaryResponseDto> {
    const summary = await this.modeSessionsService.summary(request.authUser.id);
    return ModeSessionSummaryResponseDto.fromEntity(summary);
  }

  @Get('mode/:modeId')
  @ApiOperation({ summary: 'List mode sessions by mode id' })
  @ApiResponse({ status: 200, type: [ModeSessionResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async listByMode(
    @Req() request: AuthenticatedRequest,
    @Param('modeId') modeId: string,
  ): Promise<ModeSessionResponseDto[]> {
    const sessions = await this.modeSessionsService.listByModeId(
      request.authUser.id,
      modeId,
    );

    return sessions.map((session) =>
      ModeSessionResponseDto.fromEntity(session),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List mode sessions for the authenticated user' })
  @ApiResponse({ status: 200, type: [ModeSessionResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<ModeSessionResponseDto[]> {
    const sessions = await this.modeSessionsService.list(request.authUser.id);
    return sessions.map((session) =>
      ModeSessionResponseDto.fromEntity(session),
    );
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Finish or cancel a mode session' })
  @ApiResponse({ status: 200, type: ModeSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async finish(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: FinishModeSessionDto,
  ): Promise<ModeSessionResponseDto> {
    const session = await this.modeSessionsService.finish({
      userId: request.authUser.id,
      sessionId: id,
      status: body.status,
      endSource: body.endSource,
    });

    return ModeSessionResponseDto.fromEntity(session);
  }
}
