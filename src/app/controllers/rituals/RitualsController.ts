import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateRitualDto } from '../../dtos/rituals/CreateRitualDto';
import { ReplaceRitualBlockedItemsDto } from '../../dtos/ritualBlockedItems/ReplaceRitualBlockedItemsDto';
import { RitualBlockedItemResponseDto } from '../../dtos/ritualBlockedItems/RitualBlockedItemResponseDto';
import { RitualResponseDto } from '../../dtos/rituals/RitualResponseDto';
import { DeleteRitualDto } from '../../dtos/rituals/DeleteRitualDto';
import { RitualsService } from '../../services/rituals/RitualsService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { RitualBlockedItemPlatform } from '../../../core/entities/ritualBlockedItems/RitualBlockedItem';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { IdempotencyService } from '../../services/idempotency/IdempotencyService';

@ApiTags('rituals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rituals')
export class RitualsController {
  constructor(
    private readonly ritualsService: RitualsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List rituals for the authenticated user' })
  @ApiResponse({ status: 200, type: [RitualResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<RitualResponseDto[]> {
    const rituals = await this.ritualsService.listByUserId(request.authUser.id);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ritual for the authenticated user' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 204, description: 'Ritual deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: DeleteRitualDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.idempotencyService.execute({
      userId: request.authUser.id,
      key: idempotencyKey,
      operation: 'delete_ritual',
      request: {
        ritualId: id,
        passwordProvided: Boolean(body?.password),
      },
      resourceType: 'ritual',
      execute: () =>
        this.ritualsService.delete(request.authUser.id, id, body?.password),
      replay: async () => undefined,
      resourceId: () => id,
    });
  }

  @Get(':id/blocked-items')
  @ApiOperation({ summary: 'List blocked items for a ritual' })
  @ApiResponse({ status: 200, type: [RitualBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async listBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('platform') platform?: RitualBlockedItemPlatform,
  ): Promise<RitualBlockedItemResponseDto[]> {
    const items = await this.ritualsService.listBlockedItems(
      request.authUser.id,
      id,
      platform,
    );

    return items.map((item) => RitualBlockedItemResponseDto.fromEntity(item));
  }

  @Post(':id/blocked-items')
  @ApiOperation({ summary: 'Replace blocked items for a ritual' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, type: [RitualBlockedItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async replaceBlockedItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReplaceRitualBlockedItemsDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RitualBlockedItemResponseDto[]> {
    const items = await this.idempotencyService.execute({
      userId: request.authUser.id,
      key: idempotencyKey,
      operation: 'replace_ritual_blocked_items',
      request: {
        ritualId: id,
        platform: body.platform ?? null,
        items: body.items,
      },
      resourceType: 'ritual_blocked_items',
      execute: () =>
        this.ritualsService.replaceBlockedItems(
          request.authUser.id,
          id,
          body.platform,
          body.items,
        ),
      replay: () =>
        this.ritualsService.listBlockedItems(
          request.authUser.id,
          id,
          body.platform,
        ),
      resourceId: () => id,
    });

    return items.map((item) => RitualBlockedItemResponseDto.fromEntity(item));
  }

  @Post()
  @ApiOperation({ summary: 'Create a ritual for the authenticated user' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, type: RitualResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateRitualDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RitualResponseDto> {
    const ritual = await this.idempotencyService.execute({
      userId: request.authUser.id,
      key: idempotencyKey,
      operation: 'create_ritual_configuration',
      request: {
        title: body.title,
        description: body.description ?? null,
        icon: body.icon,
        durationMinutes: body.durationMinutes,
        weekdays: body.weekdays,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
        appCount: body.appCount,
        categoryCount: body.categoryCount,
        domainCount: body.domainCount,
        selectionDigest: body.selectionDigest ?? null,
        isProtected: body.isProtected ?? false,
        nfcUnlockEnabled: body.nfcUnlockEnabled ?? false,
        passwordProvided: Boolean(body.password),
      },
      resourceType: 'ritual',
      execute: () =>
        this.ritualsService.create({
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
          isProtected: body.isProtected,
          nfcUnlockEnabled: body.nfcUnlockEnabled,
          password: body.password,
        }),
      replay: (resourceId) =>
        this.ritualsService.getById(request.authUser.id, resourceId),
      resourceId: (result) => result.id,
    });

    return RitualResponseDto.fromEntity(ritual);
  }
}
