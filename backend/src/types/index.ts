export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExperienceItem {
  id?: string;
  company: string;
  jobTitle: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  responsibilities: string[];
  achievements?: string[];
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  url?: string;
  highlights?: string[];
  relevanceScore?: number;
}

export interface CertificationItem {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialUrl?: string;
}

export interface StructuredResume {
  personal: PersonalInfo;
  headline?: string;
  summary: string;
  skills: {
    languages?: string[];
    frontend?: string[];
    backend?: string[];
    databases?: string[];
    tools?: string[];
    cloudDevops?: string[];
    other?: string[];
    rawList?: string[];
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements?: string[];
  languages?: string[];
  sectionOrder?: string[];
}

export interface JobRequirement {
  id: string;
  category: "technical_skill" | "soft_skill" | "responsibility" | "qualification" | "tool";
  text: string;
  isMandatory: boolean;
  importanceWeight: number; // 1 to 5
}

export interface ExtractedJobDescription {
  id?: string;
  title: string;
  company?: string;
  detectedRole: string;
  roleConfidence: number; // 0 to 100
  department?: string;
  experienceLevel?: "Entry" | "Mid" | "Senior" | "Lead" | "Executive" | "Unknown";
  location?: string;
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Remote" | "Hybrid" | "On-site" | "Other";
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  rawText: string;
}

export type MatchStatus = "strong" | "partial" | "missing" | "unknown";

export interface RequirementMatch {
  requirementId: string;
  requirementText: string;
  category: string;
  status: MatchStatus;
  matchingText?: string;
  explanation: string;
  confidence: number;
}

export interface ATSScoreBreakdown {
  overallScore: number;
  keywordMatch: number;
  technicalSkills: number;
  experienceRelevance: number;
  education: number;
  responsibilities: number;
  resumeStructure: number;
  scoringWeights: {
    skills: number;
    experience: number;
    keywords: number;
    responsibilities: number;
    education: number;
    structure: number;
  };
  disclaimer: string;
}

export interface KeywordAnalysis {
  importantKeywords: string[];
  existingKeywords: string[];
  missingKeywords: string[];
  relatedKeywords: { [term: string]: string[] };
}

export interface AISuggestion {
  id: string;
  section: string;
  type: "enhancement" | "gap_warning" | "action_verb" | "relevance";
  content: string;
  reason: string;
  actionableStep?: string;
}

export interface UnaddedItem {
  requirement: string;
  reason: string;
  suggestedAction: string;
}

export interface TailoringResult {
  targetRole: string;
  atsScore: ATSScoreBreakdown;
  changesMade: string[];
  unaddedItems: UnaddedItem[];
  tailoredResume: StructuredResume;
  originalResume: StructuredResume;
  suggestions: AISuggestion[];
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "offer"
  | "accepted";

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  jobUrl?: string;
  appliedDate?: string;
  resumeVersionId?: string;
  resumeVersionName?: string;
  status: ApplicationStatus;
  notes?: string;
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}
