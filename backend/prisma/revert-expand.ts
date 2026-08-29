import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){
  const lessons = await prisma.lesson.findMany();
  console.log(`Found ${lessons.length} lessons, stripping templated Harvard filler...`);
  let reverted=0;
  for(const les of lessons){
    let c = les.content || '';
    const idx = c.indexOf("\n\n## 7. Comparative Analysis");
    if(idx !== -1){
      c = c.slice(0, idx);
      // also strip trailing Harvard-level rigor line if present
      const idx2 = c.indexOf("\n\n---\n*Harvard-level rigor:");
      if(idx2 !== -1) c = c.slice(0, idx2);
      await prisma.lesson.update({ where: { id: les.id }, data: { content: c } });
      reverted++;
    }
  }
  console.log(`Reverted ${reverted} lessons`);
  const avg = await prisma.$queryRawUnsafe(`SELECT avg(length(content))::int as avg FROM "Lesson"`) as any[];
  console.log(`New avg length: ${avg[0].avg} chars`);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
