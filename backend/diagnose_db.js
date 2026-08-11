const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    include: {
      sections: {
        include: {
          lessons: true
        }
      }
    }
  });

  console.log('--- Database Content Audit ---');
  courses.forEach(course => {
    console.log(`Course: ${course.title} (ID: ${course.id})`);
    console.log(`Sections: ${course.sections.length}`);
    course.sections.forEach(section => {
      console.log(`  Section: ${section.title}`);
      console.log(`    Lessons: ${section.lessons.length}`);
      section.lessons.forEach(lesson => {
        console.log(`      Lesson: ${lesson.title} (Content Length: ${lesson.content?.length || 0})`);
      });
    });
    console.log('');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
