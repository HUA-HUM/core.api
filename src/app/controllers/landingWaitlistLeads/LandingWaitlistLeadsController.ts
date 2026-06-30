import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateLandingWaitlistLeadDto } from '../../dtos/landingWaitlistLeads/CreateLandingWaitlistLeadDto';
import { LandingWaitlistLeadResponseDto } from '../../dtos/landingWaitlistLeads/LandingWaitlistLeadResponseDto';
import { LandingWaitlistLeadsService } from '../../services/landingWaitlistLeads/LandingWaitlistLeadsService';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';

@ApiTags('landing-waitlist-leads')
@Controller('landing/waitlist-leads')
export class LandingWaitlistLeadsController {
  constructor(
    private readonly landingWaitlistLeadsService: LandingWaitlistLeadsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Join the landing waitlist' })
  @ApiResponse({ status: 201, type: LandingWaitlistLeadResponseDto })
  async create(
    @Body() body: CreateLandingWaitlistLeadDto,
  ): Promise<LandingWaitlistLeadResponseDto> {
    const lead = await this.landingWaitlistLeadsService.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      operatingSystem: body.operatingSystem,
    });

    return LandingWaitlistLeadResponseDto.fromEntity(lead);
  }

  @Get()
  @UseGuards(InternalAnalyticsGuard)
  @ApiOperation({ summary: 'List landing waitlist leads' })
  @ApiHeader({
    name: 'x-internal-api-key',
    required: true,
    description: 'Internal API key',
  })
  @ApiResponse({ status: 200, type: [LandingWaitlistLeadResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid internal API key',
  })
  async list(): Promise<LandingWaitlistLeadResponseDto[]> {
    const leads = await this.landingWaitlistLeadsService.list();
    return leads.map((lead) => LandingWaitlistLeadResponseDto.fromEntity(lead));
  }
}
