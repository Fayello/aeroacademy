import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const titles = [
    "Cloud Security & Hardening","Site Reliability Engineering","Full-Stack JavaScript Development",
    "Infrastructure as Code","Database Administration & Security","Kubernetes Administration & Security",
    "Python for Cybersecurity & Automation","API Design & Security","Malware Analysis & Reverse Engineering",
    "Incident Response & Digital Forensics"
  ];

  for (const title of titles) {
    const courses: any[] = await prisma.$queryRawUnsafe(
      `SELECT c.id, count(l.id) as lessons FROM "Course" c
       LEFT JOIN "Section" s ON s."courseId" = c.id
       LEFT JOIN "Lesson" l ON l."sectionId" = s.id
       WHERE c.title = $1 GROUP BY c.id ORDER BY lessons DESC`, title
    );
    if (courses.length <= 1) continue;
    const keep = courses[0].id;
    const remove = courses.slice(1).map((c: any) => c.id);
    console.log(`\n${title}: keep ${keep.slice(0,8)} (${courses[0].lessons} lessons), remove ${remove.length} dups`);

    for (const dupId of remove) {
      // Delete in FK order
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Answer" WHERE "questionId" IN (
          SELECT q.id FROM "Question" q JOIN "Quiz" qz ON qz.id = q."quizId"
          JOIN "Lesson" l ON l.id = qz."lessonId"
          JOIN "Section" s ON s.id = l."sectionId"
          WHERE s."courseId" = $1
        )`, dupId);
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Question" WHERE "quizId" IN (
          SELECT qz.id FROM "Quiz" qz
          JOIN "Lesson" l ON l.id = qz."lessonId"
          JOIN "Section" s ON s.id = l."sectionId"
          WHERE s."courseId" = $1
        )`, dupId);
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Progress" WHERE "lessonId" IN (
          SELECT l.id FROM "Lesson" l JOIN "Section" s ON s.id = l."sectionId" WHERE s."courseId" = $1
        )`, dupId);
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Quiz" WHERE "lessonId" IN (
          SELECT l.id FROM "Lesson" l JOIN "Section" s ON s.id = l."sectionId" WHERE s."courseId" = $1
        )`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Lesson" WHERE "sectionId" IN (SELECT id FROM "Section" WHERE "courseId" = $1)`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Section" WHERE "courseId" = $1`, dupId);
      // Clean enrollments/favorites/etc that reference course
      await prisma.$executeRawUnsafe(`DELETE FROM "CourseEnrollment" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "CourseReview" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "CourseFavorite" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "DiscussionPost" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "LearningPathCourse" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "ModuleCourse" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "TeamCourseEnrollment" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "CohortCourseAssignment" WHERE "courseId" = $1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Course" WHERE id = $1`, dupId);
      console.log(`  deleted ${dupId.slice(0,8)}`);
    }
  }

  const courses = await prisma.course.count();
  const lessons = await prisma.lesson.count();
  const quizzes = await prisma.quiz.count();
  console.log(`\nFinal: courses=${courses} lessons=${lessons} quizzes=${quizzes}`);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
