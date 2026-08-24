import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { CertificationEngineService } from '../certifications/certification-engine.service';

@Controller('v1/verify')
export class VerifyController {
  constructor(
    private coursesService: CoursesService,
    private engineService: CertificationEngineService,
  ) {}

  @Get(':courseId/:userId')
  async verifyCertificate(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ) {
    return this.coursesService.verifyCertificate(courseId, userId);
  }

  @Get('credential/:credentialId')
  async verifyCredential(@Param('credentialId') credentialId: string) {
    const award = await this.engineService.getAwardByCredentialId(credentialId);
    if (!award) {
      return { verified: false, error: 'Credential not found' };
    }

    const isExpired = award.expiresAt && new Date(award.expiresAt) < new Date();

    return {
      verified: true,
      credential: award.certification.name,
      code: award.certification.code,
      holder: award.user.name || award.user.email,
      issued: award.awardedAt,
      expires: award.expiresAt,
      expired: isExpired,
      evidenceSummary: award.evidenceSummary,
    };
  }
}
