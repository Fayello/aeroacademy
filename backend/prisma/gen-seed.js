#!/usr/bin/env node
/**
 * Generator script for seed-linux-courses.ts
 * Run: node gen-seed.js
 * This writes the complete seed file with educational content.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, 'seed-linux-courses.ts');

function js(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
}

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function Q(text, answers) {
  return { text, answers };
}

function A(text, correct) {
  return { text, isCorrect: correct };
}

function lesson(title, order, labId, content, questions) {
  const lab = labId ? ` labId: ${labId},` : '';
  const qLines = questions.map(q => {
    const aParts = q.answers.map(a => `{ text: ${js(a.text)}, isCorrect: ${a.isCorrect} }`).join(', ');
    return `              { text: ${js(q.text)}, answers: [${aParts}] }`;
  }).join(',\n');
  return `          {
            title: ${js(title)}, order: ${order},${lab}
            content: \`${esc(content)}\`,
            questions: [
${qLines}
            ]
          }`;
}

function section(title, order, lessonsArr) {
  return `        {
          title: ${js(title)}, order: ${order},
          lessons: [
${lessonsArr.join(',\n')}
          ]
        }`;
}

// ─── Build the file ───
let out = '';

// Header
out += `import { PrismaClient } from '@prisma/client';

export async function seedLinuxCourses(prisma: PrismaClient, labs: any[]) {
  console.log('Seeding Linux courses...');

  const ubuntuCliLab = labs[0];
  const permLab = labs[1];
  const textProcLab = labs[2];
  const processSvcLab = labs[3];
  const debianLab = labs[4];
  const centosLab = labs[5];
  const nginxLab = labs[6];
  const storageLab = labs[7];
  const kernelLab = labs[8];
  const dockerLab = labs[9];
  const gitLab = labs[10];
  const kaliReconLab = labs[11];
  const kaliExploitLab = labs[12];
  const parrotLab = labs[13];
  const netSecLab = labs[14];
  const metasploitableLab = labs[15];
  const ansibleLab = labs[16];
  const cisLab = labs[17];

  const coursesCreated: any[] = [];

  async function createCourseWithQuizzes(
    title: string, description: string,
    sectionsData: Array<{
      title: string; order: number;
      lessons: Array<{
        title: string; order: number; labId?: string; content: string;
        questions: Array<{ text: string; answers: Array<{ text: string; isCorrect: boolean }> }>
      }>
    }>
  ) {
    const course = await prisma.course.create({
      data: {
        title, description,
        sections: {
          create: sectionsData.map(s => ({
            title: s.title, order: s.order,
            lessons: {
              create: s.lessons.map(les => ({
                title: les.title, order: les.order, labId: les.labId, content: les.content,
              })),
            },
          })),
        },
      },
    });

    const allLessons = await prisma.lesson.findMany({ where: { section: { courseId: course.id } } });
    for (const lesson of allLessons) {
      const sectionData = sectionsData.find(s => s.lessons.some(l => l.title === lesson.title));
      const lessonData = sectionData?.lessons.find(l => l.title === lesson.title);
      if (lessonData && lessonData.questions.length > 0) {
        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            questions: { create: lessonData.questions.map(q => ({ text: q.text, answers: { create: q.answers } })) },
          },
        });
      }
    }
    coursesCreated.push(course);
    return course;
  }

`;

// We'll load course data from separate JSON-like data files
// For now, build each course inline

// ═══════════════════════════════════════════════════════════
// Load all course modules
// ═══════════════════════════════════════════════════════════

const courseFiles = fs.readdirSync(path.join(__dirname, 'courses')).filter(f => f.endsWith('.js'));
courseFiles.sort();

for (const cf of courseFiles) {
  const mod = require(path.join(__dirname, 'courses', cf));
  const { title, description, sections } = mod();
  const sectionStrs = sections.map((s, i) =>
    section(s.title, i + 1, s.lessons.map((l, j) =>
      lesson(l.title, j + 1, l.lab || null, l.content, l.questions)
    ))
  );
  out += `  await createCourseWithQuizzes(
    ${js(title)},
    ${js(description)},
    [
${sectionStrs.join(',\n')}
    ]
  );

`;
}

out += `
  console.log(\`Seeded \${coursesCreated.length} Linux courses with quizzes.\`);
  return coursesCreated;
}
`;

fs.writeFileSync(TARGET, out, 'utf-8');
console.log(`Written ${out.length} chars (${fs.statSync(TARGET).size} bytes) to ${TARGET}`);
