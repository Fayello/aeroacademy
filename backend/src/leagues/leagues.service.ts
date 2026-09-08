import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaguesService {
  private readonly K_FACTOR = 32;

  constructor(private prisma: PrismaService) {}

  /**
   * Updates user ELO based on flag submission performance
   */
  async calculateUserElo(
    userId: string,
    labDifficulty: number,
    isCorrect: boolean,
  ) {
    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
    });
    const multiplier = activeSeason ? 1.2 : 1.0;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) return null;

      const oldRating = user.rank ?? 1200;
      const expectedScore =
        1 / (1 + Math.pow(10, (labDifficulty - oldRating) / 400));
      const actualScore = isCorrect ? 1 : 0;

      const change = Math.round(
        this.K_FACTOR * (actualScore - expectedScore) * multiplier,
      );
      const newRating = Math.max(0, oldRating + change);
      const division = this.getDivision(newRating);

      await tx.user.update({
        where: { id: userId },
        data: { rank: newRating, division },
      });

      return { newRating, division, change };
    });

    return result;
  }

  private getDivision(rating: number): string {
    if (rating >= 2400) return 'TITAN';
    if (rating >= 2000) return 'DIAMOND';
    if (rating >= 1600) return 'PLATINUM';
    if (rating >= 1200) return 'GOLD';
    if (rating >= 800) return 'SILVER';
    return 'BRONZE';
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.user.findMany({
      orderBy: { rank: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        rank: true,
        division: true,
        xp: true,
      },
    });
  }
}
