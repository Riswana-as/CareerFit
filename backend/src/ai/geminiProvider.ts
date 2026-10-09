import { GoogleGenAI } from "@google/genai";
import { StructuredResume, ExtractedJobDescription } from "../types";

export class GeminiProvider {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.warn("[GeminiProvider] Initialization error:", e);
      }
    }
  }

  isAvailable(): boolean {
    return !!this.ai && !!process.env.GEMINI_API_KEY;
  }

  async optimizeSummaryWithGemini(
    originalSummary: string,
    resume: StructuredResume,
    job: ExtractedJobDescription
  ): Promise<string | null> {
    if (!this.ai) return null;

    try {
      const prompt = `
You are an expert ATS resume optimizer with a strict rule: NEVER FABRICATE ANY EXPERIENCE, METRICS, OR SKILLS.
Optimize the following professional summary for the target role: "${job.detectedRole}".
Only highlight skills and experience already present in the candidate's resume:
${JSON.stringify({ summary: originalSummary, skills: resume.skills, experienceYears: resume.experience.length })}

Job Description Summary:
${job.rawText.slice(0, 1000)}

Rules:
1. Do not add skills the candidate does not have.
2. Keep it between 3 to 4 sentences.
3. Return only the optimized summary string with no commentary.
`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      return response.text?.trim() || null;
    } catch (err: any) {
      console.warn("[GeminiProvider] Fallback due to error:", err.message);
      return null;
    }
  }
}
