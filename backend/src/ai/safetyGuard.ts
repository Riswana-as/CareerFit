import { StructuredResume, ExtractedJobDescription, UnaddedItem } from "../types";

export class SafetyGuard {
  /**
   * Validates that the tailored resume does not introduce any hallucinated skills,
   * fake companies, or fabricated technologies not found in the original resume.
   */
  static sanitizeAndVerify(
    original: StructuredResume,
    tailored: StructuredResume,
    job: ExtractedJobDescription
  ): { sanitized: StructuredResume; unadded: UnaddedItem[] } {
    // Collect all genuine tokens/words from the original resume
    const originalTokens = this.buildOriginalTokenSet(original);
    const unadded: UnaddedItem[] = [];

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
      other: this.filterGenuine(tailored.skills.other || [], originalTokens),
      rawList: this.filterGenuine(tailored.skills.rawList || [], originalTokens)
    };

    // Check required job skills that are absent from candidate profile
    const allOriginalSkills = this.getAllSkillsLower(original);
    for (const reqSkill of [...job.requiredSkills, ...job.preferredSkills]) {
      const lowerReq = reqSkill.toLowerCase();
      const candidateHasSkill = allOriginalSkills.some(
        (orig) => orig.includes(lowerReq) || lowerReq.includes(orig)
      );

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

    const sanitized: StructuredResume = {
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

  private static buildOriginalTokenSet(resume: StructuredResume): Set<string> {
    const rawTokens = JSON.stringify(resume).toLowerCase().split(/[^a-z0-9+#.-]+/);
    return new Set(rawTokens.filter((t) => t.length > 1));
  }

  private static filterGenuine(skills: string[], genuineTokens: Set<string>): string[] {
    return skills.filter((skill) => {
      const parts = skill.toLowerCase().split(/[\s/]+/);
      // At least one word in multi-word skill must match, or exact token
      return parts.some((p) => genuineTokens.has(p));
    });
  }

  private static getAllSkillsLower(resume: StructuredResume): string[] {
    const skills = [
      ...(resume.skills.languages || []),
      ...(resume.skills.frontend || []),
      ...(resume.skills.backend || []),
      ...(resume.skills.databases || []),
      ...(resume.skills.tools || []),
      ...(resume.skills.other || []),
      ...(resume.skills.rawList || [])
    ];
    return skills.map((s) => s.toLowerCase());
  }

  private static deduplicateUnadded(items: UnaddedItem[]): UnaddedItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.requirement.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
