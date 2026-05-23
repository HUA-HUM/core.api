import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateRitualDto } from '../../dtos/rituals/CreateRitualDto';
import { ReplaceRitualBlockedItemsDto } from '../../dtos/ritualBlockedItems/ReplaceRitualBlockedItemsDto';
import { RitualBlockedItemResponseDto } from '../../dtos/ritualBlockedItems/RitualBlockedItemResponseDto';
import { RitualResponseDto } from '../../dtos/rituals/RitualResponseDto';
import { RitualsService } from '../../services/rituals/RitualsService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';

@ApiTags('rituals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rituals')
export class RitualsController {
  constructor(private readonly ritualsService: RitualsService) {}

  @Get()
  @ApiOperation({ summary: 'List rituals for the authenticated user' })
  @ApiResponse({ status: 200, type: [RitualResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<RitualResponseDto[]> {
    const rituals = await this.ritualsService.listByUserId(
      request.authUser.id,
    );
    return rituals.map((ritual) => RitualResponseDto.fromEntity(ritual));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ritual by id for the authenticated user' })
  @ApiResponse({ status: 200, type: RitualResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<RitualResponseDto> {
    const ritual = await this.ritualsService.getById(request.authUser.id, id);
    return RitualResponseDto.fromEntity(ritual);
  }


  @Get(':id/blocked-items')
  @ApiOperation({ summary: 'List blocked items for a ritual' })
  @ApiResponse({ status: 200, type: [RitualBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async listBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<RitualBlockedItemResponseDto[]> {
    const items = await this.ritualsService.listBlockedItems(
      request.authUser.id,
      id,
    );

    return items.map((item) => RitualBlockedItemResponseDto.fromEntity(item));
  }

  @Post(':id/blocked-items')
  @ApiOperation({ summary: 'Replace blocked items for a ritual' })
  @ApiResponse({ status: 201, type: [RitualBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async replaceBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReplaceRitualBlockedItemsDto,
  ): Promise<RitualBlockedItemResponseDto[]> {
    const items = await this.ritualsService.replaceBlockedItems(
      request.authUser.id,
      id,
      body.items,
    );

    return items.map((item) => RitualBlockedItemResponseDto.fromEntity(item));
  }

  @Post()
  @ApiOperation({ summary: 'Create a ritual for the authenticated user' })
  @ApiResponse({ status: 201, type: RitualResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateRitualDto,
  ): Promise<RitualResponseDto> {
    const ritual = await this.ritualsService.create({
      userId: request.authUser.id,
      title: body.title,
      description: body.description,
      icon: body.icon,
      durationMinutes: body.durationMinutes,
      weekdays: body.weekdays,
      startTime: body.startTime,
      endTime: body.endTime,
      appCount: body.appCount,
      categoryCount: body.categoryCount,
      domainCount: body.domainCount,
      selectionDigest: body.selectionDigest,
    });

    return RitualResponseDto.fromEntity(ritual);
  }
}
