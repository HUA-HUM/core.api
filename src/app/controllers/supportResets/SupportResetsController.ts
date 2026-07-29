import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcknowledgeSupportResetDto } from '../../dtos/supportResets/AcknowledgeSupportResetDto';
import { CreateSupportResetDto } from '../../dtos/supportResets/CreateSupportResetDto';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { SupportResetsService } from '../../services/supportResets/SupportResetsService';

@ApiTags('support-resets')
@Controller('support-resets')
export class SupportResetsController {
  constructor(private readonly service: SupportResetsService) {}

  @Get('admin/users')
  @UseGuards(InternalAnalyticsGuard)
  @ApiHeader({ name: 'x-internal-api-key', required: true })
  @ApiOperation({ summary: 'Find users eligible for a support reset' })
  searchUsers(@Query('query') query: string) {
    return this.service.searchUsers(query);
  }

  @Post('admin/requests')
  @UseGuards(InternalAnalyticsGuard)
  @ApiHeader({ name: 'x-internal-api-key', required: true })
  @ApiOperation({ summary: 'Delete user configuration and enqueue an iOS release' })
  create(@Body() body: CreateSupportResetDto) {
    return this.service.create(body);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user pending support reset' })
  pending(@Request() request: AuthenticatedRequest) {
    return this.service.pending(request.authUser.id);
  }

  @Post(':id/acknowledge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm that local iOS restrictions were cleared' })
  acknowledge(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: AcknowledgeSupportResetDto,
  ) {
    return this.service.acknowledge(request.authUser.id, id, body);
  }
}
