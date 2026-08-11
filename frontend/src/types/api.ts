export interface User {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  city: string | null;
  role: "STUDENT" | "ADMIN" | "RECRUITER";
  xp: number;
  rank: number;
  division: string;
  clearanceLevel: number;
  organizationId: string | null;
  teamId: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  location: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  sections: Section[];
  progress?: number;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  order: number;
  videoUrl: string | null;
  content: string | null;
  labId: string | null;
  lab?: { id: string; title: string; description: string; difficulty: number } | null;
  quiz?: Quiz | null;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  text: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  text: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  createdAt: string;
}

export interface Lab {
  id: string;
  title: string;
  description: string;
  dockerImage: string;
  briefing: string | null;
  tasks: string[] | null;
  imageUrl: string | null;
  difficulty: number;
  basePath: string | null;
  flags: LabFlag[];
}

export interface LabFlag {
  id: string;
  labId: string;
  title: string;
  description: string | null;
  points: number;
  submissions: { userId: string }[];
}

export interface LabInstance {
  id: string;
  userId: string;
  labId: string;
  containerId: string | null;
  port: number | null;
  status: "RUNNING" | "STOPPED" | "EXPIRED" | "PROVISIONING";
  expiresAt: string;
  createdAt: string;
}

export interface LabTelemetry {
  containerId: string;
  labName: string;
  cpu: number;
  memory: number;
  network: number;
  status: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
}

export interface Progress {
  userId: string;
  lessonId: string;
  completed: boolean;
  updatedAt: string;
  lesson?: Lesson;
}

export interface LeaderboardEntry {
  position: number;
  id: string;
  name: string;
  xp: number;
  rank: number;
  level: number;
  achievementsCount: number;
  division: string;
  organization: { name: string; type: string } | null;
  city: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: User[];
  createdAt: string;
}

export interface IntelligenceData {
  logs: {
    id: string;
    type: "SUCCESS" | "ERROR" | "INFO" | "WARNING";
    msg: string;
    time: string;
  }[];
  metrics: {
    cpu: number;
    ram: number;
    activeLabs: number;
    networkLoad: number;
  };
  stats: {
    totalUsers: number;
    totalLessons: number;
    completedLessons: number;
    maxCapacity: number;
  };
  intelligence?: {
    id: string;
    type: string;
    title: string;
    message: string;
  };
}

export interface FeedItem {
  type: string;
  message: string;
  points?: number;
  timestamp: string;
}

export interface Shortlist {
  id: string;
  recruiterId: string;
  studentId: string;
  notes: string | null;
  createdAt: string;
  student?: User;
}

export interface LabStats {
  activeContainers: number;
  activeUsers: number;
  capacityPercentage: number;
  maxCapacity: number;
  systemStatus: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    role: string;
  };
}
