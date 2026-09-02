export type ProgramSlug = "ambassador" | "volunteer";

export type ApplicationForm = {
  programType: ProgramSlug;
  name: string;
  email: string;
  city: string;
  organization: string;
  role: string;
  experience: string;
  interests: string;
  contribution: string;
  availability: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

type ProgramDetails = {
  slug: ProgramSlug;
  path: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  audience: string;
  summary: string;
  defaultInterests: string;
  defaultContribution: string;
  focusPoints: string[];
  outcomes: string[];
  expectations: string[];
  perks: string[];
  process: string[];
};

export const PROGRAM_DETAILS: Record<ProgramSlug, ProgramDetails> = {
  ambassador: {
    slug: "ambassador",
    path: "/community/ambassador-program",
    title: "Brand Ambassador Program",
    shortTitle: "Brand ambassador",
    eyebrow: "Campus and community representation",
    description:
      "For students, alumni, and local community builders who can introduce XpertClass with credibility and help serious learners start well.",
    audience:
      "Students, alumni, chapter leads, bootcamp facilitators, and respected voices in technical communities.",
    summary:
      "Represent XpertClass in universities and technical circles, create trusted awareness, and connect motivated learners to structured training and certification.",
    defaultInterests: "community, student outreach, cybersecurity",
    defaultContribution:
      "I want to help introduce XpertClass to learners in my campus or local network and support first-time activation.",
    focusPoints: [
      "Represent XpertClass in your campus or peer network.",
      "Help learners understand the path from training to proof.",
      "Support structured activation instead of hype-driven promotion.",
    ],
    outcomes: [
      "University and student-community introductions",
      "Local activations, info sessions, and trusted outreach",
      "Referral momentum from credible technical circles",
    ],
    expectations: [
      "Clear communication and professional representation",
      "Reliable follow-through on outreach commitments",
      "Enough local reach to create meaningful introductions",
    ],
    perks: [
      "Early access to new learning tracks and platform updates",
      "Recognition on community surfaces and launch materials",
      "Priority consideration for future campus and event initiatives",
    ],
    process: [
      "Apply with your background, community reach, and contribution plan.",
      "The XpertClass team reviews fit, communication, and local credibility.",
      "Accepted ambassadors move into a structured onboarding and activation path.",
    ],
  },
  volunteer: {
    slug: "volunteer",
    path: "/community/volunteer-program",
    title: "Volunteer Program",
    shortTitle: "Volunteer",
    eyebrow: "Learner support and program continuity",
    description:
      "For mentors and contributors who want to support learners, strengthen operations, and give practical time to the community.",
    audience:
      "Mentors, technical volunteers, event helpers, learner-support contributors, and operations-minded community members.",
    summary:
      "Support learners through mentoring, events, onboarding, and behind-the-scenes community operations that keep the ecosystem steady.",
    defaultInterests: "mentorship, events, labs",
    defaultContribution:
      "I want to contribute time to mentoring, events, learner support, or community operations around XpertClass.",
    focusPoints: [
      "Support community sessions, mentoring, and learner help.",
      "Contribute practical time where the community most needs it.",
      "Strengthen trust and continuity around the learner journey.",
    ],
    outcomes: [
      "Mentoring support for learners starting their first pathways",
      "Event assistance and community session coordination",
      "Operational help that improves learner continuity",
    ],
    expectations: [
      "A genuine interest in helping learners progress",
      "Dependable participation when you commit to a support task",
      "Comfort working in practical, people-focused community roles",
    ],
    perks: [
      "Recognition for meaningful service contributions",
      "Closer access to community initiatives and pilot efforts",
      "A clearer route into deeper XpertClass program involvement",
    ],
    process: [
      "Apply with your background, availability, and support interests.",
      "The XpertClass team reviews reliability, fit, and proposed contribution.",
      "Accepted volunteers are placed where learner or community support is most useful.",
    ],
  },
};

export const APPLICATION_DEFAULTS: Record<ProgramSlug, ApplicationForm> = {
  ambassador: {
    programType: "ambassador",
    name: "",
    email: "",
    city: "",
    organization: "",
    role: "",
    experience: "",
    interests: PROGRAM_DETAILS.ambassador.defaultInterests,
    contribution: PROGRAM_DETAILS.ambassador.defaultContribution,
    availability: "",
    linkedinUrl: "",
    portfolioUrl: "",
  },
  volunteer: {
    programType: "volunteer",
    name: "",
    email: "",
    city: "",
    organization: "",
    role: "",
    experience: "",
    interests: PROGRAM_DETAILS.volunteer.defaultInterests,
    contribution: PROGRAM_DETAILS.volunteer.defaultContribution,
    availability: "",
    linkedinUrl: "",
    portfolioUrl: "",
  },
};
