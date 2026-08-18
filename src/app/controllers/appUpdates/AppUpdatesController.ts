import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SaveAppUpdateConfigurationDto } from '../../dtos/appUpdates/SaveAppUpdateConfigurationDto';
import { AppUpdatesService } from '../../services/appUpdates/AppUpdatesService';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';

@ApiTags('app-updates')
@Controller('app-updates')
export class AppUpdatesController {
  constructor(private readonly service: AppUpdatesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check whether an app build should update' })
  @ApiQuery({ name: 'platform', example: 'ios', enum: ['ios', 'android'] })
  @ApiQuery({ name: 'build', example: '24' })
  @ApiQuery({ name: 'version', required: false, example: '1.0' })
  status(
    @Query('platform') platform: string,
    @Query('build') build: string,
    @Query('version') version?: string,
  ) {
    return this.service.status(platform, build, version);
  }

  @Get('admin/configuration')
  @UseGuards(InternalAnalyticsGuard)
  @ApiHeader({ name: 'x-internal-api-key', required: true })
  @ApiOperation({ summary: 'Read the app update configuration' })
  adminConfiguration(@Query('platform') platform: string) {
    return this.service.adminConfiguration(platform);
  }

  @Put('admin/configuration')
  @UseGuards(InternalAnalyticsGuard)
  @ApiHeader({ name: 'x-internal-api-key', required: true })
  @ApiOperation({ summary: 'Create or update the app update configuration' })
  save(@Body() body: SaveAppUpdateConfigurationDto) {
    return this.service.save(body);
  }
}
