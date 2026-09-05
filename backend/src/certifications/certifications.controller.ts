import { Controller, Get, Post, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CertificationsService } from './certifications.service';
import { CertificationEngineService } from './certification-engine.service';
import type { RequestWithUser } from '../common/request-with-user';

@Controller('v1/certifications')
export class CertificationsController {
  constructor(
    private certificationsService: CertificationsService,
    private engineService: CertificationEngineService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getMyCertifications(@Req() req: RequestWithUser) {
    return this.certificationsService.getCertifications(req.user.id);
  }

  @Get('evaluate')
  @UseGuards(AuthGuard('jwt'))
  async evaluateEligibility(@Req() req: RequestWithUser) {
    return this.engineService.evaluateUser(req.user.id);
  }

  @Get('awards')
  @UseGuards(AuthGuard('jwt'))
  async getMyAwards(@Req() req: RequestWithUser) {
    return this.engineService.getMyAwards(req.user.id);
  }

  @Post('award/:code')
  @UseGuards(AuthGuard('jwt'))
  async requestAward(@Req() req: RequestWithUser, @Param('code') code: string) {
    return this.engineService.awardCertification(req.user.id, code);
  }

  @Get('record')
  @UseGuards(AuthGuard('jwt'))
  async getProfessionalRecord(@Req() req: RequestWithUser) {
    return this.engineService.buildProfessionalRecord(req.user.id);
  }

  @Get('record/share')
  @UseGuards(AuthGuard('jwt'))
  async generateShareLink(@Req() req: RequestWithUser) {
    const token = await this.engineService.generateShareToken(req.user.id);
    return { shareUrl: `https://xpertclass.academy/record/${token}`, token };
  }

  @Get('record/:token')
  async getSharedRecord(@Param('token') token: string) {
    const record = await this.engineService.getShareableRecord(token);
    if (!record) return { error: 'Record not found' };
    return record;
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getAllCertifications() {
    return this.engineService.getAllCertifications();
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateCertification(@Param('id') id: string, @Body() body: { name?: string; description?: string; xpRequired?: number; isActive?: boolean; requirements?: Prisma.InputJsonValue }) {
    return this.engineService.updateCertification(id, body);
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getCertificationStats() {
    return this.engineService.getCertificationStats();
  }
}
