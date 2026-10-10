"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyGuard = void 0;
class SafetyGuard {
    /**
     * Validates that the tailored resume does not introduce any hallucinated skills,
     * fake companies, or fabricated technologies not found in the original resume.
     */
    static sanitizeAndVerify(original, tailored, job) {
        // Collect all genuine tokens/words from the original resume
        const originalTokens = this.buildOriginalTokenSet(original);
        const unadded = [];
        // Verify all tailored skills actually existed in original resume
        const allTailoredSkills = [
            ...(tailored.skills.languages || []),
            ...(tailored.skills.frontend || []),
            ...(tailored.skills.backend || []),
            ...(tailored.skills.databases || []),
            ...(tailored.skills.tools || []),
            ...(tailored.skills.cloudDevops || []),
            ...(tailored.skills.other || []),
            ...(tailored.skills.rawList || [])
        ];
        const sanitizedSkillMap = {
            languages: this.filterGenuine(tailored.skills.languages || [], originalTokens),
            frontend: this.filterGenuine(tailored.skills.frontend || [], originalTokens),
            backend: this.filterGenuine(tailored.skills.backend || [], originalTokens),
            databases: this.filterGenuine(tailored.skills.databases || [], originalTokens),
            tools: this.filterGenuine(tailored.skills.tools || [], originalTokens),
            cloudDevops: this.filterGenuine(tailored.skills.cloudDevops || [], originalTokens),
            coreSkills: this.filterGenuine(tailored.skills.coreSkills || [], originalTokens),
            specialized: this.filterGenuine(tailored.skills.specialized || [], originalTokens),
            domainSkills: this.filterGenuine(tailored.skills.domainSkills || [], originalTokens),
            other: this.filterGenuine(tailored.skills.other || [], originalTokens),
            rawList: this.filterGenuine(tailored.skills.rawList || [], originalTokens),
            categories: tailored.skills.categories?.map((cat) => ({
                title: cat.title,
                skills: this.filterGenuine(cat.skills, originalTokens)
            }))
        };
        // Check required job skills that are absent from candidate profile
        const allOriginalSkills = this.getAllSkillsLower(original);
        for (const reqSkill of [...job.requiredSkills, ...job.preferredSkills]) {
            const lowerReq = reqSkill.toLowerCase();
            const reqBase = lowerReq.replace(/\s*\([^)]+\)/g, "").trim();
            const reqAmpersand = reqBase.replace(/\band\b/g, "&");
            const parenMatch = reqSkill.match(/\(([^)]+)\)/);
            const reqAcronym = parenMatch ? parenMatch[1].toLowerCase() : null;
            const candidateHasSkill = allOriginalSkills.some((orig) => {
                const origBase = orig.replace(/\s*\([^)]+\)/g, "").trim();
                const origAmpersand = origBase.replace(/\band\b/g, "&");
                const origParen = orig.match(/\(([^)]+)\)/);
                const origAcronym = origParen ? origParen[1].toLowerCase() : null;
                if (orig.includes(lowerReq) || lowerReq.includes(orig))
                    return true;
                if (origAmpersand.includes(reqAmpersand) || reqAmpersand.includes(origAmpersand))
                    return true;
                if (reqAcronym && (orig.includes(reqAcronym) || origAcronym === reqAcronym))
                    return true;
                return false;
            });
            if (!candidateHasSkill) {
                unadded.push({
                    requirement: reqSkill,
                    reason: `No supporting evidence found in your existing resume for "${reqSkill}".`,
                    suggestedAction: `Consider learning ${reqSkill} or adding genuine project experience only if you already possess it.`
                });
            }
        }
        // Preserve company names and education exactly from original
        const sanitizedExperience = tailored.experience.map((exp, idx) => {
            const origExp = original.experience[idx] || exp;
            return {
                ...exp,
                company: origExp.company, // NEVER change employer
                jobTitle: origExp.jobTitle // NEVER invent new job title
            };
        });
        const sanitizedEducation = original.education; // Keep genuine academic background
        const sanitized = {
            ...tailored,
            skills: sanitizedSkillMap,
            experience: sanitizedExperience,
            education: sanitizedEducation
        };
        return {
            sanitized,
            unadded: this.deduplicateUnadded(unadded)
        };
    }
    static buildOriginalTokenSet(resume) {
        const rawTokens = JSON.stringify(resume).toLowerCase().split(/[^a-z0-9+#.-]+/);
        return new Set(rawTokens.filter((t) => t.length > 1));
    }
    static filterGenuine(skills, genuineTokens) {
        return skills.filter((skill) => {
            const parts = skill.toLowerCase().split(/[\s/]+/);
            // At least one word in multi-word skill must match, or exact token
            return parts.some((p) => genuineTokens.has(p));
        });
    }
    static getAllSkillsLower(resume) {
        const categorySkills = (resume.skills.categories || []).flatMap((c) => c.skills || []);
        const certSkills = (resume.certifications || []).map((c) => c.name);
        const skills = [
            ...(resume.skills.languages || []),
            ...(resume.skills.frontend || []),
            ...(resume.skills.backend || []),
            ...(resume.skills.databases || []),
            ...(resume.skills.tools || []),
            ...(resume.skills.coreSkills || []),
            ...(resume.skills.specialized || []),
            ...(resume.skills.domainSkills || []),
            ...(resume.skills.other || []),
            ...(resume.skills.rawList || []),
            ...categorySkills,
            ...certSkills
        ];
        return skills.map((s) => s.toLowerCase());
    }
    static deduplicateUnadded(items) {
        const seen = new Set();
        return items.filter((item) => {
            const key = item.requirement.toLowerCase();
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
}
exports.SafetyGuard = SafetyGuard;
