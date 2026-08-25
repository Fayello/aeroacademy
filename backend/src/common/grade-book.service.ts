import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Any = any;

@Injectable()
export class GradeBookService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GRADE CATEGORIES ─────────────────────────────────

  async createCategory(cohortId: string, name: string, weight: number, order?: number) {
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new NotFoundException('Cohort not found');

    // Validate total weight doesn't exceed 1.0
    const existingCategories = await this.prisma.gradeCategory.findMany({
      where: { cohortId },
    });
    const currentTotal = existingCategories.reduce((sum: number, c: Any) => sum + c.weight, 0);
    if (currentTotal + weight > 1.05) {
      throw new BadRequestException(`Total category weight would exceed 100% (currently ${Math.round(currentTotal * 100)}%)`);
    }

    return this.prisma.gradeCategory.create({
      data: {
        cohortId,
        name,
        weight,
        order: order ?? existingCategories.length,
      },
    });
  }

  async updateCategory(categoryId: string, data: { name?: string; weight?: number; order?: number }) {
    return this.prisma.gradeCategory.update({
      where: { id: categoryId },
      data,
    });
  }

  async deleteCategory(categoryId: string) {
    await this.prisma.gradeEntry.deleteMany({ where: { categoryId } });
    await this.prisma.gradeCategory.delete({ where: { id: categoryId } });
    return { success: true };
  }

  async getCategories(cohortId: string) {
    return this.prisma.gradeCategory.findMany({
      where: { cohortId },
      include: {
        entries: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  // ─── GRADE ENTRIES ────────────────────────────────────

  async addEntry(categoryId: string, data: {
    userId: string;
    title: string;
    score: number;
    maxScore?: number;
    weight?: number;
    comment?: string;
    gradedById?: string;
  }) {
    const category = await this.prisma.gradeCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    if (data.score < 0 || data.score > (data.maxScore ?? 100)) {
      throw new BadRequestException('Score must be between 0 and maxScore');
    }

    return this.prisma.gradeEntry.create({
      data: {
        categoryId,
        userId: data.userId,
        title: data.title,
        score: data.score,
        maxScore: data.maxScore ?? 100,
        weight: data.weight ?? 1.0,
        comment: data.comment,
        gradedById: data.gradedById,
        gradedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { name: true, weight: true } },
      },
    });
  }

  async bulkAddEntries(categoryId: string, entries: Array<{
    userId: string;
    title: string;
    score: number;
    maxScore?: number;
    weight?: number;
    comment?: string;
  }>, gradedById?: string) {
    const results: Any[] = [];
    for (const entry of entries) {
      try {
        const result = await this.addEntry(categoryId, { ...entry, gradedById });
        results.push({ userId: entry.userId, success: true, entry: result });
      } catch (err: any) {
        results.push({ userId: entry.userId, success: false, error: err.message });
      }
    }
    return results;
  }

  async updateEntry(entryId: string, data: { score?: number; comment?: string }) {
    return this.prisma.gradeEntry.update({
      where: { id: entryId },
      data: { ...data, gradedAt: new Date() },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { name: true, weight: true } },
      },
    });
  }

  async deleteEntry(entryId: string) {
    await this.prisma.gradeEntry.delete({ where: { id: entryId } });
    return { success: true };
  }

  // ─── STUDENT GRADE VIEW ──────────────────────────────

  async getStudentGrades(userId: string, cohortId: string) {
    const member = await this.prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member of this cohort');

    const categories = await this.prisma.gradeCategory.findMany({
      where: { cohortId },
      include: {
        entries: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    let weightedScore = 0;
    let totalWeight = 0;

    const categoryGrades = categories.map((cat: Any) => {
      if (cat.entries.length === 0) return { category: cat.name, weight: cat.weight, average: null, entries: [] };

      const categoryAvg = cat.entries.reduce((sum: number, e: Any) => sum + (e.score / e.maxScore) * 100 * e.weight, 0)
        / cat.entries.reduce((sum: number, e: Any) => sum + e.weight, 0);

      weightedScore += categoryAvg * cat.weight;
      totalWeight += cat.weight;

      return {
        category: cat.name,
        weight: cat.weight,
        average: Math.round(categoryAvg * 10) / 10,
        entries: cat.entries.map((e: Any) => ({
          id: e.id,
          title: e.title,
          score: e.score,
          maxScore: e.maxScore,
          percentage: Math.round((e.score / e.maxScore) * 100 * 10) / 10,
          comment: e.comment,
          gradedAt: e.gradedAt,
        })),
      };
    });

    const finalGrade = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 10) / 10 : 0;

    return {
      cohortId,
      categories: categoryGrades,
      finalGrade,
      totalWeight,
    };
  }

  // ─── COHORT GRADE BOOK ──────────────────────────────

  async getCohortGradeBook(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        gradeCategories: {
          include: {
            entries: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    const students = cohort.members
      .filter((m: Any) => m.role === 'STUDENT')
      .map((m: Any) => {
        const studentEntries = cohort.gradeCategories.flatMap((cat: Any) =>
          cat.entries.filter((e: Any) => e.userId === m.user.id)
        );

        let weightedScore = 0;
        let totalWeight = 0;

        const categoryGrades = cohort.gradeCategories.map((cat: Any) => {
          const catEntries = cat.entries.filter((e: Any) => e.userId === m.user.id);
          if (catEntries.length === 0) return { categoryId: cat.id, name: cat.name, weight: cat.weight, average: null };

          const avg = catEntries.reduce((sum: number, e: Any) => sum + (e.score / e.maxScore) * 100 * e.weight, 0)
            / catEntries.reduce((sum: number, e: Any) => sum + e.weight, 0);

          weightedScore += avg * cat.weight;
          totalWeight += cat.weight;

          return { categoryId: cat.id, name: cat.name, weight: cat.weight, average: Math.round(avg * 10) / 10 };
        });

        const finalGrade = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 10) / 10 : 0;

        return {
          student: m.user,
          categories: categoryGrades,
          finalGrade,
        };
      });

    return {
      cohort: { id: cohort.id, name: cohort.name },
      categories: cohort.gradeCategories.map((cat: Any) => ({
        id: cat.id,
        name: cat.name,
        weight: cat.weight,
      })),
      students: students.sort((a: Any, b: Any) => b.finalGrade - a.finalGrade),
    };
  }

  // ─── GPA CALCULATION ─────────────────────────────────

  async calculateGPA(userId: string) {
    const memberships = await this.prisma.cohortMember.findMany({
      where: { userId, role: 'STUDENT' },
      include: {
        cohort: {
          include: {
            curriculum: true,
            gradeCategories: {
              include: {
                entries: { where: { userId } },
              },
            },
          },
        },
      },
    });

    let totalWeightedGPA = 0;
    let totalCredits = 0;

    const transcript: Any[] = [];

    for (const membership of memberships) {
      const cohort = membership.cohort;
      if (!cohort.curriculum) continue;

      let weightedScore = 0;
      let totalWeight = 0;

      for (const category of cohort.gradeCategories) {
        if (category.entries.length === 0) continue;

        const categoryAvg = category.entries.reduce((sum: number, e: Any) => sum + (e.score / e.maxScore) * 100 * e.weight, 0)
          / category.entries.reduce((sum: number, e: Any) => sum + e.weight, 0);

        weightedScore += categoryAvg * category.weight;
        totalWeight += category.weight;
      }

      const finalGrade = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const gpaPoints = this.scoreToGPA(finalGrade);

      transcript.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        curriculum: cohort.curriculum.name,
        degree: cohort.curriculum.degree,
        semester: cohort.semester,
        year: cohort.year,
        finalGrade: Math.round(finalGrade * 10) / 10,
        gpaPoints: Math.round(gpaPoints * 100) / 100,
      });
    }

    // Calculate cumulative GPA
    if (transcript.length > 0) {
      totalWeightedGPA = transcript.reduce((sum, t) => sum + t.gpaPoints, 0);
      totalCredits = transcript.length; // Each cohort counts as 1 credit unit
    }

    const cumulativeGPA = totalCredits > 0 ? Math.round((totalWeightedGPA / totalCredits) * 100) / 100 : 0;

    // Upsert GPA record
    await this.prisma.studentGPA.upsert({
      where: { userId },
      create: { userId, cumulativeGPA, totalCredits, lastCalculatedAt: new Date() },
      update: { cumulativeGPA, totalCredits, lastCalculatedAt: new Date() },
    });

    return {
      userId,
      cumulativeGPA,
      totalCredits,
      transcript,
    };
  }

  private scoreToGPA(score: number): number {
    if (score >= 93) return 4.0;
    if (score >= 90) return 3.7;
    if (score >= 87) return 3.3;
    if (score >= 83) return 3.0;
    if (score >= 80) return 2.7;
    if (score >= 77) return 2.3;
    if (score >= 73) return 2.0;
    if (score >= 70) return 1.7;
    if (score >= 67) return 1.3;
    if (score >= 60) return 1.0;
    return 0.0;
  }
}
