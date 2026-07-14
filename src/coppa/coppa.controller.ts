import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoppaService } from './coppa.service';

@ApiTags('coppa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coppa')
export class CoppaController {
  constructor(private readonly service: CoppaService) {}

  @Post('check-age')
  @ApiOperation({ summary: 'Check if student requires parental consent' })
  checkAge(@Body('dateOfBirth') dateOfBirth: string) {
    return this.service.checkAgeEligibility(dateOfBirth);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Record parental consent' })
  recordConsent(
    @Req() req: any,
    @Body() body: { studentId: string; consentType: string },
  ) {
    return this.service.recordParentalConsent(
      req.user.tenantId,
      body.studentId,
      req.user.id,
      body.consentType,
    );
  }

  @Put('consent/:studentId/:consentType/revoke')
  @ApiOperation({ summary: 'Revoke parental consent' })
  revokeConsent(
    @Param('studentId') studentId: string,
    @Param('consentType') consentType: string,
  ) {
    return this.service.revokeConsent(studentId, consentType);
  }

  @Get('consent/:studentId')
  @ApiOperation({ summary: 'Get consent status for a student' })
  getConsentStatus(@Param('studentId') studentId: string) {
    return this.service.getConsentStatus(studentId);
  }

  @Get('verify/:studentId/:consentType')
  @ApiOperation({ summary: 'Verify if consent is granted' })
  verifyConsent(
    @Param('studentId') studentId: string,
    @Param('consentType') consentType: string,
  ) {
    return this.service.verifyConsent(studentId, consentType);
  }
}
