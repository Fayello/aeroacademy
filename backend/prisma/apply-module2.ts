import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();
async function main(){
  const md = fs.readFileSync(path.join(__dirname, 'module2-least-privilege.md'), 'utf8');
  const course = await prisma.course.findFirst({ where: { title: "Cloud Security & Hardening" } });
  if(!course) throw new Error("Course not found");
  const section = await prisma.section.findFirst({ where: { courseId: course.id, title: { contains: "IAM, Access Control" } } });
  if(!section) throw new Error("Section not found");
  // Find lesson by contains "Policies & Permissions" or "Least Privilege"
  let lesson = await prisma.lesson.findFirst({ where: { sectionId: section.id, title: { contains: "Policies & Permissions" } } });
  if(!lesson) lesson = await prisma.lesson.findFirst({ where: { sectionId: section.id, title: { contains: "Least" } } });
  if(!lesson) throw new Error("Lesson not found");
  await prisma.lesson.update({ where: { id: lesson.id }, data: { content: md } });
  console.log(`Updated Module 2: ${lesson.title} (${md.length} chars)`);
  const quiz = await prisma.quiz.findFirst({ where: { lessonId: lesson.id }, include: { questions: true } });
  if(quiz){
    await prisma.answer.deleteMany({ where: { questionId: { in: quiz.questions.map(q=>q.id) } } });
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    const qs = [
      { text: "ETL needs GetObject on incoming/* and PutObject on processed/*. Which Resource is least privilege?", answers: [{text:"*",isCorrect:false},{text:"arn:aws:s3:::corp-data-prod/incoming/* and arn:aws:s3:::corp-data-prod/processed/*",isCorrect:true},{text:"arn:aws:s3:::corp-data-prod",isCorrect:false},{text:"arn:aws:s3:::*",isCorrect:false}] },
      { text: "The job runs in eu-west-1 over TLS. Which condition is required?", answers: [{text:"None",isCorrect:false},{text:"Bool: aws:SecureTransport: true + StringEquals: aws:RequestedRegion: eu-west-1",isCorrect:true},{text:"StringEquals: aws:Region: eu-west-1",isCorrect:false},{text:"No condition if Resource scoped",isCorrect:false}] },
      { text: "Long-lived AKIA in user data vs IAM role for EC2. Least privilege in time?", answers: [{text:"Keep AKIA, rotate yearly",isCorrect:false},{text:"IAM role with 1-hour STS",isCorrect:true},{text:"Share AKIA across instances",isCorrect:false},{text:"No credential needed",isCorrect:false}] },
      { text: "Policy allows s3:GetObject on *. Request is s3:DeleteBucket on arn:aws:s3:::corp-data. Result?", answers: [{text:"Allow",isCorrect:false},{text:"Implicit deny — no explicit allow for DeleteBucket",isCorrect:true},{text:"Explicit deny",isCorrect:false},{text:"Allow with condition",isCorrect:false}] },
      { text: "Policy has explicit Deny on s3:* with StringNotEquals PrincipalOrgID o-123456 and explicit Allow on s3:GetObject. Request from outside org. Result?", answers: [{text:"Allow",isCorrect:false},{text:"Deny (explicit deny overrides)",isCorrect:true},{text:"Implicit deny",isCorrect:false},{text:"Allow with MFA",isCorrect:false}] },
      { text: "Which IAM action is not needed for ETL to read incoming/*?", answers: [{text:"s3:GetObject",isCorrect:false},{text:"s3:DeleteBucket",isCorrect:true},{text:"s3:ListBucket",isCorrect:false},{text:"s3:PutObject",isCorrect:false}] },
      { text: "Best Action for read from incoming/*?", answers: [{text:"s3:*",isCorrect:false},{text:"s3:GetObject",isCorrect:true},{text:"s3:ListAllMyBuckets",isCorrect:false},{text:"s3:PutObject",isCorrect:false}] },
      { text: "Which Condition restricts to corporate IP 10.20.0.0/16?", answers: [{text:"IpAddress: aws:SourceIp: 10.20.0.0/16",isCorrect:true},{text:"StringEquals: aws:SourceIp: 10.20.0.0/16",isCorrect:false},{text:"IpAddress: aws:RequestedIp",isCorrect:false},{text:"No condition",isCorrect:false}] },
      { text: "After hardening, s3:GetObject on corp-finance-prod/secret.csv should be?", answers: [{text:"Allowed",isCorrect:false},{text:"Implicit deny",isCorrect:true},{text:"Explicit deny",isCorrect:false},{text:"Allowed with MFA",isCorrect:false}] },
      { text: "What does aws iam simulate-principal-policy prove?", answers: [{text:"That policy is syntactically valid",isCorrect:false},{text:"That request would be allowed/denied by evaluation engine",isCorrect:true},{text:"That bucket exists",isCorrect:false},{text:"That user exists",isCorrect:false}] },
    ];
    for(const q of qs){ await prisma.question.create({ data: { quizId: quiz.id, text: q.text, answers: { create: q.answers } } }); }
    console.log(`Replaced quiz with 10 scenario-based items`);
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
