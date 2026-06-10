import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { ClaimNfcTagDto } from '../../dtos/nfcTags/ClaimNfcTagDto';
import { NfcTagClaimResponseDto } from '../../dtos/nfcTags/NfcTagClaimResponseDto';
import { VerifyNfcTagDto } from '../../dtos/nfcTags/VerifyNfcTagDto';
import { VerifyNfcTagResponseDto } from '../../dtos/nfcTags/VerifyNfcTagResponseDto';
import { NfcTagsService } from '../../services/nfcTags/NfcTagsService';
import { UpdateNfcTagClaimDto } from '../../dtos/nfcTags/UpdateNfcTagClaimDto';

@ApiTags('nfc-tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nfc-tags')
export class NfcTagsController {
  constructor(private readonly nfcTagsService: NfcTagsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List NFC tags claimed by the authenticated user' })
  @ApiResponse({ status: 200, type: [NfcTagClaimResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async listMine(
    @Req() request: AuthenticatedRequest,
  ): Promise<NfcTagClaimResponseDto[]> {
    const claims = await this.nfcTagsService.listByUserId(request.authUser.id);
    return claims.map((claim) => NfcTagClaimResponseDto.fromEntity(claim));
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim an NFC tag for the authenticated user' })
  @ApiResponse({ status: 201, type: NfcTagClaimResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async claim(
    @Req() request: AuthenticatedRequest,
    @Body() body: ClaimNfcTagDto,
  ): Promise<NfcTagClaimResponseDto> {
    const claim = await this.nfcTagsService.claim({
      userId: request.authUser.id,
      tagIdentifier: body.tagIdentifier,
      label: body.label,
    });

    return NfcTagClaimResponseDto.fromEntity(claim);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify if an NFC tag belongs to the authenticated user' })
  @ApiResponse({ status: 201, type: VerifyNfcTagResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async verify(
    @Req() request: AuthenticatedRequest,
    @Body() body: VerifyNfcTagDto,
  ): Promise<VerifyNfcTagResponseDto> {
    const claim = await this.nfcTagsService.verify({
      userId: request.authUser.id,
      tagIdentifier: body.tagIdentifier,
    });

    return {
      valid: Boolean(claim),
      claim: claim ? NfcTagClaimResponseDto.fromEntity(claim) : null,
    };
  }

  @Patch(':claimId')
  @ApiOperation({ summary: 'Rename an NFC tag claim for the authenticated user' })
  @ApiResponse({ status: 200, type: NfcTagClaimResponseDto })
  @ApiResponse({ status: 404, description: 'NFC tag claim not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async updateLabel(
    @Req() request: AuthenticatedRequest,
    @Param('claimId') claimId: string,
    @Body() body: UpdateNfcTagClaimDto,
  ): Promise<NfcTagClaimResponseDto> {
    const claim = await this.nfcTagsService.updateLabel(
      request.authUser.id,
      claimId,
      body.label,
    );

    return NfcTagClaimResponseDto.fromEntity(claim);
  }

  @Delete(':claimId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an NFC tag claim for the authenticated user' })
  @ApiResponse({ status: 204, description: 'NFC tag claim revoked' })
  @ApiResponse({ status: 404, description: 'NFC tag claim not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async revoke(
    @Req() request: AuthenticatedRequest,
    @Param('claimId') claimId: string,
  ): Promise<void> {
    await this.nfcTagsService.revoke(request.authUser.id, claimId);
  }
}
