import { PrismaClient, Section, Lesson } from '@prisma/client';

const prisma = new PrismaClient();

export async function upsertSection(courseId: string, title: string, order: number): Promise<Section> {
  const existing = await prisma.section.findFirst({ where: { courseId, order } });
  if (existing) {
    if (existing.title !== title) {
      await prisma.section.update({ where: { id: existing.id }, data: { title } });
    }
    return existing;
  }
  return prisma.section.create({ data: { courseId, title, order } });
}

export async function upsertLesson(sectionId: string, title: string, content: string, order: number): Promise<Lesson> {
  const existing = await prisma.lesson.findFirst({ where: { sectionId, order } });
  if (existing) {
    await prisma.lesson.update({ where: { id: existing.id }, data: { title, content } });
    return existing;
  }
  return prisma.lesson.create({ data: { sectionId, title, content, order } });
}

export { prisma };
