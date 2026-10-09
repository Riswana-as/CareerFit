import { ExtractedJobDescription } from "../types";

export class JobParser {
  static parse(rawText: string, manualOverrides?: Partial<ExtractedJobDescription>): ExtractedJobDescription {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const title = manualOverrides?.title || this.detectJobTitle(lines, rawText);
    const company = manualOverrides?.company || this.detectCompany(lines, rawText);
    const { detectedRole, confidence } = this.detectRole(rawText, title);
    const department = manualOverrides?.department || this.detectDepartment(rawText);
    const experienceLevel = manualOverrides?.experienceLevel || this.detectExperienceLevel(rawText);
    const employmentType = manualOverrides?.employmentType || this.detectEmploymentType(rawText);
    const location = manualOverrides?.location || this.detectLocation(rawText);

    const { requiredSkills, preferredSkills } = this.extractSkills(rawText);
    const responsibilities = this.extractResponsibilities(rawText);
    const qualifications = this.extractQualifications(rawText);

    return {
      title,
      company,
      detectedRole,
      roleConfidence: confidence,
      department,
      experienceLevel,
      location,
      employmentType,
      requiredSkills,
      preferredSkills,
      responsibilities,
      qualifications,
      rawText
    };
  }

  private static detectJobTitle(lines: string[], rawText: string): string {
    const titleRegex = /(?:job\s+title|position|role):\s*([^\r\n]+)/i;
    const match = rawText.match(titleRegex);
    if (match && match[1].trim()) return match[1].trim();

    for (const line of lines.slice(0, 5)) {
      if (
        /developer|engineer|architect|manager|lead|analyst|designer|consultant/i.test(line) &&
        line.length < 60 &&
        !line.toLowerCase().startsWith("about")
      ) {
        return line.replace(/^[\*\#\-]\s*/, "").trim();
      }
    }

    return "Software Developer";
  }

  private static detectCompany(lines: string[], rawText: string): string {
    const compRegex = /(?:company|organization|employer):\s*([^\r\n]+)/i;
    const match = rawText.match(compRegex);
    if (match && match[1].trim()) return match[1].trim();

    const atCompRegex = /(?:at|with)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/;
    const matchAt = rawText.match(atCompRegex);
    if (matchAt && matchAt[1].length < 40) return matchAt[1];

    return "Target Employer";
  }

  static detectRole(rawText: string, titleHint?: string): { detectedRole: string; confidence: number } {
    const text = (titleHint + " " + rawText).toLowerCase();

    const roleDefinitions: { role: string; keywords: string[]; baseWeight: number }[] = [
      {
        role: "Backend Developer",
        keywords: ["backend", "back-end", "node.js", "express", "django", "fastapi", "spring", "microservices", "rest api", "sql", "postgresql", "database"],
        baseWeight: 20
      },
      {
        role: "Frontend Developer",
        keywords: ["frontend", "front-end", "react", "vue", "angular", "html", "css", "tailwind", "ui/ux", "next.js", "redux", "web developer"],
        baseWeight: 20
      },
      {
        role: "Full Stack Developer",
        keywords: ["full stack", "fullstack", "full-stack", "mern", "mean", "frontend and backend", "web applications"],
        baseWeight: 25
      },
      {
        role: "DevOps Engineer",
        keywords: ["devops", "kubernetes", "docker", "ci/cd", "terraform", "aws", "cloud", "infrastructure", "jenkins"],
        baseWeight: 25
      },
      {
        role: "Data Engineer",
        keywords: ["data engineer", "etl", "spark", "hadoop", "airflow", "data pipeline", "bigquery", "snowflake", "kafka"],
        baseWeight: 25
      },
      {
        role: "Mobile App Developer",
        keywords: ["ios", "android", "flutter", "react native", "swift", "kotlin", "mobile app"],
        baseWeight: 25
      }
    ];

    let bestRole = "Software Developer";
    let highestScore = 0;

    for (const def of roleDefinitions) {
      let score = 0;
      if (titleHint && titleHint.toLowerCase().includes(def.role.toLowerCase())) {
        score += 50;
      }
      for (const kw of def.keywords) {
        if (text.includes(kw)) {
          score += 10;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestRole = def.role;
      }
    }

    // Normalized confidence percentage between 75% and 98%
    const confidence = Math.min(98, Math.max(75, Math.floor(75 + (highestScore / 80) * 23)));
    return { detectedRole: bestRole, confidence };
  }

  private static detectDepartment(rawText: string): string {
    if (/engineering|software|technology|it/i.test(rawText)) return "Engineering";
    if (/product/i.test(rawText)) return "Product";
    if (/design|creative/i.test(rawText)) return "Design";
    return "Technology";
  }

  private static detectExperienceLevel(rawText: string): ExtractedJobDescription["experienceLevel"] {
    if (/senior|sr\.|principal|lead|staff/i.test(rawText)) return "Senior";
    if (/junior|jr\.|entry|associate|graduate|fresher/i.test(rawText)) return "Entry";
    if (/lead|director|manager/i.test(rawText)) return "Lead";
    return "Mid";
  }

  private static detectEmploymentType(rawText: string): ExtractedJobDescription["employmentType"] {
    if (/contract|freelance/i.test(rawText)) return "Contract";
    if (/part-time|part time/i.test(rawText)) return "Part-time";
    if (/remote|work from home/i.test(rawText)) return "Remote";
    if (/hybrid/i.test(rawText)) return "Hybrid";
    return "Full-time";
  }

  private static detectLocation(rawText: string): string {
    const locMatch = rawText.match(/(?:location|workplace):\s*([^\r\n]+)/i);
    if (locMatch) return locMatch[1].trim();
    if (/remote/i.test(rawText)) return "Remote";
    return "Hybrid / On-site";
  }

  private static extractSkills(rawText: string) {
    const techCatalog = [
      "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Ruby", "PHP", "Swift", "Kotlin", "Rust",
      "React", "Vue.js", "Angular", "Next.js", "Node.js", "Express.js", "Django", "FastAPI", "Spring Boot",
      "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Redux", "GraphQL", "REST APIs", "RESTful API",
      "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Elasticsearch",
      "Docker", "Kubernetes", "AWS", "Google Cloud", "GCP", "Azure", "Git", "GitHub", "CI/CD", "Linux",
      "Microservices", "Kafka", "RabbitMQ", "Terraform", "Postman", "Jest", "PyTest", "Agile", "Scrum"
    ];

    const lowerText = rawText.toLowerCase();
    const matchedSkills = techCatalog.filter((skill) => {
      const escaped = skill.toLowerCase().replace(/[\.\+]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      return regex.test(lowerText);
    });

    // Check for sections "Preferred" or "Nice to have"
    const preferredSectionMatch = rawText.match(/(?:preferred|nice\s+to\s+have|bonus|plus)[\s\S]*?(?=\n\n[A-Z]|$)/i);
    const preferredText = preferredSectionMatch ? preferredSectionMatch[0].toLowerCase() : "";

    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    for (const skill of matchedSkills) {
      if (preferredText && preferredText.includes(skill.toLowerCase())) {
        preferredSkills.push(skill);
      } else {
        requiredSkills.push(skill);
      }
    }

    return {
      requiredSkills: requiredSkills.length > 0 ? requiredSkills : matchedSkills.slice(0, 6),
      preferredSkills: preferredSkills.length > 0 ? preferredSkills : matchedSkills.slice(6)
    };
  }

  private static extractResponsibilities(rawText: string): string[] {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim());
    const bullets: string[] = [];
    let capture = false;

    for (const line of lines) {
      if (/responsibilities|what\s+you('ll|\s+will)\s+do|key\s+duties/i.test(line)) {
        capture = true;
        continue;
      }
      if (capture) {
        if (/requirements|qualifications|about\s+you|benefits/i.test(line) && line.length < 40) {
          capture = false;
          break;
        }
        const clean = line.replace(/^[•\-\*\d\.]\s*/, "").trim();
        if (clean.length > 15) bullets.push(clean);
      }
    }

    if (bullets.length === 0) {
      return [
        "Architect and develop reliable software applications and backend services.",
        "Collaborate in cross-functional agile teams to deliver key product features.",
        "Ensure high test coverage, code quality, and maintainable software standards."
      ];
    }

    return bullets.slice(0, 8);
  }

  private static extractQualifications(rawText: string): string[] {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim());
    const bullets: string[] = [];
    let capture = false;

    for (const line of lines) {
      if (/qualifications|requirements|what\s+we('re|\s+are)\s+looking\s+for/i.test(line)) {
        capture = true;
        continue;
      }
      if (capture) {
        if (/benefits|what\s+we\s+offer|compensation/i.test(line) && line.length < 40) {
          capture = false;
          break;
        }
        const clean = line.replace(/^[•\-\*\d\.]\s*/, "").trim();
        if (clean.length > 10) bullets.push(clean);
      }
    }

    if (bullets.length === 0) {
      return [
        "Bachelor's degree in Computer Science, Engineering, or equivalent experience.",
        "Demonstrated proficiency in building production web applications."
      ];
    }

    return bullets.slice(0, 6);
  }
}
