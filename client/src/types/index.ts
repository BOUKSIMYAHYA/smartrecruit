export type Role =
  | 'SUPER_ADMIN'
  | 'HR_ADMIN'
  | 'HR_MANAGER'
  | 'OPERATIONAL_MANAGER'
  | 'RECRUITER'
  | 'CANDIDATE';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CLOSED';

export type ContractType = 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'ALTERNANCE';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PRESELECTED'
  | 'PHONE_INTERVIEW'
  | 'TECHNICAL_INTERVIEW'
  | 'HR_INTERVIEW'
  | 'DECISION_PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type AiMatchCategory = 'HIGH_MATCH' | 'PARTIAL_MATCH' | 'LOW_MATCH';

export type InterviewType = 'PHONE' | 'TECHNICAL' | 'HR' | 'FINAL';

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export type AiRecommendation = 'APPROVED_FOR_SHORTLIST' | 'NOT_APPROVED';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  candidateProfile?: CandidateProfile | null;
  assignedJobs?: any[];
}

export interface CandidateProfile {
  id: string;
  userId: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  linkedInUrl?: string | null;
  portfolioUrl?: string | null;
  currentTitle?: string | null;
  summary?: string | null;
  yearsOfExp?: number;
  availability?: string | null;
  salaryExpectation?: string | null;
  inTalentPool: boolean;
  talentPoolNotes?: string | null;
  skills?: CandidateSkill[];
  experiences?: Experience[];
  education?: Education[];
  resumes?: Resume[];
  coverLetters?: CoverLetter[];
  user?: User;
}

export interface Skill {
  id: string;
  name: string;
  category?: string | null;
}

export interface CandidateSkill {
  id: string;
  skillId: string;
  level?: number;
  yearsOfExp?: number;
  skill: Skill;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

export interface Education {
  id: string;
  degree: string;
  fieldOfStudy?: string | null;
  institution: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

export interface Resume {
  id: string;
  type: 'UPLOADED_PDF' | 'PLATFORM_BUILDER';
  title: string;
  fileName?: string | null;
  fileSize?: number | null;
  contentJson?: any;
  extractedText?: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CoverLetter {
  id: string;
  type: 'UPLOADED_PDF' | 'PLATFORM_TEXT';
  title: string;
  content?: string | null;
  fileName?: string | null;
  createdAt: string;
}

export interface JobRequirement {
  id: string;
  jobId: string;
  skillName: string;
  isRequired: boolean;
  minExpYears?: number;
}

export interface Job {
  id: string;
  reference: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  isRemote: boolean;
  contractType: ContractType;
  openings: number;
  description: string;
  responsibilities?: string | null;
  requiredExpYears: number;
  availability?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status: JobStatus;
  deadline?: string | null;
  createdAt: string;
  requirements: JobRequirement[];
  _count?: { applications: number };
}

export interface AiMatchResult {
  id: string;
  overallScore: number;
  category: AiMatchCategory;
  recommendation: AiRecommendation;
  foundRequiredSkills: string[];
  missingRequiredSkills: string[];
  foundDesiredSkills: string[];
  missingDesiredSkills: string[];
  strengths: string[];
  pointsToVerify: string[];
  justification: string;
  humanValidated: boolean;
  humanDecision?: string | null;
  humanNotes?: string | null;
  humanValidator?: { firstName: string | null; lastName: string | null; email: string };
  humanValidatedAt?: string | null;
}

export interface Application {
  id: string;
  applicationNumber: string;
  jobId: string;
  job: Job;
  candidateProfileId: string;
  candidateProfile: CandidateProfile;
  resumeId: string;
  resume: Resume;
  coverLetterId?: string | null;
  coverLetter?: CoverLetter | null;
  status: ApplicationStatus;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  aiMatchResult?: AiMatchResult | null;
  statusHistory?: any[];
  recruitmentNotes?: any[];
  interviews?: any[];
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  fromStatus?: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  reason?: string | null;
  changedById?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  application?: Application;
  interviewerId: string;
  interviewer: User;
  type: InterviewType;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string | null;
  location?: string | null;
  status: InterviewStatus;
  feedback?: string | null;
  rating?: number | null;
}
