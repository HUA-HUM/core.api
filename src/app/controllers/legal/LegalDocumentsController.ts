import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AcceptLegalDocumentsDto } from '../../dtos/legal/AcceptLegalDocumentsDto';
import { PublishLegalDocumentDto } from '../../dtos/legal/PublishLegalDocumentDto';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import { LegalDocumentsService } from '../../services/legal/LegalDocumentsService';

@ApiTags('legal')
@Controller('legal')
export class LegalDocumentsController {
  constructor(private readonly service: LegalDocumentsService) {}

  @Get('documents/active')
  @ApiOperation({ summary: 'List currently effective legal documents' })
  active() {
    return this.service.active();
  }

  @Get('requirements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return active documents and current user acceptance status',
  })
  requirements(@Request() request: AuthenticatedRequest) {
    return this.service.requirements(request.authUser.id);
  }

  @Post('acceptances')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept every currently effective document' })
  accept(
    @Request() request: AuthenticatedRequest,
    @Body() body: AcceptLegalDocumentsDto,
  ) {
    return this.service.accept(request.authUser.id, body);
  }

  @Get('admin/documents')
  @UseGuards(InternalAnalyticsGuard)
  @ApiHeader({ name: 'x-internal-api-key', required: true })
  @ApiOperation({ summary: 'List every immutable legal document version' })
  adminList() {
    return this.service.adminList();
  }

  @Post('admin/documents')
  @UseGuards(InternalAnalyticsGuard)
  @ApiHeader({ name: 'x-internal-api-key', required: true })
  @ApiOperation({ summary: 'Publish and activate a new document version' })
  publish(@Body() body: PublishLegalDocumentDto) {
    return this.service.publish(body);
  }
}
