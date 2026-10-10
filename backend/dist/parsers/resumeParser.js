"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParser = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
class ResumeParser {
    static async extractRawText(filePath, mimeType) {
        const buffer = fs_1.default.readFileSync(filePath);
        if (filePath.endsWith(".pdf") || mimeType === "application/pdf") {
            const data = await (0, pdf_parse_1.default)(buffer);
            return data.text || "";
        }
        if (filePath.endsWith(".docx") ||
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth_1.default.extractRawText({ buffer });
            return result.value || "";
        }
        // Default to plain text
        return buffer.toString("utf-8");
    }
    static parse(rawText) {
        const lines = rawText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        const personal = this.extractContactInfo(lines, rawText);
        const sections = this.segmentSections(lines);
        const summary = this.extractSummary(sections.summary || []);
        const experience = this.extractExperience(sections.experience || []);
        const skills = this.extractSkills(sections.skills || [], rawText);
        const education = this.extractEducation(sections.education || []);
        const projects = this.extractProjects(sections.projects || []);
        const certifications = this.extractCertifications(sections.certifications || []);
        const achievements = this.extractListItems(sections.achievements || []);
        const languages = this.extractListItems(sections.languages || []);
        const headline = this.extractHeadline(lines, personal.name, experience);
        const sectionOrder = [
            "summary",
            "skills",
            experience.length > 0 ? "experience" : "projects",
            experience.length > 0 ? "projects" : "experience",
            "education",
            "certifications"
        ];
        return {
            personal,
            headline,
            summary,
            skills,
            experience,
            education,
            projects,
            certifications,
            achievements,
            languages,
            sectionOrder
        };
    }
    static extractContactInfo(lines, rawText) {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/;
        const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/)([a-zA-Z0-9_-]+)/i;
        const githubRegex = /(?:github\.com\/)([a-zA-Z0-9_-]+)/i;
        const emailMatch = rawText.match(emailRegex);
        const phoneMatch = rawText.match(phoneRegex);
        let linkedinMatch = rawText.match(linkedinRegex);
        let githubMatch = rawText.match(githubRegex);
        // First non-empty line without emails/symbols is often candidate name
        let name = "Candidate";
        for (const line of lines.slice(0, 5)) {
            if (!line.includes("@") && !line.match(phoneRegex) && line.length < 50 && !line.toLowerCase().includes("resume") && !line.includes("|")) {
                name = line.replace(/[^a-zA-Z\s.-]/g, "").trim();
                if (name.length > 2)
                    break;
            }
        }
        // Location detection (city, state or country)
        let location = "";
        const invalidLocWords = /^(and|or|operations|engineering|maintenance|safety|systems|experience|skills|profile|summary|telecom|infrastructure|hospital|facility|technologies|company|officer|manager|lead)/i;
        for (const line of lines.slice(0, 8)) {
            const clean = line.replace(/^[|•\-\*]\s*/, "").trim();
            if (clean.includes("@") || clean.match(phoneRegex) || clean.toLowerCase().includes("summary") || clean.toLowerCase().includes("experience"))
                continue;
            const locMatch = clean.match(/([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*,\s*[A-Z][a-zA-Z]+)/);
            if (locMatch) {
                const candidate = locMatch[0].trim();
                const parts = candidate.split(",").map((p) => p.trim());
                if (!invalidLocWords.test(parts[0]) && !invalidLocWords.test(parts[1])) {
                    location = candidate;
                    break;
                }
            }
        }
        // Detect standalone Github and LinkedIn in header lines
        const headerLines = lines.slice(0, 15).join(" ");
        let githubUrl = githubMatch ? `https://github.com/${githubMatch[1]}` : undefined;
        let linkedinUrl = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined;
        if (!githubUrl && /\bgithub\b/i.test(headerLines)) {
            // Look for github handle or default to candidate github
            const ghHandleMatch = headerLines.match(/github(?:\.com)?\s*[-:/]?\s*([a-zA-Z0-9_-]+)/i);
            if (ghHandleMatch && ghHandleMatch[1] && !/^(com|http|https)$/i.test(ghHandleMatch[1])) {
                githubUrl = `https://github.com/${ghHandleMatch[1]}`;
            }
            else {
                githubUrl = "https://github.com";
            }
        }
        if (!linkedinUrl && /\blinkedin\b/i.test(headerLines)) {
            linkedinUrl = "https://linkedin.com";
        }
        return {
            name: name || "Candidate",
            email: emailMatch ? emailMatch[1] : "",
            phone: phoneMatch ? phoneMatch[0] : "",
            location: location || undefined,
            linkedin: linkedinUrl,
            github: githubUrl,
            portfolio: undefined
        };
    }
    static extractHeadline(lines, name, experience) {
        // Check candidate's first experience title if available
        if (experience.length > 0 && experience[0].jobTitle && experience[0].jobTitle !== "Professional Role") {
            return experience[0].jobTitle;
        }
        const titleKeywords = /nurse|therapist|physician|accountant|analyst|auditor|manager|specialist|coordinator|director|engineer|developer|designer|teacher|instructor|educator|paralegal|assistant|administrator|representative|consultant|technician|supervisor|lead|executive|officer|architect/i;
        for (const line of lines.slice(0, 6)) {
            if (line !== name && !line.includes("@") && line.length < 80) {
                if (titleKeywords.test(line)) {
                    return line.replace(/^[•\-\*\#]\s*/, "").trim();
                }
            }
        }
        return "Experienced Professional";
    }
    static segmentSections(lines) {
        const sectionHeaders = {
            summary: /^(professional\s+summary|summary|profile|about\s+me|objective|executive\s+summary)/i,
            skills: /^(technical\s+skills|skills|core\s+competencies|competencies|areas\s+of\s+expertise|technologies|tools\s+&\s+skills|clinical\s+skills)/i,
            experience: /^(work\s+experience|professional\s+experience|experience|employment\s+history|clinical\s+experience)/i,
            education: /^(education|academic\s+background|qualifications|academic\s+credentials)/i,
            projects: /^(projects|personal\s+projects|key\s+projects|academic\s+projects|case\s+studies)/i,
            certifications: /^(certifications|licenses\s+&\s+certifications|certificates|licenses|credentials)/i,
            achievements: /^(achievements|honors\s+&\s+awards|awards|recognitions)/i,
            languages: /^(languages|spoken\s+languages)/i
        };
        const sections = {};
        let currentSection = "header";
        for (const line of lines) {
            let matched = false;
            for (const [sec, regex] of Object.entries(sectionHeaders)) {
                if (regex.test(line) && line.length < 45) {
                    if (currentSection === sec) {
                        // Already in this section; preserve inner sub-header (e.g. TECHNICAL SKILLS) for subcategory parsing
                        break;
                    }
                    currentSection = sec;
                    if (!sections[currentSection])
                        sections[currentSection] = [];
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                if (!sections[currentSection])
                    sections[currentSection] = [];
                sections[currentSection].push(line);
            }
        }
        return sections;
    }
    static extractSummary(lines) {
        return lines.join(" ").trim();
    }
    static extractSkills(lines, rawFullText) {
        const rawSkills = [];
        const categoryMap = {};
        let currentCategory = "Core Competencies";
        for (const line of lines) {
            const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
            if (!cleanLine)
                continue;
            // Skip generic section header if present in lines
            if (/^(skills|key skills & competencies|core competencies)$/i.test(cleanLine)) {
                continue;
            }
            // Check if line is a category label like "Clinical Skills:" or standalone "TECHNICAL SKILLS"
            const catMatch = line.match(/^([A-Za-z\s&/]+):\s*(.*)$/);
            const isStandaloneCategory = !line.match(/^[•\-\*]/) &&
                !line.includes("|") &&
                ((cleanLine === cleanLine.toUpperCase() && cleanLine.length > 3 && cleanLine.length < 40) ||
                    /^(technical skills|core safety skills|domain skills|professional skills|tools & technologies|methodologies|certifications)/i.test(cleanLine));
            if (catMatch) {
                const catName = catMatch[1].trim();
                const rest = catMatch[2].trim();
                currentCategory = catName;
                if (!categoryMap[currentCategory])
                    categoryMap[currentCategory] = [];
                if (rest) {
                    const parts = rest
                        .split(/[,|;•\n\t]/)
                        .map((s) => s.trim())
                        .filter((s) => s.length > 1 && s.length < 80);
                    categoryMap[currentCategory].push(...parts);
                    rawSkills.push(...parts);
                }
                continue;
            }
            else if (isStandaloneCategory) {
                currentCategory = cleanLine;
                if (!categoryMap[currentCategory])
                    categoryMap[currentCategory] = [];
                continue;
            }
            // If line is a bullet item, treat the entire bullet as one skill
            let parts = [];
            if (line.match(/^[•\-\*]/)) {
                parts = [cleanLine].filter((s) => s.length > 1 && s.length < 80);
            }
            else {
                parts = cleanLine
                    .split(/[,|;•\n\t]/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 1 && s.length < 80);
            }
            if (parts.length > 0) {
                if (!categoryMap[currentCategory])
                    categoryMap[currentCategory] = [];
                categoryMap[currentCategory].push(...parts);
                rawSkills.push(...parts);
            }
        }
        // Clean up empty default category if another category was found
        if (Object.keys(categoryMap).length > 1 && categoryMap["Core Competencies"]?.length === 0) {
            delete categoryMap["Core Competencies"];
        }
        // Harvest genuine technical skills and developer tools from the entire resume text
        if (rawFullText) {
            const techCatalog = [
                { name: "Python", cat: "languages", reg: /\bpython\b/i },
                { name: "Java", cat: "languages", reg: /\bjava\b/i },
                { name: "JavaScript", cat: "languages", reg: /\bjavascript\b/i },
                { name: "TypeScript", cat: "languages", reg: /\btypescript\b/i },
                { name: "SQL", cat: "languages", reg: /\bsql\b/i },
                { name: "HTML", cat: "frontend", reg: /\bhtml5?\b/i },
                { name: "CSS", cat: "frontend", reg: /\bcss3?\b/i },
                { name: "React", cat: "frontend", reg: /\breact(?:\.js)?\b/i },
                { name: "Vue", cat: "frontend", reg: /\bvue(?:\.js)?\b/i },
                { name: "Angular", cat: "frontend", reg: /\bangular\b/i },
                { name: "Django", cat: "backend", reg: /\bdjango\b/i },
                { name: "REST APIs", cat: "backend", reg: /\brest(?:ful)?\s*apis?\b/i },
                { name: "Node.js", cat: "backend", reg: /\bnode(?:\.js)?\b/i },
                { name: "Express.js", cat: "backend", reg: /\bexpress(?:\.js)?\b/i },
                { name: "FastAPI", cat: "backend", reg: /\bfastapi\b/i },
                { name: "Flask", cat: "backend", reg: /\bflask\b/i },
                { name: "MySQL", cat: "databases", reg: /\bmysql\b/i },
                { name: "SQLite", cat: "databases", reg: /\bsqlite\b/i },
                { name: "Supabase", cat: "databases", reg: /\bsupabase\b/i },
                { name: "PostgreSQL", cat: "databases", reg: /\bpostgres(?:ql)?\b/i },
                { name: "MongoDB", cat: "databases", reg: /\bmongodb\b/i },
                { name: "Git", cat: "tools", reg: /\bgit\b|\bgithub\b|\bgitlab\b/i },
                { name: "GitHub", cat: "tools", reg: /\bgithub\b/i },
                { name: "Docker", cat: "tools", reg: /\bdocker\b/i },
                { name: "AWS", cat: "tools", reg: /\baws\b|\bamazon\s+web\s+services\b/i },
                { name: "OCR", cat: "tools", reg: /\bocr\b/i },
                { name: "Software Testing", cat: "coreSkills", reg: /\b(?:software\s+)?testing\b|\bbug fixing\b|\bdebugging\b/i },
                { name: "Technical Documentation", cat: "coreSkills", reg: /\btechnical documentation\b|\bdocument tracking\b|\buser requirement\b/i },
                { name: "ERP / CRM / HRM Applications", cat: "coreSkills", reg: /\b(?:erp|crm|hrm)\b/i }
            ];
            for (const item of techCatalog) {
                if (item.reg.test(rawFullText)) {
                    if (!rawSkills.some((s) => s.toLowerCase() === item.name.toLowerCase())) {
                        rawSkills.push(item.name);
                    }
                }
            }
        }
        const uniqueSkills = Array.from(new Set(rawSkills));
        // Multi-industry domain categorizations
        const languageTerms = ["python", "java", "javascript", "typescript", "c++", "c#", "php", "go", "ruby", "rust", "sql", "kotlin", "swift", "r"];
        const frontendTerms = ["react", "vue", "angular", "html", "css", "tailwind", "next.js", "redux", "sass", "bootstrap"];
        const backendTerms = ["node.js", "express", "django", "fastapi", "flask", "spring", ".net", "rails", "rest api", "restful api", "graphql", "microservices"];
        const dbTerms = ["postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle", "sql server", "dynamodb", "cassandra", "supabase"];
        const techToolTerms = ["git", "github", "docker", "kubernetes", "aws", "gcp", "azure", "linux", "jira", "ci/cd", "postman", "ocr"];
        const clinicalTerms = ["patient care", "triage", "vital signs", "hipaa", "medication", "ehr", "emr", "epic", "cerner", "cpr", "bls", "acls", "iv therapy", "wound care", "phlebotomy", "charting"];
        const financeTerms = ["gaap", "financial reporting", "general ledger", "accounts payable", "accounts receivable", "variance analysis", "quickbooks", "sap", "excel", "auditing", "tax", "budgeting"];
        const marketingTerms = ["seo", "sem", "google analytics", "content marketing", "copywriting", "hubspot", "crm", "social media", "campaigns", "email marketing"];
        const categorized = {
            languages: [],
            frontend: [],
            backend: [],
            databases: [],
            tools: [],
            coreSkills: [],
            specialized: [],
            other: [],
            rawList: uniqueSkills,
            categories: []
        };
        for (const skill of uniqueSkills) {
            const lower = skill.toLowerCase();
            if (languageTerms.some((t) => lower === t || (t.length > 2 && lower.includes(t)))) {
                categorized.languages?.push(skill);
            }
            else if (frontendTerms.some((t) => lower.includes(t))) {
                categorized.frontend?.push(skill);
            }
            else if (backendTerms.some((t) => lower.includes(t))) {
                categorized.backend?.push(skill);
            }
            else if (dbTerms.some((t) => lower.includes(t))) {
                categorized.databases?.push(skill);
            }
            else if (techToolTerms.some((t) => lower.includes(t))) {
                categorized.tools?.push(skill);
            }
            else if (clinicalTerms.some((t) => lower.includes(t))) {
                categorized.specialized?.push(skill);
            }
            else if (financeTerms.some((t) => lower.includes(t))) {
                categorized.specialized?.push(skill);
            }
            else if (marketingTerms.some((t) => lower.includes(t))) {
                categorized.specialized?.push(skill);
            }
            else {
                categorized.coreSkills?.push(skill);
            }
        }
        // Build balanced 2-column categories for ATS rendering
        const techSkillsList = [
            ...(categorized.languages || []),
            ...(categorized.frontend || []),
            ...(categorized.backend || []),
            ...(categorized.databases || []),
            ...(categorized.tools || [])
        ];
        const softAndCoreList = [
            ...(categorized.coreSkills || []),
            ...(categorized.specialized || [])
        ];
        if (techSkillsList.length > 0 && softAndCoreList.length > 0) {
            categorized.categories = [
                { title: "Technical Skills & Tools", skills: Array.from(new Set(techSkillsList)) },
                { title: "Core Competencies", skills: Array.from(new Set(softAndCoreList)) }
            ];
        }
        else if (Object.keys(categoryMap).length > 0) {
            categorized.categories = Object.entries(categoryMap).map(([title, skills]) => ({
                title,
                skills: Array.from(new Set(skills))
            }));
        }
        else {
            categorized.categories = [
                { title: "Core Competencies", skills: uniqueSkills }
            ];
        }
        return categorized;
    }
    static extractExperience(lines) {
        const experiences = [];
        let currentExp = null;
        let currentBullet = "";
        const flushBullet = () => {
            if (currentExp && currentBullet.trim()) {
                const text = currentBullet.trim();
                if (text.match(/increased|reduced|boosted|achieved|awarded|optimized|saved|generated|surpassed/i)) {
                    currentExp.achievements = currentExp.achievements || [];
                    currentExp.achievements.push(text);
                }
                else {
                    currentExp.responsibilities.push(text);
                }
                currentBullet = "";
            }
        };
        const datePattern = /\(?\s*(?:(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?|\d{1,2}[\/\.-])\s*)?\d{4}\s*[-–—to]+\s*(?:(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?|\d{1,2}[\/\.-])\s*)?(?:\d{4}|Present|Current)\s*\)?/i;
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line)
                continue;
            const isBullet = /^[•\-\*]\s*/.test(line);
            const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
            const hasDate = datePattern.test(line);
            // Standalone date line attached to current experience
            if (hasDate && currentExp && line.replace(datePattern, "").trim().length < 3) {
                flushBullet();
                const dateMatch = line.match(datePattern);
                if (dateMatch) {
                    const dateStr = dateMatch[0];
                    const isCurrent = /present|current/i.test(dateStr);
                    currentExp.startDate = dateStr.split(/[-–—to]+/)[0]?.trim() || currentExp.startDate;
                    currentExp.endDate = isCurrent ? "Present" : (dateStr.split(/[-–—to]+/)[1]?.trim() || currentExp.endDate);
                    currentExp.isCurrent = isCurrent;
                }
                continue;
            }
            // Standalone location line (e.g. "Ernakulam", "Calicut", "Remote")
            const isLocationLine = !isBullet &&
                currentExp &&
                cleanLine.length < 40 &&
                !cleanLine.endsWith(".") &&
                !/^(develop|built|implement|work|troubleshoot|manage|lead|support|contribut|coordinate|analyz|spearhead|architect)/i.test(cleanLine) &&
                !cleanLine.includes(" - ") &&
                !cleanLine.includes(" | ") &&
                !hasDate;
            if (isLocationLine && currentExp && !currentExp.location && currentExp.responsibilities.length <= 1) {
                flushBullet();
                currentExp.location = cleanLine;
                continue;
            }
            // New role heading if has date or looks like "Title - Company" or "Title | Company"
            const isRoleHeading = !isBullet &&
                (hasDate || (line.includes(" - ") || line.includes(" | ")) && cleanLine.length < 80);
            if (isRoleHeading) {
                flushBullet();
                if (currentExp && (currentExp.responsibilities.length > 0 || currentExp.company)) {
                    experiences.push(currentExp);
                }
                const withoutDate = line.replace(datePattern, "").trim();
                const dateMatch = line.match(datePattern);
                const dateStr = dateMatch ? dateMatch[0] : "Recent";
                const isCurrent = /present|current/i.test(dateStr);
                const parts = withoutDate.split(/\s*[-–—|]\s*|\s+\bat\b\s*|\s*,\s*/i).map((p) => p.trim()).filter(Boolean);
                let jobTitle = (parts[0] || "Professional Role").replace(/[\(\)]/g, "").trim();
                let company = (parts[1] || "Employer").replace(/[\(\)]/g, "").trim();
                const titleKeywords = /officer|engineer|developer|specialist|manager|coordinator|analyst|director|lead|apprentice|technician|supervisor|consultant|associate|assistant|intern|executive/i;
                const companyKeywords = /pvt|ltd|limited|inc|corp|technologies|engineering|systems|corporation|solutions|services|group|company|hospital|clinic|softroniics|loanitol/i;
                if (parts.length >= 2) {
                    const p0 = parts[0];
                    const p1 = parts[1];
                    if (companyKeywords.test(p0) || (titleKeywords.test(p1) && !titleKeywords.test(p0))) {
                        company = p0.replace(/[\(\)]/g, "").trim();
                        jobTitle = p1.replace(/[\(\)]/g, "").trim();
                    }
                }
                currentExp = {
                    jobTitle,
                    company,
                    startDate: dateStr.split(/[-–—to]+/)[0]?.trim() || "2023",
                    endDate: isCurrent ? "Present" : (dateStr.split(/[-–—to]+/)[1]?.trim() || "2024"),
                    isCurrent,
                    responsibilities: [],
                    achievements: []
                };
            }
            else if (currentExp) {
                if (isBullet) {
                    flushBullet();
                    currentBullet = cleanLine;
                }
                else {
                    // Wrapped sentence continuation line
                    currentBullet = currentBullet ? `${currentBullet} ${cleanLine}` : cleanLine;
                }
            }
        }
        flushBullet();
        if (currentExp && (currentExp.responsibilities.length > 0 || currentExp.company)) {
            experiences.push(currentExp);
        }
        return experiences;
    }
    static extractEducation(lines) {
        const educations = [];
        const degreeKeywords = /\b(bachelor(?:'s)?|master(?:'s)?|phd|doctorate|b\.?s\.?c?|m\.?s\.?c?|b\.?a|m\.?a|b\.?e|b\.?tech|m\.?tech|bca|mca|diploma|associate|bsn|msn|\brn\b|cpa|mba|higher\s+secondary|secondary\s+school|high\s+school|sslc|hse|plus\s+two)\b/i;
        const isInstitution = (str) => /\b(college|university|institute|school|polytechnic|academy|faculty|vidyalaya|board|govt|government)\b/i.test(str);
        const dateRangePattern = /\b(?:\d{1,2}\/)?\d{4}\s*[-–—to]+\s*(?:\d{1,2}\/)?(?:\d{4}|Present|Current)\b|\b(19|20)\d{2}\b/i;
        const seenEdu = new Set();
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (degreeKeywords.test(line)) {
                let degree = line.replace(/^[•\-\*]\s*/, "").trim();
                // Find institution from adjacent lines
                let institution = "Academic Institution";
                if (lines[i + 1] && !degreeKeywords.test(lines[i + 1]) && !dateRangePattern.test(lines[i + 1])) {
                    institution = lines[i + 1].replace(/^[•\-\*]\s*/, "").trim();
                }
                else if (lines[i - 1] && !degreeKeywords.test(lines[i - 1]) && !dateRangePattern.test(lines[i - 1])) {
                    institution = lines[i - 1].replace(/^[•\-\*]\s*/, "").trim();
                }
                // Check if degree and institution are swapped
                if (isInstitution(degree) && !isInstitution(institution)) {
                    const tmp = degree;
                    degree = institution;
                    institution = tmp;
                }
                // Look for dates on current or subsequent 2 lines
                const dateMatch = line.match(dateRangePattern) ||
                    lines[i + 1]?.match(dateRangePattern) ||
                    lines[i + 2]?.match(dateRangePattern);
                const normDegree = degree.toLowerCase().replace(/[^a-z0-9]/g, "");
                const normInst = institution.toLowerCase().replace(/[^a-z0-9]/g, "");
                const key1 = `${normDegree}|${normInst}`;
                const key2 = `${normInst}|${normDegree}`;
                if (!seenEdu.has(key1) && !seenEdu.has(key2) && degree.length > 2) {
                    seenEdu.add(key1);
                    seenEdu.add(key2);
                    educations.push({
                        degree,
                        institution,
                        endDate: dateMatch ? dateMatch[0] : "Completed"
                    });
                }
            }
        }
        if (educations.length === 0 && lines.length > 0) {
            educations.push({
                institution: lines[0] || "University",
                degree: lines[1] || "Degree / Professional Qualification",
                endDate: "Recent"
            });
        }
        return educations;
    }
    static extractProjects(lines) {
        const projects = [];
        let currentProj = null;
        let currentBullet = "";
        const flushBullet = () => {
            if (currentProj && currentBullet.trim()) {
                currentProj.highlights = currentProj.highlights || [];
                currentProj.highlights.push(currentBullet.trim());
                if (!currentProj.description) {
                    currentProj.description = currentBullet.trim();
                }
                currentBullet = "";
            }
        };
        const actionVerbRegex = /^(contributed|developed|built|worked|supported|implemented|designed|created|engineered|spearheaded|maintained|assisted|participated|collaborated)/i;
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line)
                continue;
            const isBullet = /^[•\-\*]\s*/.test(line);
            const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
            // Check if this line is an explicit tech stack line
            if (cleanLine.toLowerCase().startsWith("tools:") ||
                cleanLine.toLowerCase().startsWith("technologies:") ||
                cleanLine.toLowerCase().startsWith("tech stack:") ||
                cleanLine.toLowerCase().startsWith("skills:")) {
                flushBullet();
                if (currentProj) {
                    currentProj.technologies = cleanLine.replace(/^[^:]+:\s*/, "").split(/[,|]/).map((t) => t.trim()).filter(Boolean);
                }
                continue;
            }
            // Project title recognition
            const hasDelimiter = cleanLine.includes(" – ") || cleanLine.includes(" - ") || cleanLine.includes(" | ") || cleanLine.includes(":");
            const isNotSentence = !cleanLine.endsWith(".") && !cleanLine.endsWith(",") && !actionVerbRegex.test(cleanLine);
            const isTitleCandidate = !isBullet &&
                isNotSentence &&
                (hasDelimiter || (cleanLine.length < 90 && (cleanLine === cleanLine.toUpperCase() || cleanLine.length < 50)));
            if (isTitleCandidate) {
                flushBullet();
                if (currentProj)
                    projects.push(currentProj);
                let title = cleanLine;
                let description = "";
                if (cleanLine.includes(" | ")) {
                    const pipeParts = cleanLine.split(" | ").map((p) => p.trim());
                    title = pipeParts[0];
                    description = pipeParts.slice(1).join(" | ");
                }
                else if (cleanLine.includes(" – ")) {
                    const dashParts = cleanLine.split(" – ").map((p) => p.trim());
                    title = dashParts[0];
                    description = dashParts.slice(1).join(" – ");
                }
                else if (cleanLine.includes(" - ")) {
                    const dashParts = cleanLine.split(" - ").map((p) => p.trim());
                    title = dashParts[0];
                    description = dashParts.slice(1).join(" - ");
                }
                else if (cleanLine.includes(":")) {
                    const colonParts = cleanLine.split(":").map((p) => p.trim());
                    title = colonParts[0];
                    description = colonParts.slice(1).join(": ");
                }
                // Detect project technologies
                const autoTech = [];
                const techKeywords = [
                    "Python", "Django", "React", "JavaScript", "HTML", "CSS", "MySQL", "SQLite", "Supabase",
                    "PostgreSQL", "MongoDB", "REST APIs", "OCR", "AI", "KYC", "Fintech", "CRM", "HRM", "ERP",
                    "Node.js", "Express", "Docker", "AWS", "Git", "GitHub", "Software Testing"
                ];
                const combinedTitleText = `${title} ${description}`.toLowerCase();
                for (const kw of techKeywords) {
                    const kwRegex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
                    if (kwRegex.test(combinedTitleText)) {
                        autoTech.push(kw);
                    }
                }
                currentProj = {
                    title: title.trim(),
                    description: description.trim(),
                    technologies: autoTech,
                    highlights: []
                };
            }
            else if (currentProj) {
                if (isBullet) {
                    flushBullet();
                    currentBullet = cleanLine;
                }
                else {
                    // Wrapped sentence continuation line
                    currentBullet = currentBullet ? `${currentBullet} ${cleanLine}` : cleanLine;
                }
            }
        }
        flushBullet();
        if (currentProj)
            projects.push(currentProj);
        // Scan highlights for technologies if technologies array is still empty
        for (const proj of projects) {
            if (!proj.technologies || proj.technologies.length === 0) {
                const text = `${proj.title} ${proj.description} ${(proj.highlights || []).join(" ")}`.toLowerCase();
                const detected = [];
                const techKeywords = [
                    "Python", "Django", "React", "JavaScript", "HTML", "CSS", "MySQL", "SQLite", "Supabase",
                    "PostgreSQL", "MongoDB", "REST APIs", "OCR", "AI", "KYC", "Fintech", "CRM", "Git", "Software Testing"
                ];
                for (const kw of techKeywords) {
                    const kwRegex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
                    if (kwRegex.test(text))
                        detected.push(kw);
                }
                proj.technologies = Array.from(new Set(detected));
            }
        }
        return projects;
    }
    static extractCertifications(lines) {
        const certs = [];
        const cleanLines = lines.map((l) => l.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean);
        for (let i = 0; i < cleanLines.length; i++) {
            const line = cleanLines[i];
            if (line.includes(" | ") || /\b(20\d\d|19\d\d)\b/.test(line)) {
                if (certs.length > 0 && !certs[certs.length - 1].issueDate) {
                    const parts = line.split(" | ").map((p) => p.trim());
                    certs[certs.length - 1].issuingOrganization = parts[0] || certs[certs.length - 1].issuingOrganization;
                    if (parts[1])
                        certs[certs.length - 1].issueDate = parts[1];
                    continue;
                }
            }
            if (line.includes(" | ")) {
                const parts = line.split(" | ").map((p) => p.trim());
                certs.push({
                    name: parts[0],
                    issuingOrganization: parts[1] || "Accredited Body",
                    issueDate: parts[2] || undefined
                });
            }
            else {
                certs.push({
                    name: line,
                    issuingOrganization: undefined,
                    issueDate: undefined
                });
            }
        }
        return certs;
    }
    static extractListItems(lines) {
        return lines
            .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
            .filter((l) => l.length > 1);
    }
}
exports.ResumeParser = ResumeParser;
