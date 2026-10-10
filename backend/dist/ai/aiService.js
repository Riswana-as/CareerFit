"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const heuristicProvider_1 = require("./heuristicProvider");
const geminiProvider_1 = require("./geminiProvider");
const safetyGuard_1 = require("./safetyGuard");
const atsScoreService_1 = require("../services/atsScoreService");
const matchingEngine_1 = require("../services/matchingEngine");
class AIService {
    geminiProvider = new geminiProvider_1.GeminiProvider();
    async tailorResume(original, job, customWeights, geminiApiKey, optimizationMode = "standard") {
        const changesMade = [];
        let preliminaryTailored = null;
        // 1. If Gemini AI is configured, attempt full end-to-end LLM tailoring
        if (this.geminiProvider.isAvailable(geminiApiKey)) {
            try {
                const geminiResult = await this.geminiProvider.tailorResumeWithGemini(original, job, geminiApiKey, optimizationMode);
                if (geminiResult && geminiResult.tailoredResume) {
                    preliminaryTailored = geminiResult.tailoredResume;
                    changesMade.push(...geminiResult.changesMade);
                    changesMade.push(`Optimized comprehensive resume sections for "${job.detectedRole}" using Google Gemini AI (${optimizationMode === "aggressive_keywords" ? "Max Keyword Match" : "Professional Alignment"}).`);
                }
            }
            catch (err) {
                console.warn("[AIService] Gemini tailoring failed, continuing with universal heuristic engine:", err.message);
            }
        }
        // 2. If Gemini was not used or failed, run the Universal Heuristic AI Engine
        if (!preliminaryTailored) {
            // Step A: Professional Summary
            let tailoredSummary = "";
            if (this.geminiProvider.isAvailable(geminiApiKey)) {
                tailoredSummary = (await this.geminiProvider.optimizeSummaryWithGemini(original.summary, original, job, geminiApiKey)) || "";
            }
            if (!tailoredSummary) {
                const heuristicSummaryResult = heuristicProvider_1.HeuristicProvider.optimizeSummary(original.summary, original, job, optimizationMode);
                tailoredSummary = heuristicSummaryResult.summary;
                changesMade.push(heuristicSummaryResult.changes);
            }
            // Step B: Skills Prioritization
            const { skills: prioritizedSkills, changes: skillChanges } = heuristicProvider_1.HeuristicProvider.prioritizeSkills(original.skills, job);
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
            const { experiences: optimizedExp, changes: expChanges } = heuristicProvider_1.HeuristicProvider.optimizeExperience(original.experience, job, optimizationMode, Array.from(new Set(allCandidateSkills)));
            changesMade.push(...expChanges);
            // Step D: Projects Optimization
            const { projects: optimizedProjects, changes: projChanges } = heuristicProvider_1.HeuristicProvider.optimizeProjects(original.projects, job, optimizationMode, Array.from(new Set(allCandidateSkills)));
            changesMade.push(...projChanges);
            // Step E: Dynamic Section Ordering
            const isFresher = original.experience.length <= 1;
            const tailoredSectionOrder = isFresher
                ? ["summary", "skills", "projects", "education", "experience", "certifications"]
                : ["summary", "skills", "experience", "projects", "education", "certifications"];
            changesMade.push(isFresher
                ? "Reordered sections to elevate projects & education for early-career profile."
                : "Reordered sections to emphasize professional experience first.");
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
        const { sanitized, unadded } = safetyGuard_1.SafetyGuard.sanitizeAndVerify(original, preliminaryTailored, job);
        // 4. Calculate ATS Scores & Matching Breakdown
        const matches = matchingEngine_1.MatchingEngine.compare(sanitized, job);
        const keywords = matchingEngine_1.MatchingEngine.extractKeywords(sanitized, job);
        const atsScore = atsScoreService_1.ATSScoreService.calculateScore(sanitized, job, matches, keywords, customWeights);
        // 5. Generate Suggestions & Honest Gap Advisories
        const missingSkills = keywords.missingKeywords;
        const suggestions = heuristicProvider_1.HeuristicProvider.generateSuggestions(sanitized, job, missingSkills);
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
            optimizationMode: optimizationMode
        };
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
