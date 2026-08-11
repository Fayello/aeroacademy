import { PrismaClient, MasterClassStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMasterClasses() {
  const count = await prisma.masterClass.count();
  if (count > 0) {
    console.log(`[seed] ${count} master classes already exist, skipping`);
    return;
  }

  const now = new Date();

  const classes: {
    title: string;
    description: string;
    instructorName: string;
    instructorBio: string;
    category: string;
    scheduledAt: Date;
    duration: number;
    maxParticipants: number;
    isLive: boolean;
    status: MasterClassStatus;
    recordingUrl?: string;
  }[] = [
    {
      title: 'Introduction to Penetration Testing',
      description: 'Learn the fundamentals of penetration testing methodology, tools, and ethical frameworks. Perfect for beginners looking to break into cybersecurity.',
      instructorName: 'Dr. Moussa C.',
      instructorBio: 'CS Faculty at University of Maroua with 10+ years in security research.',
      category: 'SECURITY',
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      duration: 90,
      maxParticipants: 50,
      isLive: true,
      status: 'UPCOMING',
    },
    {
      title: 'Docker & Kubernetes Deep Dive',
      description: 'Master container orchestration from Docker basics to Kubernetes deployments. Hands-on with real cluster setups.',
      instructorName: 'Amadou T.',
      instructorBio: 'Security Engineer specializing in cloud infrastructure and container security.',
      category: 'DEVOPS',
      scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      duration: 120,
      maxParticipants: 40,
      isLive: true,
      status: 'UPCOMING',
    },
    {
      title: 'Linux Kernel Internals Workshop',
      description: 'Deep dive into Linux kernel architecture, system calls, process management, and memory management.',
      instructorName: 'Fabiola S.',
      instructorBio: 'DevOps Engineer with deep expertise in Linux internals and performance tuning.',
      category: 'LINUX',
      scheduledAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      duration: 120,
      maxParticipants: 30,
      isLive: true,
      status: 'UPCOMING',
    },
    {
      title: 'OWASP Top 10 Hands-On',
      description: 'Walk through each OWASP Top 10 vulnerability with live exploitation demos in controlled lab environments.',
      instructorName: 'Dr. Moussa C.',
      instructorBio: 'CS Faculty at University of Maroua with 10+ years in security research.',
      category: 'SECURITY',
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      duration: 90,
      maxParticipants: 60,
      isLive: true,
      status: 'UPCOMING',
    },
    {
      title: 'Building CI/CD Pipelines',
      description: 'From zero to production-ready CI/CD with GitHub Actions, Docker, and automated testing. Real-world examples.',
      instructorName: 'Amadou T.',
      instructorBio: 'Security Engineer specializing in cloud infrastructure and container security.',
      category: 'DEVOPS',
      scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      duration: 75,
      maxParticipants: 50,
      isLive: false,
      recordingUrl: 'https://example.com/recordings/cicd-pipelines',
      status: 'COMPLETED',
    },
  ];

  const created = await prisma.masterClass.createMany({ data: classes });
  console.log(`[seed] Created ${created.count} master classes`);
}
