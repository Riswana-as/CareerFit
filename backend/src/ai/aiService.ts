import {
  StructuredResume,
  ExtractedJobDescription,
  TailoringResult,
  ATSScoreBreakdown,
  KeywordAnalysis,
  RequirementMatch
} from "../types";
import { HeuristicProvider } from "./heuristicProvider";
import { GeminiProvider } from "./geminiProvider";
import { SafetyGuard } from "./safetyGuard";
import { ATSScoreService } from "../services/atsScoreService";
import { MatchingEngine } from "../services/matchingEngine";

export class AIService {
  private geminiProvider = new GeminiProvider();

  async tailorResume(
    original: StructuredResume,
    job: ExtractedJobDescription,
    customWeights?: ATSScoreBreakdown["scoringWeights"]
  ): Promise<TailoringResult> {
    const changesMade: string[] = [];

    // 1. Optimize Professional Summary
    let tailoredSummary = "";
    if (this.geminiProvider.isAvailable()) {
      const geminiSummary = await this.geminiProvider.optimizeSummaryWithGemini(
        original.summary,
        original,
        job
      );
      if (geminiSummary) {
        tailoredSummary = geminiSummary;
        changesMade.push(`Optimized professional summary using Gemini AI targeted for ${job.detectedRole}.`);
      }
    }

    if (!tailoredSummary) {
      const heuristicSummaryResult = HeuristicProvider.optimizeSummary(
        original.summary,
        original,
        job
      );
      tailoredSummary = heuristicSummaryResult.summary;
      changesMade.push(heuristicSummaryResult.changes);
    }

    // 2. Prioritize & Group Skills
    const { skills: prioritizedSkills, changes: skillChanges } =
      HeuristicProvider.prioritizeSkills(original.skills, job);
    changesMade.push(...skillChanges);

    // 3. Optimize Experience Bullets (Action verbs, clarity)
    const { experiences: optimizedExp, changes: expChanges } =
      HeuristicProvider.optimizeExperience(original.experience, job);
    changesMade.push(...expChanges);

    // 4. Optimize & Rank Projects
    const { projects: optimizedProjects, changes: projChanges } =
      HeuristicProvider.optimizeProjects(original.projects, job);
    changesMade.push(...projChanges);

    // 5. Intelligent Section Ordering
    const isFresher = original.experience.length <= 1;
    const tailoredSectionOrder = isFresher
      ? ["summary", "skills", "projects", "education", "experience", "certifications"]
      : ["summary", "skills", "experience", "projects", "education", "certifications"];

    changesMade.push(
      isFresher
        ? "Reordered sections to elevate projects & education for early-career profile."
        : "Reordered sections to emphasize professional experience first."
    );

    const preliminaryTailored: StructuredResume = {
      ...original,
      headline: `${job.detectedRole} Candidate`,
      summary: tailoredSummary,
      skills: prioritizedSkills,
      experience: optimizedExp,
      projects: optimizedProjects,
      sectionOrder: tailoredSectionOrder
    };

    // 6. Strict Anti-Fabrication Safety Verification
    const { sanitized, unadded } = SafetyGuard.sanitizeAndVerify(
      original,
      preliminaryTailored,
      job
    );

    // 7. Calculate ATS Scores & Matching Breakdown
    const matches: RequirementMatch[] = MatchingEngine.compare(sanitized, job);
    const keywords: KeywordAnalysis = MatchingEngine.extractKeywords(sanitized, job);
    const atsScore: ATSScoreBreakdown = ATSScoreService.calculateScore(
      sanitized,
      job,
      matches,
      keywords,
      customWeights
    );

    // 8. Generate Suggestions & Honest Gap Advisories
    const missingSkills = keywords.missingKeywords;
    const suggestions = HeuristicProvider.generateSuggestions(
      sanitized,
      job,
      missingSkills
    );

    return {
      targetRole: job.detectedRole,
      atsScore,
      changesMade,
      unaddedItems: unadded,
      tailoredResume: sanitized,
      originalResume: original,
      suggestions
    };
  }
}

export const aiService = new AIService();
