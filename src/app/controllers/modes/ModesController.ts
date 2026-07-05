import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
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
import { ModesService } from '../../services/modes/ModesService';
import { ModeResponseDto } from '../../dtos/modes/ModeResponseDto';
import { UpdateModeDto } from '../../dtos/modes/UpdateModeDto';
import { ReplaceModeBlockedItemsDto } from '../../dtos/modeBlockedItems/ReplaceModeBlockedItemsDto';
import { ModeBlockedItemResponseDto } from '../../dtos/modeBlockedItems/ModeBlockedItemResponseDto';
import type { ModeBlockedItemPlatform } from '../../../core/entities/modeBlockedItems/ModeBlockedItem';
import { IdempotencyService } from '../../services/idempotency/IdempotencyService';

@ApiTags('modes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modes')
export class ModesController {
  constructor(
    private readonly modesService: ModesService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

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
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 200, type: ModeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateModeDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ModeResponseDto> {
    const mode = await this.idempotencyService.execute({
      userId: request.authUser.id,
      key: idempotencyKey,
      operation: 'update_mode_configuration',
      request: {
        modeId: id,
        title: body.title,
        icon: body.icon,
        appCount: body.appCount,
        categoryCount: body.categoryCount,
        domainCount: body.domainCount,
        selectionDigest: body.selectionDigest ?? null,
        isProtected: body.isProtected ?? false,
        nfcUnlockEnabled: body.nfcUnlockEnabled ?? false,
        passwordProvided: Boolean(body.password),
      },
      resourceType: 'mode',
      execute: () => this.modesService.update(request.authUser.id, id, body),
      replay: (resourceId) =>
        this.modesService.getById(request.authUser.id, resourceId),
      resourceId: (result) => result.id,
    });
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
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, type: [ModeBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async replaceBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReplaceModeBlockedItemsDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ModeBlockedItemResponseDto[]> {
    const items = await this.idempotencyService.execute({
      userId: request.authUser.id,
      key: idempotencyKey,
      operation: 'replace_mode_blocked_items',
      request: {
        modeId: id,
        platform: body.platform ?? null,
        items: body.items,
      },
      resourceType: 'mode_blocked_items',
      execute: () =>
        this.modesService.replaceBlockedItems(
          request.authUser.id,
          id,
          body.platform,
          body.items,
        ),
      replay: () =>
        this.modesService.listBlockedItems(
          request.authUser.id,
          id,
          body.platform,
        ),
      resourceId: () => id,
    });

    return items.map((item) => ModeBlockedItemResponseDto.fromEntity(item));
  }
}
