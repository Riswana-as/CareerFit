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
    customWeights?: ATSScoreBreakdown["scoringWeights"],
    geminiApiKey?: string,
    optimizationMode: string = "standard"
  ): Promise<TailoringResult> {
    const changesMade: string[] = [];
    let preliminaryTailored: StructuredResume | null = null;

    // 1. If Gemini AI is configured, attempt full end-to-end LLM tailoring
    if (this.geminiProvider.isAvailable(geminiApiKey)) {
      try {
        const geminiResult = await this.geminiProvider.tailorResumeWithGemini(
          original,
          job,
          geminiApiKey,
          optimizationMode
        );
        if (geminiResult && geminiResult.tailoredResume) {
          preliminaryTailored = geminiResult.tailoredResume;
          changesMade.push(...geminiResult.changesMade);
          changesMade.push(`Optimized comprehensive resume sections for "${job.detectedRole}" using Google Gemini AI (${optimizationMode === "aggressive_keywords" ? "Max Keyword Match" : "Professional Alignment"}).`);
        }
      } catch (err: any) {
        console.warn("[AIService] Gemini tailoring failed, continuing with universal heuristic engine:", err.message);
      }
    }

    // 2. If Gemini was not used or failed, run the Universal Heuristic AI Engine
    if (!preliminaryTailored) {
      // Step A: Professional Summary
      let tailoredSummary = "";
      if (this.geminiProvider.isAvailable(geminiApiKey)) {
        tailoredSummary = (await this.geminiProvider.optimizeSummaryWithGemini(
          original.summary,
          original,
          job,
          geminiApiKey
        )) || "";
      }
      if (!tailoredSummary) {
        const heuristicSummaryResult = HeuristicProvider.optimizeSummary(
          original.summary,
          original,
          job,
          optimizationMode
        );
        tailoredSummary = heuristicSummaryResult.summary;
        changesMade.push(heuristicSummaryResult.changes);
      }

      // Step B: Skills Prioritization
      const { skills: prioritizedSkills, changes: skillChanges } =
        HeuristicProvider.prioritizeSkills(original.skills, job);
      changesMade.push(...skillChanges);

      const categorySkills = (original.skills.categories || []).flatMap((c) => c.skills || []);
      const certSkills = (original.certifications || []).map((c) => c.name);
      const allCandidateSkills = [
        ...(original.skills.languages || []),
        ...(original.skills.frontend || []),
        ...(original.skills.backend || []),
        ...(original.skills.databases || []),
        ...(original.skills.tools || []),
        ...(original.skills.coreSkills || []),
        ...(original.skills.specialized || []),
        ...(original.skills.domainSkills || []),
        ...(original.skills.rawList || []),
        ...categorySkills,
        ...certSkills
      ];

      // Step C: Experience Bullet Point Enhancement
      const { experiences: optimizedExp, changes: expChanges } =
        HeuristicProvider.optimizeExperience(original.experience, job, optimizationMode, Array.from(new Set(allCandidateSkills)));
      changesMade.push(...expChanges);

      // Step D: Projects Optimization
      const { projects: optimizedProjects, changes: projChanges } =
        HeuristicProvider.optimizeProjects(
          original.projects,
          job,
          optimizationMode,
          Array.from(new Set(allCandidateSkills))
        );
      changesMade.push(...projChanges);

      // Step E: Dynamic Section Ordering
      const isFresher = original.experience.length <= 1;
      const tailoredSectionOrder = isFresher
        ? ["summary", "skills", "projects", "education", "experience", "certifications"]
        : ["summary", "skills", "experience", "projects", "education", "certifications"];

      changesMade.push(
        isFresher
          ? "Reordered sections to elevate projects & education for early-career profile."
          : "Reordered sections to emphasize professional experience first."
      );

      preliminaryTailored = {
        ...original,
        headline: `${job.detectedRole}`,
        summary: tailoredSummary,
        skills: prioritizedSkills,
        experience: optimizedExp,
        projects: optimizedProjects,
        sectionOrder: tailoredSectionOrder
      };
    }

    // 3. Strict Anti-Fabrication Safety Verification
    // Programmatically strips any hallucinated technologies, companies, or titles
    const { sanitized, unadded } = SafetyGuard.sanitizeAndVerify(
      original,
      preliminaryTailored,
      job
    );

    // 4. Calculate ATS Scores & Matching Breakdown
    const matches: RequirementMatch[] = MatchingEngine.compare(sanitized, job);
    const keywords: KeywordAnalysis = MatchingEngine.extractKeywords(sanitized, job);
    const atsScore: ATSScoreBreakdown = ATSScoreService.calculateScore(
      sanitized,
      job,
      matches,
      keywords,
      customWeights
    );

    // 5. Generate Suggestions & Honest Gap Advisories
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
      suggestions,
      keywords,
      requirementMatches: matches,
      optimizationMode: optimizationMode as any
    };
  }
}

export const aiService = new AIService();
