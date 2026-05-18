import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRitualDto } from '../../dtos/rituals/CreateRitualDto';
import { RitualResponseDto } from '../../dtos/rituals/RitualResponseDto';
import { RitualsService } from '../../services/rituals/RitualsService';

@ApiTags('rituals')
@Controller('rituals')
export class RitualsController {
  constructor(private readonly ritualsService: RitualsService) {}

  @Get()
  @ApiOperation({ summary: 'List rituals for the authenticated user' })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Temporary user id header until JwtAuthGuard is added',
  })
  @ApiResponse({ status: 200, type: [RitualResponseDto] })
  async list(
    @Headers('x-user-id') userId: string,
  ): Promise<RitualResponseDto[]> {
    const rituals = await this.ritualsService.listByUserId(userId);
    return rituals.map((ritual) => RitualResponseDto.fromEntity(ritual));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ritual by id for the authenticated user' })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Temporary user id header until JwtAuthGuard is added',
  })
  @ApiResponse({ status: 200, type: RitualResponseDto })
  async getById(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ): Promise<RitualResponseDto> {
    const ritual = await this.ritualsService.getById(userId, id);
    return RitualResponseDto.fromEntity(ritual);
  }

  @Post()
  @ApiOperation({ summary: 'Create a ritual for the authenticated user' })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Temporary user id header until JwtAuthGuard is added',
  })
  @ApiResponse({ status: 201, type: RitualResponseDto })
  async create(
    @Headers('x-user-id') userId: string,
    @Body() body: CreateRitualDto,
  ): Promise<RitualResponseDto> {
    const ritual = await this.ritualsService.create({
      userId,
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
