import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
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
import { UseEmergencyUnlockDto } from '../../dtos/focusSessions/UseEmergencyUnlockDto';
import { EmergencyUnlockStatusResponseDto } from '../../dtos/focusSessions/EmergencyUnlockStatusResponseDto';
import { EmergencyUnlockResponseDto } from '../../dtos/focusSessions/EmergencyUnlockResponseDto';

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

  @Get('emergency-unlock')
  @ApiOperation({ summary: 'Get emergency unlock availability' })
  @ApiResponse({ status: 200, type: EmergencyUnlockStatusResponseDto })
  async emergencyUnlockStatus(
    @Req() request: AuthenticatedRequest,
  ): Promise<EmergencyUnlockStatusResponseDto> {
    const status = await this.service.emergencyUnlockStatus(
      request.authUser.id,
    );
    return EmergencyUnlockStatusResponseDto.fromEntity(status);
  }

  @Post('emergency-unlock')
  @ApiOperation({
    summary: 'Stop the active focus session without the NFC tag',
  })
  @ApiResponse({ status: 201, type: EmergencyUnlockResponseDto })
  async emergencyUnlock(
    @Req() request: AuthenticatedRequest,
    @Body() body: UseEmergencyUnlockDto,
  ): Promise<EmergencyUnlockResponseDto> {
    const unlock = await this.service.useEmergencyUnlock(
      request.authUser.id,
      body.reason,
    );
    return EmergencyUnlockResponseDto.fromEntity(unlock);
  }
}
