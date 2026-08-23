import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getActiveSeason() {
    const season = await this.prisma.season.findFirst({
      where: { isActive: true },
      include: {
        battlePass: { include: { tiers: { orderBy: { tierNumber: 'asc' } } } },
      },
    });
    return season;
  }

  async getAllSeasons() {
    return this.prisma.season.findMany({ orderBy: { startDate: 'desc' } });
  }

  async createSeason(data: {
    name: string;
    theme?: string;
    xpMultiplier?: number;
    startDate: string;
    endDate: string;
  }) {
    const activeSeason = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (activeSeason) {
      throw new BadRequestException('A season is already active. End it before starting a new one.');
    }

    const season = await this.prisma.season.create({
      data: {
        name: data.name,
        theme: data.theme,
        xpMultiplier: data.xpMultiplier ?? 1.0,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true,
      },
    });

    this.logger.log(`Season created: ${season.name}`);
    return season;
  }

  async endSeason(seasonId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    await this.prisma.season.update({
      where: { id: seasonId },
      data: { isActive: false },
    });

    this.logger.log(`Season ended: ${season.name}`);
    return { message: 'Season ended successfully' };
  }

  async rotateSeason() {
    const active = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (active) {
      await this.prisma.season.update({ where: { id: active.id }, data: { isActive: false } });
      this.logger.log(`Ended season: ${active.name}`);
    }
    return { message: 'Season rotation complete', ended: active?.name ?? null };
  }
}
