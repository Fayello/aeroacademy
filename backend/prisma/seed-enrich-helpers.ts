import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(answer.trim().toLowerCase(), SALT_ROUNDS);
}

export function encryptCredentials(credentials: any[]): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_KEY, 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export interface QuizQuestion {
  text: string;
  answers: Array<{ text: string; isCorrect: boolean }>;
}

export interface LessonData {
  title: string;
  order: number;
  labId?: string;
  content: string;
  questions: QuizQuestion[];
}

export interface SectionData {
  title: string;
  order: number;
  lessons: LessonData[];
}

export async function createCourseWithQuizzes(
  prisma: PrismaClient,
  title: string,
  description: string,
  estimatedHours: number,
  sectionsData: SectionData[]
) {
  const course = await prisma.course.create({
    data: {
      title,
      description,
      estimatedHours,
      sections: {
        create: sectionsData.map(s => ({
          title: s.title,
          order: s.order,
          lessons: {
            create: s.lessons.map(les => ({
              title: les.title,
              order: les.order,
              labId: les.labId,
              content: les.content,
            })),
          },
        })),
      },
    },
  });

  const allLessons = await prisma.lesson.findMany({
    where: { section: { courseId: course.id } },
  });

  let quizCount = 0;
  for (const lesson of allLessons) {
    const sectionData = sectionsData.find(s =>
      s.lessons.some(l => l.title === lesson.title)
    );
    const lessonData = sectionData?.lessons.find(l => l.title === lesson.title);
    if (lessonData && lessonData.questions.length > 0) {
      await prisma.quiz.create({
        data: {
          lessonId: lesson.id,
          questions: {
            create: lessonData.questions.map(q => ({
              text: q.text,
              answers: { create: q.answers },
            })),
          },
        },
      });
      quizCount++;
    }
  }

  console.log(`  Created course "${title}" with ${sectionsData.length} sections, ${allLessons.length} lessons, ${quizCount} quizzes`);
  return course;
}

export async function createLabWithFlags(
  prisma: PrismaClient,
  lab: {
    title: string;
    description: string;
    dockerImage: string;
    briefing: string;
    tasks: string[];
    credentials: any[];
    imageUrl?: string;
    difficulty: number;
    estimatedMinutes: number;
  },
  flags: Array<{ title: string; description: string; correctAnswer: string; points: number }>
) {
  const existing = await prisma.lab.findFirst({ where: { title: lab.title } });
  if (existing) {
    console.log(`  Skipped (exists): ${lab.title}`);
    return existing;
  }

  const created = await prisma.lab.create({
    data: {
      title: lab.title,
      description: lab.description,
      dockerImage: lab.dockerImage,
      briefing: lab.briefing,
      tasks: lab.tasks,
      credentials: encryptCredentials(lab.credentials),
      imageUrl: lab.imageUrl || '/images/labs/default.png',
      difficulty: lab.difficulty,
      estimatedMinutes: lab.estimatedMinutes,
    },
  });

  for (const flag of flags) {
    await prisma.labFlag.create({
      data: {
        labId: created.id,
        title: flag.title,
        description: flag.description,
        correctAnswer: await hashAnswer(flag.correctAnswer),
        points: flag.points,
      },
    });
  }

  console.log(`  Created lab: ${lab.title} (${flags.length} flags)`);
  return created;
}

export async function backfillQuizzes(prisma: PrismaClient) {
  const lessonsWithoutQuiz = await prisma.lesson.findMany({
    where: { quiz: null },
    include: { section: { include: { course: true } } },
  });

  console.log(`Found ${lessonsWithoutQuiz.length} lessons without quizzes`);

  let created = 0;
  for (const lesson of lessonsWithoutQuiz) {
    const courseTitle = lesson.section.course.title;
    const sectionTitle = lesson.section.title;

    const questions = generateQuestionsForLesson(lesson.title, courseTitle, sectionTitle);
    if (questions.length === 0) continue;

    await prisma.quiz.create({
      data: {
        lessonId: lesson.id,
        questions: {
          create: questions.map(q => ({
            text: q.text,
            answers: { create: q.answers },
          })),
        },
      },
    });
    created++;
  }

  console.log(`Created ${created} quizzes`);
  return created;
}

function generateQuestionsForLesson(lessonTitle: string, courseTitle: string, sectionTitle: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Generate 4-5 questions per lesson based on the topic
  const topic = lessonTitle.toLowerCase();

  if (topic.includes('docker') || topic.includes('container')) {
    questions.push(
      {
        text: 'What is the difference between a Docker image and a Docker container?',
        answers: [
          { text: 'An image is a read-only template; a container is a running instance of an image', isCorrect: true },
          { text: 'A container is stored on disk; an image runs in memory', isCorrect: false },
          { text: 'They are the same thing', isCorrect: false },
          { text: 'An image is for production; a container is for development', isCorrect: false },
        ],
      },
      {
        text: 'Which command creates a Docker container from an image?',
        answers: [
          { text: 'docker run', isCorrect: true },
          { text: 'docker create', isCorrect: false },
          { text: 'docker build', isCorrect: false },
          { text: 'docker start', isCorrect: false },
        ],
      },
      {
        text: 'What does "docker compose" do?',
        answers: [
          { text: 'Defines and runs multi-container Docker applications', isCorrect: true },
          { text: 'Downloads Docker images from Docker Hub', isCorrect: false },
          { text: 'Creates a new Docker network', isCorrect: false },
          { text: 'Monitors Docker container performance', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('nginx') || topic.includes('web server')) {
    questions.push(
      {
        text: 'What is the primary configuration file for Nginx?',
        answers: [
          { text: '/etc/nginx/nginx.conf', isCorrect: true },
          { text: '/etc/nginx.conf', isCorrect: false },
          { text: '/var/www/nginx.conf', isCorrect: false },
          { text: '/usr/local/nginx/nginx.conf', isCorrect: false },
        ],
      },
      {
        text: 'What does "proxy_pass" do in Nginx?',
        answers: [
          { text: 'Forwards requests to a backend server', isCorrect: true },
          { text: 'Blocks incoming requests', isCorrect: false },
          { text: 'Redirects to a different URL', isCorrect: false },
          { text: 'Enables SSL/TLS', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('linux') || topic.includes('command') || topic.includes('terminal')) {
    questions.push(
      {
        text: 'Which command prints the current working directory?',
        answers: [
          { text: 'pwd', isCorrect: true },
          { text: 'cd', isCorrect: false },
          { text: 'ls', isCorrect: false },
          { text: 'dir', isCorrect: false },
        ],
      },
      {
        text: 'What does the "chmod 755" command do?',
        answers: [
          { text: 'Sets permissions to rwxr-xr-x', isCorrect: true },
          { text: 'Sets permissions to rwxrwxrwx', isCorrect: false },
          { text: 'Sets permissions to rw-r--r--', isCorrect: false },
          { text: 'Sets permissions to rwx------', isCorrect: false },
        ],
      },
      {
        text: 'Which command lists files with detailed information?',
        answers: [
          { text: 'ls -la', isCorrect: true },
          { text: 'ls', isCorrect: false },
          { text: 'dir', isCorrect: false },
          { text: 'list', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('security') || topic.includes('vulnerability')) {
    questions.push(
      {
        text: 'What is the OWASP Top 10?',
        answers: [
          { text: 'A list of the most critical web application security risks', isCorrect: true },
          { text: 'A list of the top 10 programming languages', isCorrect: false },
          { text: 'A list of the top 10 cloud providers', isCorrect: false },
          { text: 'A list of the top 10 operating systems', isCorrect: false },
        ],
      },
      {
        text: 'What is SQL Injection?',
        answers: [
          { text: 'Inserting malicious SQL code into application queries', isCorrect: true },
          { text: 'Installing SQL on a server', isCorrect: false },
          { text: 'Optimizing SQL query performance', isCorrect: false },
          { text: 'Creating SQL databases', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('network') || topic.includes('firewall') || topic.includes('vpn')) {
    questions.push(
      {
        text: 'What does a firewall do?',
        answers: [
          { text: 'Filters network traffic based on security rules', isCorrect: true },
          { text: 'Speeds up network connections', isCorrect: false },
          { text: 'Encrypts all network traffic', isCorrect: false },
          { text: 'Assigns IP addresses to devices', isCorrect: false },
        ],
      },
      {
        text: 'What is the purpose of a VPN?',
        answers: [
          { text: 'Creates an encrypted tunnel over a public network', isCorrect: true },
          { text: 'Makes internet connections faster', isCorrect: false },
          { text: 'Blocks all incoming traffic', isCorrect: false },
          { text: 'Provides antivirus protection', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('git') || topic.includes('version')) {
    questions.push(
      {
        text: 'What does "git clone" do?',
        answers: [
          { text: 'Creates a local copy of a remote repository', isCorrect: true },
          { text: 'Creates a new branch', isCorrect: false },
          { text: 'Saves changes to the repository', isCorrect: false },
          { text: 'Deletes a branch', isCorrect: false },
        ],
      },
      {
        text: 'What is a merge conflict?',
        answers: [
          { text: 'When Git cannot automatically merge changes from different branches', isCorrect: true },
          { text: 'When two users try to push at the same time', isCorrect: false },
          { text: 'When the repository is corrupted', isCorrect: false },
          { text: 'When a branch is deleted', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('kubernetes') || topic.includes('k8s')) {
    questions.push(
      {
        text: 'What is a Kubernetes Pod?',
        answers: [
          { text: 'The smallest deployable unit in Kubernetes, containing one or more containers', isCorrect: true },
          { text: 'A virtual machine in the cloud', isCorrect: false },
          { text: 'A Docker image registry', isCorrect: false },
          { text: 'A network load balancer', isCorrect: false },
        ],
      },
      {
        text: 'What does a Kubernetes Service provide?',
        answers: [
          { text: 'A stable network endpoint for accessing a set of Pods', isCorrect: true },
          { text: 'Persistent storage for containers', isCorrect: false },
          { text: 'Container runtime environment', isCorrect: false },
          { text: 'Source code management', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('terraform') || topic.includes('ansible') || topic.includes('iac')) {
    questions.push(
      {
        text: 'What is Infrastructure as Code (IaC)?',
        answers: [
          { text: 'Managing infrastructure through machine-readable configuration files', isCorrect: true },
          { text: 'Writing code that runs on servers', isCorrect: false },
          { text: 'Manually configuring servers via SSH', isCorrect: false },
          { text: 'Using a GUI to manage cloud resources', isCorrect: false },
        ],
      },
      {
        text: 'What is the purpose of Terraform?',
        answers: [
          { text: 'Provisioning and managing cloud infrastructure declaratively', isCorrect: true },
          { text: 'Running application code', isCorrect: false },
          { text: 'Managing Docker containers', isCorrect: false },
          { text: 'Version controlling source code', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('python') || topic.includes('flask') || topic.includes('api')) {
    questions.push(
      {
        text: 'What is a REST API?',
        answers: [
          { text: 'An architectural style for designing networked applications using HTTP methods', isCorrect: true },
          { text: 'A type of database', isCorrect: false },
          { text: 'A programming language', isCorrect: false },
          { text: 'An operating system', isCorrect: false },
        ],
      },
      {
        text: 'What HTTP method is used to create a new resource?',
        answers: [
          { text: 'POST', isCorrect: true },
          { text: 'GET', isCorrect: false },
          { text: 'PUT', isCorrect: false },
          { text: 'DELETE', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('malware') || topic.includes('yara') || topic.includes('forensic')) {
    questions.push(
      {
        text: 'What is YARA used for?',
        answers: [
          { text: 'Identifying and classifying malware samples', isCorrect: true },
          { text: 'Scanning network traffic', isCorrect: false },
          { text: 'Managing Docker containers', isCorrect: false },
          { text: 'Writing unit tests', isCorrect: false },
        ],
      },
      {
        text: 'What is static malware analysis?',
        answers: [
          { text: 'Examining malware without executing it', isCorrect: true },
          { text: 'Running malware in a sandbox', isCorrect: false },
          { text: 'Analyzing network traffic from malware', isCorrect: false },
          { text: 'Scanning for viruses with antivirus', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('suricata') || topic.includes('ids') || topic.includes('siem')) {
    questions.push(
      {
        text: 'What is Suricata?',
        answers: [
          { text: 'A network intrusion detection and prevention system', isCorrect: true },
          { text: 'A web application firewall', isCorrect: false },
          { text: 'A vulnerability scanner', isCorrect: false },
          { text: 'A packet tracer tool', isCorrect: false },
        ],
      },
      {
        text: 'What is the purpose of a SIEM system?',
        answers: [
          { text: 'Centralized security event logging, analysis, and alerting', isCorrect: true },
          { text: 'Managing user passwords', isCorrect: false },
          { text: 'Encrypting email communications', isCorrect: false },
          { text: 'Blocking known malware signatures', isCorrect: false },
        ],
      }
    );
  } else if (topic.includes('selinux') || topic.includes('permission') || topic.includes('access control')) {
    questions.push(
      {
        text: 'What are the three modes of SELinux?',
        answers: [
          { text: 'Enforcing, Permissive, Disabled', isCorrect: true },
          { text: 'Active, Inactive, Standby', isCorrect: false },
          { text: 'Read, Write, Execute', isCorrect: false },
          { text: 'Root, User, Admin', isCorrect: false },
        ],
      },
      {
        text: 'What is an Access Control List (ACL)?',
        answers: [
          { text: 'A list of permissions attached to a file or directory for specific users or groups', isCorrect: true },
          { text: 'A list of network firewall rules', isCorrect: false },
          { text: 'A list of installed software', isCorrect: false },
          { text: 'A list of running processes', isCorrect: false },
        ],
      }
    );
  } else {
    // Generic questions for lessons without specific topic matching
    questions.push(
      {
        text: `What is the primary focus of "${lessonTitle}"?`,
        answers: [
          { text: 'Core concepts and practical skills related to the lesson topic', isCorrect: true },
          { text: 'General computer usage', isCorrect: false },
          { text: 'Hardware configuration', isCorrect: false },
          { text: 'Network infrastructure', isCorrect: false },
        ],
      },
      {
        text: 'What is the best way to learn the skills covered in this lesson?',
        answers: [
          { text: 'Hands-on practice in a lab environment', isCorrect: true },
          { text: 'Only reading documentation', isCorrect: false },
          { text: 'Watching videos without practicing', isCorrect: false },
          { text: 'Memorizing commands without understanding', isCorrect: false },
        ],
      }
    );
  }

  return questions;
}
