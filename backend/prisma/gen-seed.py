#!/usr/bin/env python3
"""Generator script for seed-linux-courses.ts"""
import os

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed-linux-courses.ts')

def write_file():
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(header())
        # Course 1
        f.write(course1())
        # Course 2
        f.write(course2())
        # Course 3
        f.write(course3())
        # Course 4
        f.write(course4())
        # Course 5
        f.write(course5())
        # Course 6
        f.write(course6())
        # Course 7
        f.write(course7())
        # Course 8
        f.write(course8())
        f.write(footer())
    print(f"Written {os.path.getsize(OUTPUT)} bytes to {OUTPUT}")

def header():
    return '''import { PrismaClient } from '@prisma/client';

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

'''

def footer():
    return '''
  console.log(`Seeded ${coursesCreated.length} Linux courses with quizzes.`);
  return coursesCreated;
}
'''

def esc(s):
    """Escape a string for use in a TypeScript template literal (backtick string).
    We need to escape backticks and ${ sequences."""
    return s.replace('`', '\`').replace('${', '\${')

def lesson_block(title, order, lab_id, content, questions):
    """Generate a lesson object."""
    lab_str = f" labId: {lab_id}" if lab_id else ""
    q_lines = []
    for q in questions:
        a_lines = []
        for a in q['answers']:
            a_lines.append(f'{{ text: {esc_js(a["text"])}, isCorrect: {str(a["isCorrect"]).lower()} }}')
        q_lines.append(f'{{ text: {esc_js(q["text"])}, answers: [{", ".join(a_lines)}] }}')
    
    return f'''          {{
            title: {esc_js(title)}, order: {order},{lab_str}
            content: `{esc(content)}`,
            questions: [
              {(",chr(10)+"              ").join(q_lines)}
            ]
          }}'''

def esc_js(s):
    """Escape a string for use in a JavaScript string literal (single/double quotes)."""
    return "'" + s.replace("\\", "\\\\").replace("'", "\'").replace('"', '\\"').replace('\n', '\n') + "'"

# Now we need to define all course content
# Due to extreme length, each course function returns its section data

print("Building course content...")
