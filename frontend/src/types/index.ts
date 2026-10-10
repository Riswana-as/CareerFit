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
  issuingOrganization?: string;
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
    coreSkills?: string[];
    specialized?: string[];
    domainSkills?: string[];
    other?: string[];
    rawList?: string[];
    categories?: { title: string; skills: string[] }[];
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements?: string[];
  languages?: string[];
  sectionOrder?: string[];
}

export interface ExtractedJobDescription {
  id?: string;
  title: string;
  company?: string;
  detectedRole: string;
  roleConfidence: number;
  department?: string;
  experienceLevel?: "Entry" | "Mid" | "Senior" | "Lead" | "Executive" | "Unknown";
  location?: string;
  employmentType?: string;
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
  dismissed?: boolean;
}

export interface UnaddedItem {
  requirement: string;
  reason: string;
  suggestedAction: string;
}

export type OptimizationMode = "standard" | "aggressive_keywords" | "executive" | "fresher";

export interface TailoringResult {
  targetRole: string;
  atsScore: ATSScoreBreakdown;
  changesMade: string[];
  unaddedItems: UnaddedItem[];
  tailoredResume: StructuredResume;
  originalResume: StructuredResume;
  suggestions: AISuggestion[];
  keywords?: KeywordAnalysis;
  optimizationMode?: OptimizationMode;
}

export interface ResumeVersionSummary {
  id: string;
  resumeId: string;
  versionNumber: number;
  versionName: string;
  targetRole: string;
  templateSlug: string;
  atsScore: number;
  scoreBreakdown?: ATSScoreBreakdown;
  changesSummary?: string[];
  unaddedItems?: UnaddedItem[];
  content: StructuredResume;
  originalResume?: StructuredResume;
  suggestions?: AISuggestion[];
  keywords?: KeywordAnalysis;
  allVersions?: { id: string; version_number: number; version_name: string; ats_score: number; created_at: string }[];
  createdAt: string;
}

export interface ResumeRecord {
  id: string;
  title: string;
  originalFileName?: string;
  isPrimary?: boolean;
  versionCount?: number;
  latestAtsScore?: number;
  parsedData?: StructuredResume;
  createdAt: string;
  updatedAt: string;
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
  company: string;
  position: string;
  job_url?: string;
  applied_date?: string;
  resume_version_id?: string;
  version_name?: string;
  ats_score?: number;
  status: ApplicationStatus;
  notes?: string;
  interview_date?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  headline?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  defaultTemplate?: string;
  scoringWeights?: ATSScoreBreakdown["scoringWeights"];
}
