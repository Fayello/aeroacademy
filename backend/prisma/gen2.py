#!/usr/bin/env python3
"""Generate the complete seed-linux-courses-part2.ts file."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
DATA_FILE = os.path.join(BASE, "lessons_data.json")
OUT_FILE = os.path.join(BASE, "seed-linux-courses-part2.ts")

with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

header = """import { PrismaClient } from '@prisma/client';

export async function seedLinuxCoursesPart2(prisma: PrismaClient, labs: any[]) {
  console.log('Seeding Linux courses (Part 2)...');

  const nginxLab = labs[6];
  const storageLab = labs[7];
  const netSecLab = labs[14];

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
    return course;
  }
"""

def escape_ts(s):
    """Escape a string for use in a TypeScript template literal."""
    return s.replace('`', '\\`').replace('${', '\\${')

lines = [header]

for ci, course in enumerate(data['courses']):
    cid = ci + 3
    lines.append(f"\n  // {'=' * 60}")
    lines.append(f"  // COURSE {cid}: {course['title'].upper()}")
    lines.append(f"  // {'=' * 60}\n")
    lines.append("  await createCourseWithQuizzes(\n")
    lines.append(f"    '{escape_ts(course['title'])}',")
    lines.append(f"    '{escape_ts(course['description'])}',")
    lines.append("    [")

    for sec in course['sections']:
        lines.append("      {")
        lines.append(f"        title: '{escape_ts(sec['title'])}', order: {sec['order']},")
        lines.append("        lessons: [")

        for les in sec['lessons']:
            lines.append("          {")
            lab_expr = les.get('lab', 'undefined')
            lines.append(f"            title: '{escape_ts(les['title'])}', order: {les['order']}, labId: {lab_expr},")
            content = les['content']
            lines.append(f"            content: `{escape_ts(content)}`,")
            lines.append("            questions: [")
            for qu in les['questions']:
                qt = escape_ts(qu['text']).replace("'", "\\'")
                lines.append(f"              {{ text: '{qt}', answers: [")
                for an in qu['answers']:
                    at = escape_ts(an['text']).replace("'", "\\'")
                    ic = 'true' if an['isCorrect'] else 'false'
                    lines.append(f"                {{ text: '{at}', isCorrect: {ic} }},")
                lines.append("              ]},")
            lines.append("            ],")
            lines.append("          },")
        lines.append("        ],")
        lines.append("      },")
    lines.append("    ],")
    lines.append("  );")

lines.append("\n  console.log('Linux courses Part 2 seeded successfully.');")
lines.append("}\n")

result = "\n".join(lines)
with open(OUT_FILE, 'w', encoding='utf-8') as f:
    f.write(result)

print(f"Generated {OUT_FILE}: {len(result)} bytes, {result.count(chr(10))} lines")
