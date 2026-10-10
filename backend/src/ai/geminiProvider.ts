import { GoogleGenAI } from "@google/genai";
import { StructuredResume, ExtractedJobDescription } from "../types";

export class GeminiProvider {
  private defaultAi: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.defaultAi = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.warn("[GeminiProvider] Initialization error with env key:", e);
      }
    }
  }

  isAvailable(customApiKey?: string): boolean {
    const key = customApiKey || process.env.GEMINI_API_KEY;
    return !!key && key.trim().length > 5;
  }

  private getClient(customApiKey?: string): GoogleGenAI | null {
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return null;
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.warn("[GeminiProvider] Failed to instantiate GoogleGenAI client:", e);
      return null;
    }
  }

  /**
   * Performs end-to-end ATS resume tailoring with Gemini AI
   * respecting strict zero-fabrication constraints.
   */
  async tailorResumeWithGemini(
    original: StructuredResume,
    job: ExtractedJobDescription,
    customApiKey?: string,
    optimizationMode: string = "standard"
  ): Promise<{ tailoredResume: StructuredResume; changesMade: string[] } | null> {
    const ai = this.getClient(customApiKey);
    if (!ai) return null;

    let strategyGuidance = "STRATEGY: BALANCED ATS EXCELLENCE. Deliver a polished, natural, highly relevant ATS resume.";
    if (optimizationMode === "aggressive_keywords") {
      strategyGuidance = "STRATEGY: MAXIMUM ATS KEYWORD COVERAGE. Maximize ATS keyword alignment by weaving in the exact terminology, tools, and competency phrases from the job description wherever the candidate possesses genuine corresponding background. Emphasize keywords in the headline, summary, and bullets to maximize parsing algorithms while remaining 100% truthful.";
    } else if (optimizationMode === "executive") {
      strategyGuidance = "STRATEGY: EXECUTIVE LEADERSHIP & HIGH-LEVEL RESULTS. Emphasize leadership, strategic planning, cross-functional orchestration, and high-level outcomes across the candidate's authentic career history.";
    } else if (optimizationMode === "fresher") {
      strategyGuidance = "STRATEGY: FOUNDATIONAL SKILLS & PROJECT HIGHLIGHTS. Elevate projects, coursework, and key competencies for early career prominence.";
    }

    try {
      const prompt = `
You are CareerFit AI, an elite ATS resume optimizer across all global industries and job roles.

${strategyGuidance}

CRITICAL INSTRUCTION - ZERO FABRICATION MANDATE:
Under no circumstances may you invent, fabricate, or hallucinate:
- Any company names, employers, or job titles not in the candidate's background.
- Any degrees, universities, or credentials the candidate does not have.
- Any skills, tools, or technologies not already represented in the candidate's uploaded resume.
- Any false metrics, statistics, or invented years of experience.
Missing requirements must remain unadded so the candidate is guided honestly.

TARGET JOB INFORMATION:
Role: ${job.detectedRole} (${job.title})
Company: ${job.company || "Target Employer"}
Department: ${job.department || "General"}
Required Skills: ${job.requiredSkills.join(", ")}
Preferred Skills: ${job.preferredSkills.join(", ")}
Key Responsibilities: ${job.responsibilities.slice(0, 5).join(" | ")}

CANDIDATE AUTHENTIC RESUME:
${JSON.stringify({
  personal: original.personal,
  headline: original.headline,
  summary: original.summary,
  skills: original.skills,
  experience: original.experience,
  education: original.education,
  projects: original.projects,
  certifications: original.certifications,
  sectionOrder: original.sectionOrder
})}

YOUR GOAL:
1. Headline: Create an ATS-targeted headline matching the target role "${job.detectedRole}".
2. Professional Summary: Rewrite the summary (3-4 sentences) highlighting the candidate's authentic experience, strengths, and genuine matching skills for "${job.detectedRole}".
3. Skills: Prioritize and group the candidate's GENUINE skills so that matching skills appear first. DO NOT add skills from the job description that the candidate does not have!
4. Experience: Refine the candidate's actual responsibility bullet points using high-impact active verbs (e.g., Spearheaded, Orchestrated, Streamlined, Administered, Analyzed) and relevant phrasing matching the job duties, while keeping the candidate's truthful facts, companies, and roles intact.
5. Provide a list of concise explanations of the changes made.

OUTPUT REQUIREMENT:
Respond ONLY with a valid JSON object with exactly two keys:
{
  "tailoredResume": <StructuredResume JSON matching the input schema>,
  "changesMade": [<array of strings describing each strategic adjustment made>]
}
Do NOT include markdown formatting or backticks outside the JSON.
`;

      const candidateModels = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-pro-latest", "gemini-2.5-flash"];
      let response: any = null;

      for (const m of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: prompt
          });
          if (response && response.text) break;
        } catch (mErr: any) {
          // Continue to next model in cascade
        }
      }

      if (!response || !response.text) {
        return null;
      }

      const rawText = response.text?.trim() || "";
      const cleanedJsonText = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

      const parsed = JSON.parse(cleanedJsonText);
      if (parsed && parsed.tailoredResume && Array.isArray(parsed.changesMade)) {
        return {
          tailoredResume: {
            ...original,
            ...parsed.tailoredResume,
            personal: original.personal, // Guarantee personal contact is never altered
            education: original.education // Guarantee academic history is strictly preserved
          },
          changesMade: parsed.changesMade
        };
      }
      return null;
    } catch (err: any) {
      console.warn("[GeminiProvider] Gemini tailoring failed, falling back to universal heuristic engine:", err.message);
      return null;
    }
  }

  async optimizeSummaryWithGemini(
    originalSummary: string,
    resume: StructuredResume,
    job: ExtractedJobDescription,
    customApiKey?: string
  ): Promise<string | null> {
    const ai = this.getClient(customApiKey);
    if (!ai) return null;

    try {
      const prompt = `
You are an expert ATS resume optimizer.
STRICT RULE: NEVER FABRICATE ANY EXPERIENCE, METRICS, OR SKILLS.
Optimize the candidate's professional summary for the target role: "${job.detectedRole}".
Only highlight skills and experience already present in the candidate's resume:
${JSON.stringify({ summary: originalSummary, skills: resume.skills, experienceYears: resume.experience.length })}

Job Description Summary:
${job.rawText.slice(0, 1000)}

Rules:
1. Do not add skills the candidate does not have.
2. Keep it between 3 to 4 sentences.
3. Return only the optimized summary string with no commentary.
`;

      const candidateModels = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-pro-latest", "gemini-2.5-flash"];
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: prompt
          });
          if (response && response.text) {
            return response.text.trim();
          }
        } catch (mErr) {
          // Continue to next model
        }
      }

      return null;
    } catch (err: any) {
      console.warn("[GeminiProvider] Fallback due to error:", err.message);
      return null;
    }
  }
}
