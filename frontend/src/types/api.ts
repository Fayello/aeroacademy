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
  imageUrl?: string | null;
  estimatedHours?: number | null;
  duration?: string | null;
  category?: string;
  difficulty?: number;
  createdAt: string;
  sections: Section[];
  progress?: number;
  _count?: { sections?: number; lessons?: number };
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
  _count?: { lessons?: number };
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
  section?: { courseId: string; title: string };
}

export interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  details: { questionId: string; isCorrect: boolean }[];
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
  isLocked?: boolean;
  requiredLevel?: number;
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
  unlockedAt?: string;
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
  email?: string | null;
  xp: number;
  rank: number;
  level: number;
  achievementsCount: number;
  division: string;
  organization: { name: string; type: string } | null;
  city: string | null;
}

export interface LeagueRegion {
  name: string;
  totalXp: number;
  studentCount: number;
}

export interface LeagueUniversity {
  id: string | null;
  name: string;
  totalXp: number;
  studentCount: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface LeagueStats {
  regional: LeagueRegion[];
  university: LeagueUniversity[];
  season: Season | null;
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
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    role: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  method: string;
  path: string;
  statusCode: number;
  ip: string | null;
  userAgent: string | null;
  metadata: {
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    durationMs?: number;
    error?: string;
  } | null;
  createdAt: string;
  actor?: { id: string; name: string | null; email: string } | null;
}

export interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AnalyticsOverview {
  totals: {
    users: number;
    students: number;
    courses: number;
    lessons: number;
    labs: number;
    masterClasses: number;
    trainers: number;
    teams: number;
    organizations: number;
    lessonsCompleted: number;
    quizSubmissions: number;
    flagsSolved: number;
    activeUsers30d: number;
  };
  userGrowth: { date: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  divisionDistribution: { division: string; count: number }[];
  levelDistribution: { level: number; count: number }[];
  courseStats: {
    courseId: string;
    courseTitle: string;
    totalLessons: number;
    completed: number;
    completionRate: number;
    students: number;
  }[];
  labStats: {
    labId: string;
    labTitle: string;
    difficulty: number;
    starts: number;
    flagsSolved: number;
    solvers: number;
  }[];
  quizStats: { submissions: number; passed: number; failed: number; passRate: number };
  flagStats: { correct: number; incorrect: number };
  activity: { date: string; lessons: number; flags: number; quizzes: number; registrations: number }[];
  topPerformers: {
    id: string;
    name: string;
    email: string;
    xp: number;
    level: number;
    division: string;
    organization: string | null;
    city: string | null;
    achievements: number;
    flagsSolved: number;
    lessonsCompleted: number;
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: NotificationItem[];
  total: number;
  unread: number;
  limit: number;
  offset: number;
}

export type UserRole = "STUDENT" | "ADMIN" | "RECRUITER";

export interface AdminUser extends User {
  organization: { name: string; type: string } | null;
  _count: {
    progress: number;
    labSubmissions: number;
    quizSubmissions: number;
    achievements: number;
  };
}

export interface UserStats {
  total: number;
  byRole: { role: UserRole; _count: number }[];
}

export type MasterClassStatus =
  | "UPCOMING"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface MasterClass {
  id: string;
  title: string;
  description: string;
  instructorName: string | null;
  instructorBio: string | null;
  category: string;
  scheduledAt: string | null;
  duration: number;
  maxParticipants: number | null;
  status: MasterClassStatus;
  recordingUrl: string | null;
  isLive: boolean;
  registrations?: (MasterClassRegistration & {
    user: { id: string; name: string | null; email: string };
  })[];
  _count?: { registrations: number };
}

export interface MasterClassRegistration {
  id: string;
  masterClassId: string;
  userId: string;
  registeredAt: string;
  masterClass?: MasterClass;
}

export interface TrainingSlot {
  id: string;
  trainerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  available?: boolean;
}

export interface Trainer {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string[] | null;
  hourlyRate?: number | null;
  isActive?: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  slots: TrainingSlot[];
  _count?: { bookings: number };
}

export interface TrainingBooking {
  id: string;
  trainerId: string;
  slotId?: string | null;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  slot?: TrainingSlot;
  trainer?: Trainer;
  student?: { id: string; name: string | null; email: string };
}

export interface AdminLabFlag {
  id?: string;
  title: string;
  description: string;
  points: number;
  correctAnswer: string;
}

export interface AdminLab {
  id: string;
  title: string;
  description: string;
  dockerImage: string;
  difficulty: number;
  imageUrl: string | null;
  basePath: string | null;
  briefing: string | null;
  createdAt?: string;
  flags: AdminLabFlag[];
}
