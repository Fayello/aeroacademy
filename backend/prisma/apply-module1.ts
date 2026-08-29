import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();
async function main(){
  const md = fs.readFileSync(path.join(__dirname, 'module1-who-secures-what.md'), 'utf8');
  const course = await prisma.course.findFirst({ where: { title: "Cloud Security & Hardening" } });
  if(!course) throw new Error("Course not found");
  const section = await prisma.section.findFirst({ where: { courseId: course.id, title: { contains: "Cloud Fundamentals" } } });
  if(!section) throw new Error("Section not found");
  const lesson = await prisma.lesson.findFirst({ where: { sectionId: section.id, title: { contains: "Cloud Service Models" } } });
  if(!lesson) throw new Error("Lesson not found");
  await prisma.lesson.update({ where: { id: lesson.id }, data: { content: md } });
  console.log(`Updated Module 1: ${lesson.title} (${md.length} chars)`);
  // Update quiz to 5 scenario-based items that measure the single objective
  const quiz = await prisma.quiz.findFirst({ where: { lessonId: lesson.id }, include: { questions: true } });
  if(quiz){
    await prisma.answer.deleteMany({ where: { questionId: { in: quiz.questions.map(q=>q.id) } } });
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    const qs = [
      { text: "A startup runs its API on EC2. Who patches the guest OS?", answers: [{text:"Provider",isCorrect:false},{text:"Customer",isCorrect:true},{text:"Shared",isCorrect:false},{text:"Neither",isCorrect:false}] },
      { text: "The same startup migrates its database to RDS. Who decides storage_encrypted and GRANT SELECT?", answers: [{text:"Provider",isCorrect:false},{text:"Customer",isCorrect:true},{text:"AWS automatically",isCorrect:false},{text:"No one",isCorrect:false}] },
      { text: "Thumbnails on Lambda + S3: who secures sharp and the execution role?", answers: [{text:"Provider for both",isCorrect:false},{text:"Customer for both",isCorrect:true},{text:"Provider for role, customer for code",isCorrect:false},{text:"Neither",isCorrect:false}] },
      { text: "S3 bucket s3://corp-photos-prod/* with default SSE-S3 is publicly readable. Who is responsible for the bucket policy?", answers: [{text:"Provider (default)",isCorrect:false},{text:"Customer",isCorrect:true},{text:"Shared",isCorrect:false},{text:"No one",isCorrect:false}] },
      { text: "Default SSE-S3 is enabled. Has the customer met encryption responsibility for PII?", answers: [{text:"Yes, default is sufficient",isCorrect:false},{text:"No — must choose SSE-KMS/DSSE-KMS, key policy, in-transit, classification",isCorrect:true},{text:"Only if using KMS",isCorrect:false},{text:"Only for non-PII",isCorrect:false}] },
    ];
    for(const q of qs){ await prisma.question.create({ data: { quizId: quiz.id, text: q.text, answers: { create: q.answers } } }); }
    console.log(`Replaced quiz with 5 scenario-based items`);
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
