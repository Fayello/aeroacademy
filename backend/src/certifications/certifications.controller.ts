import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CertificationsService } from './certifications.service';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('certifications')
@ApiBearerAuth('JWT-auth')
@Controller('v1/certifications')
@UseGuards(AuthGuard('jwt'))
export class CertificationsController {
  constructor(private certificationsService: CertificationsService) {}

  @Get()
  async getMyCertifications(@Request() req: RequestWithUser) {
    return this.certificationsService.getCertifications(req.user.id);
  }
}
