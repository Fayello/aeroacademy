import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();
async function main(){
  const mdPath = path.join(__dirname, 'exemplar-cloud-models.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  const course = await prisma.course.findFirst({ where: { title: "Cloud Security & Hardening" } });
  if(!course){ console.error("Course not found"); return; }
  const section = await prisma.section.findFirst({ where: { courseId: course.id, title: { contains: "Cloud Fundamentals" } } });
  if(!section){ console.error("Section not found"); return; }
  const lesson = await prisma.lesson.findFirst({ where: { sectionId: section.id, title: { contains: "Cloud Service Models" } } });
  if(!lesson){ console.error("Lesson not found"); return; }
  await prisma.lesson.update({ where: { id: lesson.id }, data: { content } });
  console.log(`Updated exemplar: ${lesson.title} (${content.length} chars)`);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
