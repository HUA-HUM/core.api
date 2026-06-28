import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ModesService } from '../../services/modes/ModesService';
import { ModeResponseDto } from '../../dtos/modes/ModeResponseDto';
import { UpdateModeDto } from '../../dtos/modes/UpdateModeDto';
import { ReplaceModeBlockedItemsDto } from '../../dtos/modeBlockedItems/ReplaceModeBlockedItemsDto';
import { ModeBlockedItemResponseDto } from '../../dtos/modeBlockedItems/ModeBlockedItemResponseDto';
import type { ModeBlockedItemPlatform } from '../../../core/entities/modeBlockedItems/ModeBlockedItem';

@ApiTags('modes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modes')
export class ModesController {
  constructor(private readonly modesService: ModesService) {}

  @Get()
  @ApiOperation({ summary: 'List modes for the authenticated user' })
  @ApiResponse({ status: 200, type: [ModeResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async list(@Req() request: AuthenticatedRequest): Promise<ModeResponseDto[]> {
    const modes = await this.modesService.listByUserId(request.authUser.id);
    return modes.map((mode) => ModeResponseDto.fromEntity(mode));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mode by id for the authenticated user' })
  @ApiResponse({ status: 200, type: ModeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ModeResponseDto> {
    const mode = await this.modesService.getById(request.authUser.id, id);
    return ModeResponseDto.fromEntity(mode);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mode configuration' })
  @ApiResponse({ status: 200, type: ModeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateModeDto,
  ): Promise<ModeResponseDto> {
    const mode = await this.modesService.update(request.authUser.id, id, body);
    return ModeResponseDto.fromEntity(mode);
  }

  @Get(':id/blocked-items')
  @ApiOperation({ summary: 'List blocked items for a mode' })
  @ApiResponse({ status: 200, type: [ModeBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async listBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('platform') platform?: ModeBlockedItemPlatform,
  ): Promise<ModeBlockedItemResponseDto[]> {
    const items = await this.modesService.listBlockedItems(
      request.authUser.id,
      id,
      platform,
    );

    return items.map((item) => ModeBlockedItemResponseDto.fromEntity(item));
  }

  @Post(':id/blocked-items')
  @ApiOperation({ summary: 'Replace blocked items for a mode' })
  @ApiResponse({ status: 201, type: [ModeBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async replaceBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReplaceModeBlockedItemsDto,
  ): Promise<ModeBlockedItemResponseDto[]> {
    const items = await this.modesService.replaceBlockedItems(
      request.authUser.id,
      id,
      body.platform,
      body.items,
    );

    return items.map((item) => ModeBlockedItemResponseDto.fromEntity(item));
  }
}
