import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Any = any;

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CURRICULUM ↔ COURSE LINKING ──────────────────────

  async linkCourseToModule(moduleId: string, courseId: string): Promise<Any> {
    const module = await this.prisma.curriculumModule.findUnique({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Module not found');

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.moduleCourse.findUnique({
      where: { moduleId_courseId: { moduleId, courseId } },
    });
    if (existing) throw new ConflictException('Course already linked to this module');

    return this.prisma.moduleCourse.create({
      data: { moduleId, courseId },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async unlinkCourseFromModule(moduleId: string, courseId: string): Promise<Any> {
    await this.prisma.moduleCourse.delete({
      where: { moduleId_courseId: { moduleId, courseId } },
    });
    return { success: true };
  }

  async getModuleCourses(moduleId: string): Promise<Any[]> {
    return this.prisma.moduleCourse.findMany({
      where: { moduleId },
      include: { course: { select: { id: true, title: true, description: true, imageUrl: true } } },
    });
  }

  // ─── COHORT → COURSE ASSIGNMENTS ──────────────────────

  async assignCourseToCohort(cohortId: string, courseId: string, weight: number = 1.0, isRequired: boolean = true): Promise<Any> {
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new NotFoundException('Cohort not found');

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.cohortCourseAssignment.findUnique({
      where: { cohortId_courseId: { cohortId, courseId } },
    });
    if (existing) throw new ConflictException('Course already assigned to this cohort');

    return this.prisma.cohortCourseAssignment.create({
      data: { cohortId, courseId, weight, isRequired },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async unassignCourseFromCohort(cohortId: string, courseId: string): Promise<Any> {
    await this.prisma.cohortCourseAssignment.delete({
      where: { cohortId_courseId: { cohortId, courseId } },
    });
    return { success: true };
  }

  async getCohortCourses(cohortId: string): Promise<Any[]> {
    return this.prisma.cohortCourseAssignment.findMany({
      where: { cohortId },
      include: { course: { select: { id: true, title: true, description: true, imageUrl: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getStudentCohortCourses(userId: string): Promise<Any[]> {
    const memberships = await this.prisma.cohortMember.findMany({
      where: { userId },
      include: {
        cohort: {
          include: {
            courseAssignments: {
              include: { course: { select: { id: true, title: true, description: true, imageUrl: true } } },
            },
          },
        },
      },
    });

    return memberships.flatMap((m: Any) =>
      m.cohort.courseAssignments.map((ca: Any) => ({
        ...ca.course,
        cohortId: m.cohort.id,
        cohortName: m.cohort.name,
        weight: ca.weight,
        isRequired: ca.isRequired,
      }))
    );
  }

  // ─── COHORT DASHBOARD (ENHANCED) ──────────────────────

  async getCohortAcademicDashboard(cohortId: string): Promise<Any> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        curriculum: true,
        courseAssignments: {
          include: { course: { select: { id: true, title: true } } },
        },
        gradeCategories: {
          include: {
            entries: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    // Compute per-student grades
    const studentGrades = cohort.members.map((member: Any) => {
      let weightedScore = 0;
      let totalWeight = 0;

      for (const category of cohort.gradeCategories) {
        const categoryEntries = category.entries.filter((e: Any) => e.user.id === member.user.id);
        if (categoryEntries.length === 0) continue;

        const categoryAvg = categoryEntries.reduce((sum: number, e: Any) => sum + (e.score / e.maxScore) * 100 * e.weight, 0)
          / categoryEntries.reduce((sum: number, e: Any) => sum + e.weight, 0);

        weightedScore += categoryAvg * category.weight;
        totalWeight += category.weight;
      }

      const finalGrade = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 10) / 10 : 0;

      return {
        student: member.user,
        finalGrade,
        totalWeight,
      };
    });

    return {
      cohort: { id: cohort.id, name: cohort.name, year: cohort.year, semester: cohort.semester },
      curriculum: cohort.curriculum ? { id: cohort.curriculum.id, name: cohort.curriculum.name } : null,
      courses: cohort.courseAssignments.map((ca: Any) => ({
        id: ca.course.id,
        title: ca.course.title,
        weight: ca.weight,
        isRequired: ca.isRequired,
      })),
      categories: cohort.gradeCategories.map((cat: Any) => ({
        id: cat.id,
        name: cat.name,
        weight: cat.weight,
        entryCount: cat.entries.length,
      })),
      studentGrades: studentGrades.sort((a: Any, b: Any) => b.finalGrade - a.finalGrade),
    };
  }
}
