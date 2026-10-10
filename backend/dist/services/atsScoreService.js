"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATSScoreService = void 0;
class ATSScoreService {
    static calculateScore(resume, job, matches, keywords, customWeights) {
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
        const keywordMatch = Math.min(100, Math.round((keywords.existingKeywords.length / totalKeywords) * 100));
        // 2. Technical / Functional skills score
        const skillMatches = matches.filter((m) => m.category === "technical_skill" || m.category === "preferred_skill");
        let skillScore = 0;
        if (skillMatches.length > 0) {
            const strongCount = skillMatches.filter((m) => m.status === "strong").length;
            const partialCount = skillMatches.filter((m) => m.status === "partial").length;
            skillScore = Math.min(100, Math.round(((strongCount * 1.0 + partialCount * 0.5) / skillMatches.length) * 100));
        }
        else {
            skillScore = 80;
        }
        // 3. Experience relevance score
        const roleTokens = job.detectedRole.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
        const roleInTitle = resume.experience.some((e) => roleTokens.some((token) => e.jobTitle.toLowerCase().includes(token)));
        const hasMultipleRoles = resume.experience.length >= 2;
        let experienceRelevance = 65;
        if (roleInTitle)
            experienceRelevance += 15;
        if (hasMultipleRoles)
            experienceRelevance += 10;
        const expBullets = resume.experience.flatMap((e) => e.responsibilities || []);
        const matchingBulletsCount = expBullets.filter((b) => {
            const bLower = b.toLowerCase();
            return (job.requiredSkills.some((s) => bLower.includes(s.toLowerCase())) ||
                job.responsibilities.some((r) => {
                    const rTokens = r.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
                    return rTokens.filter((token) => bLower.includes(token)).length >= 2;
                }));
        }).length;
        if (matchingBulletsCount >= 2)
            experienceRelevance += 5;
        if (matchingBulletsCount >= 4)
            experienceRelevance += 5;
        experienceRelevance = Math.min(100, experienceRelevance);
        // 4. Universal Education alignment score
        const hasEducation = resume.education.length > 0;
        let educationScore = 60;
        if (hasEducation) {
            // Check if candidate's degree aligns with job's field/department
            const dept = (job.department || "").toLowerCase();
            const isAligned = resume.education.some((edu) => {
                const text = (edu.degree + " " + (edu.fieldOfStudy || "")).toLowerCase();
                if (/(?:^|\s)health\s*care|nurse|nursing|medical|clinical/i.test(dept)) {
                    return /nursing|bsn|msn|health|biology|science|medical|medicine/i.test(text);
                }
                if (/safety|ehs|hse|hazard|operations/i.test(dept)) {
                    return /safety|engineering|diploma|b\.e|b\.tech|fire|industrial|electrical|mechanical|environmental|science/i.test(text);
                }
                if (/finance|account/i.test(dept)) {
                    return /finance|accounting|business|economics|commerce|cpa|mba/i.test(text);
                }
                if (/marketing/i.test(dept)) {
                    return /marketing|communication|business|media|advertising|pr/i.test(text);
                }
                if (/education/i.test(dept)) {
                    return /education|teaching|instruction|curriculum|pedagogy|arts|science/i.test(text);
                }
                if (/engineering|technology/i.test(dept)) {
                    return /computer|software|engineering|technology|information|math|science/i.test(text);
                }
                return true;
            });
            educationScore = isAligned ? 100 : 85;
        }
        // 5. Responsibilities alignment score
        const respMatches = matches.filter((m) => m.category === "responsibility");
        let respScore = 75;
        if (respMatches.length > 0) {
            const strongCount = respMatches.filter((m) => m.status === "strong").length;
            const partialCount = respMatches.filter((m) => m.status === "partial").length;
            respScore = Math.min(100, Math.round(((strongCount * 1.0 + partialCount * 0.5) / respMatches.length) * 100));
        }
        // 6. Resume structure & formatting score
        let structureScore = 95;
        if (!resume.summary)
            structureScore -= 10;
        if (resume.experience.length === 0)
            structureScore -= 10;
        if (!resume.personal.email || !resume.personal.phone)
            structureScore -= 10;
        structureScore = Math.max(60, structureScore);
        // Overall weighted score
        const totalWeight = weights.skills +
            weights.experience +
            weights.keywords +
            weights.responsibilities +
            weights.education +
            weights.structure;
        const weightedScore = (skillScore * weights.skills +
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
            disclaimer: "This ATS compatibility score is an application-generated estimate based on industry keyword density, standard header layout, and relevance parsing. It does not guarantee employment or passage of specific proprietary screening tools."
        };
    }
}
exports.ATSScoreService = ATSScoreService;
