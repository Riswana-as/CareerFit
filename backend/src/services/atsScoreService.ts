import {
  StructuredResume,
  ExtractedJobDescription,
  RequirementMatch,
  KeywordAnalysis,
  ATSScoreBreakdown
} from "../types";

export class ATSScoreService {
  static calculateScore(
    resume: StructuredResume,
    job: ExtractedJobDescription,
    matches: RequirementMatch[],
    keywords: KeywordAnalysis,
    customWeights?: ATSScoreBreakdown["scoringWeights"]
  ): ATSScoreBreakdown {
    const weights = customWeights || {
      skills: 30,
      experience: 25,
      keywords: 20,
      responsibilities: 15,
      education: 5,
      structure: 5
    };

    // 1. Keyword match percentage
    const totalKeywords = keywords.importantKeywords.length || 1;
    const keywordMatch = Math.min(
      100,
      Math.round((keywords.existingKeywords.length / totalKeywords) * 100)
    );

    // 2. Technical skills score
    const skillMatches = matches.filter((m) => m.category === "technical_skill");
    let skillScore = 0;
    if (skillMatches.length > 0) {
      const strongCount = skillMatches.filter((m) => m.status === "strong").length;
      const partialCount = skillMatches.filter((m) => m.status === "partial").length;
      skillScore = Math.min(
        100,
        Math.round(((strongCount * 1.0 + partialCount * 0.5) / skillMatches.length) * 100)
      );
    } else {
      skillScore = 80;
    }

    // 3. Experience relevance score
    const roleInTitle = resume.experience.some((e) =>
      e.jobTitle.toLowerCase().includes(job.detectedRole.toLowerCase().split(" ")[0])
    );
    const hasMultipleRoles = resume.experience.length >= 2;
    let experienceRelevance = 70;
    if (roleInTitle) experienceRelevance += 20;
    if (hasMultipleRoles) experienceRelevance += 10;
    experienceRelevance = Math.min(100, experienceRelevance);

    // 4. Education score
    const hasEducation = resume.education.length > 0;
    const degreeMentionsCS = resume.education.some(
      (e) =>
        /computer|software|engineering|technology|information/i.test(e.degree) ||
        /computer|software|engineering/i.test(e.fieldOfStudy || "")
    );
    const educationScore = degreeMentionsCS ? 100 : hasEducation ? 85 : 60;

    // 5. Responsibilities alignment score
    const respMatches = matches.filter((m) => m.category === "responsibility");
    let respScore = 75;
    if (respMatches.length > 0) {
      const strongCount = respMatches.filter((m) => m.status === "strong").length;
      const partialCount = respMatches.filter((m) => m.status === "partial").length;
      respScore = Math.min(
        100,
        Math.round(((strongCount * 1.0 + partialCount * 0.5) / respMatches.length) * 100)
      );
    }

    // 6. Resume structure & formatting score
    let structureScore = 95;
    if (!resume.summary) structureScore -= 10;
    if (resume.experience.length === 0) structureScore -= 10;
    if (!resume.personal.email || !resume.personal.phone) structureScore -= 10;
    structureScore = Math.max(60, structureScore);

    // Overall weighted score
    const totalWeight =
      weights.skills +
      weights.experience +
      weights.keywords +
      weights.responsibilities +
      weights.education +
      weights.structure;

    const weightedScore =
      (skillScore * weights.skills +
        experienceRelevance * weights.experience +
        keywordMatch * weights.keywords +
        respScore * weights.responsibilities +
        educationScore * weights.education +
        structureScore * weights.structure) /
      totalWeight;

    const overallScore = Math.min(100, Math.max(20, Math.round(weightedScore)));

    return {
      overallScore,
      keywordMatch,
      technicalSkills: skillScore,
      experienceRelevance,
      education: educationScore,
      responsibilities: respScore,
      resumeStructure: structureScore,
      scoringWeights: weights,
      disclaimer:
        "This ATS compatibility score is an application-generated estimate based on industry keyword density, standard header layout, and relevance parsing. It does not guarantee employment or passage of specific proprietary screening tools."
    };
  }
}
