"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobParser = void 0;
class JobParser {
    static parse(rawText, manualOverrides) {
        const lines = rawText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        const title = manualOverrides?.title || this.detectJobTitle(lines, rawText);
        const company = manualOverrides?.company || this.detectCompany(lines, rawText);
        const { detectedRole, confidence } = this.detectRole(rawText, title);
        const department = manualOverrides?.department || this.detectDepartment(rawText, detectedRole);
        const experienceLevel = manualOverrides?.experienceLevel || this.detectExperienceLevel(rawText);
        const employmentType = manualOverrides?.employmentType || this.detectEmploymentType(rawText);
        const location = manualOverrides?.location || this.detectLocation(rawText);
        const { requiredSkills, preferredSkills } = this.extractSkills(rawText);
        const responsibilities = this.extractResponsibilities(rawText, detectedRole);
        const qualifications = this.extractQualifications(rawText, detectedRole);
        return {
            title,
            company,
            detectedRole: manualOverrides?.detectedRole || detectedRole,
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
    static detectJobTitle(lines, rawText) {
        const titleRegex = /(?:job\s+title|position|role|title|opening):\s*([^\r\n]+)/i;
        const match = rawText.match(titleRegex);
        if (match && match[1].trim()) {
            return match[1].replace(/^[•\-\*\#\d\.]\s*/, "").trim();
        }
        const titleKeywords = /nurse|therapist|physician|accountant|analyst|auditor|manager|specialist|coordinator|director|engineer|developer|designer|teacher|instructor|educator|paralegal|assistant|administrator|representative|consultant|technician|supervisor|lead|executive|officer|architect|marketer|recruiter/i;
        for (const line of lines.slice(0, 8)) {
            const clean = line.replace(/^[•\-\*\#\d\.]\s*/, "").trim();
            if (titleKeywords.test(clean) &&
                clean.length < 70 &&
                !clean.toLowerCase().startsWith("about") &&
                !clean.toLowerCase().startsWith("company") &&
                !clean.toLowerCase().startsWith("location")) {
                return clean;
            }
        }
        // Fall back to first short prominent header line if available
        for (const line of lines.slice(0, 3)) {
            const clean = line.replace(/^[•\-\*\#\d\.]\s*/, "").trim();
            if (clean.length > 3 && clean.length < 60 && !clean.includes("@") && !clean.includes("http")) {
                return clean;
            }
        }
        return "Professional Role";
    }
    static detectCompany(lines, rawText) {
        const compRegex = /(?:company|organization|employer|institution|hospital|firm):\s*([^\r\n]+)/i;
        const match = rawText.match(compRegex);
        if (match && match[1].trim())
            return match[1].trim();
        const atCompRegex = /(?:at|with)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/;
        const matchAt = rawText.match(atCompRegex);
        if (matchAt && matchAt[1].length < 40 && !matchAt[1].toLowerCase().includes("least") && !matchAt[1].toLowerCase().includes("present")) {
            return matchAt[1];
        }
        return "Target Employer";
    }
    static detectRole(rawText, titleHint) {
        const text = ((titleHint || "") + " " + rawText).toLowerCase();
        const roleDefinitions = [
            // Health, Safety & Environment (HSE / EHS)
            {
                role: "Safety Officer",
                keywords: [
                    "safety officer",
                    "ehs officer",
                    "hse officer",
                    "safety engineer",
                    "ehs engineer",
                    "safety supervisor",
                    "hira",
                    "ptw",
                    "tbt",
                    "nebosh",
                    "iosh",
                    "occupational health and safety",
                    "safety inspections",
                    "confined space",
                    "work at height"
                ],
                department: "Health & Safety / Operations",
                baseWeight: 35
            },
            {
                role: "HSE Manager",
                keywords: [
                    "hse manager",
                    "ehs manager",
                    "safety manager",
                    "health and safety manager",
                    "environmental safety",
                    "iso 45001",
                    "iso 14001",
                    "safety audit",
                    "safety leadership"
                ],
                department: "Health & Safety / Operations",
                baseWeight: 30
            },
            // Healthcare & Nursing
            {
                role: "Registered Nurse (RN)",
                keywords: ["registered nurse", " rn ", "rn,", "nursing", "patient care", "triage", "vital signs", "bls", "acls", "iv therapy", "clinical care", "hospital"],
                department: "Healthcare",
                baseWeight: 30
            },
            {
                role: "Clinical Care Specialist",
                keywords: ["clinical specialist", "nurse practitioner", "physician assistant", "patient assessment", "ehr", "emr", "medical assistant", "care coordinator"],
                department: "Healthcare",
                baseWeight: 25
            },
            // Finance & Accounting
            {
                role: "Financial Analyst",
                keywords: ["financial analyst", "financial modeling", "variance analysis", "budgeting", "forecasting", "fp&a", "cash flow", "cfa"],
                department: "Finance",
                baseWeight: 30
            },
            {
                role: "Staff Accountant",
                keywords: ["accountant", "accounting", "general ledger", "gaap", "accounts payable", "accounts receivable", "reconciliation", "cpa", "quickbooks", "tax audit"],
                department: "Finance",
                baseWeight: 30
            },
            // Marketing & Growth
            {
                role: "Digital Marketing Specialist",
                keywords: ["digital marketing", "marketing specialist", "seo", "sem", "google analytics", "content marketing", "social media", "email campaigns", "hubspot", "growth marketing"],
                department: "Marketing",
                baseWeight: 30
            },
            {
                role: "Content Marketing Manager",
                keywords: ["content marketing", "copywriting", "content strategy", "editorial", "blog", "brand messaging", "creative storytelling"],
                department: "Marketing",
                baseWeight: 25
            },
            // Sales & Business Development
            {
                role: "Account Executive",
                keywords: ["account executive", "sales representative", "b2b sales", "pipeline management", "quota attainment", "salesforce", "cold calling", "lead generation"],
                department: "Sales",
                baseWeight: 30
            },
            {
                role: "Customer Success Manager",
                keywords: ["customer success", "client retention", "account management", "onboarding", "churn reduction", "customer satisfaction", "csat"],
                department: "Customer Success",
                baseWeight: 25
            },
            // Human Resources
            {
                role: "Human Resources Coordinator",
                keywords: ["human resources", "hr coordinator", "talent acquisition", "recruiter", "recruiting", "employee onboarding", "workday", "employee relations", "benefits administration"],
                department: "Human Resources",
                baseWeight: 30
            },
            // Operations & Project Management
            {
                role: "Operations Manager",
                keywords: ["operations manager", "process improvement", "lean six sigma", "supply chain", "logistics", "vendor management", "workflow optimization", "inventory control"],
                department: "Operations",
                baseWeight: 30
            },
            {
                role: "Project Manager",
                keywords: ["project manager", "pmp", "agile", "scrum master", "sprint planning", "stakeholder management", "jira", "deliverables", "cross-functional"],
                department: "Operations",
                baseWeight: 30
            },
            // Education & Instruction
            {
                role: "Educator / Teacher",
                keywords: ["teacher", "educator", "classroom management", "lesson planning", "curriculum development", "student assessment", "special education", "differentiated instruction"],
                department: "Education",
                baseWeight: 30
            },
            // Legal & Compliance
            {
                role: "Paralegal / Legal Specialist",
                keywords: ["paralegal", "legal assistant", "contracts", "compliance", "litigation", "legal research", "regulatory filings"],
                department: "Legal",
                baseWeight: 30
            },
            // Engineering & Design
            {
                role: "Mechanical Engineer",
                keywords: ["mechanical engineer", "autocad", "solidworks", "cad", "manufacturing", "thermal", "prototyping", "tolerance analysis"],
                department: "Engineering",
                baseWeight: 30
            },
            {
                role: "UI/UX Designer",
                keywords: ["ui/ux", "ux designer", "ui designer", "product designer", "figma", "wireframing", "prototyping", "user research", "design system"],
                department: "Design",
                baseWeight: 30
            },
            // Software & Tech
            {
                role: "Backend Developer",
                keywords: ["backend", "back-end", "node.js", "express", "django", "fastapi", "spring", "microservices", "rest api", "sql", "postgresql", "database"],
                department: "Engineering",
                baseWeight: 25
            },
            {
                role: "Frontend Developer",
                keywords: ["frontend", "front-end", "react", "vue", "angular", "html", "css", "tailwind", "next.js", "web developer"],
                department: "Engineering",
                baseWeight: 25
            },
            {
                role: "Full Stack Developer",
                keywords: ["full stack", "fullstack", "full-stack", "mern", "mean", "frontend and backend"],
                department: "Engineering",
                baseWeight: 25
            },
            {
                role: "DevOps Engineer",
                keywords: ["devops", "kubernetes", "docker", "ci/cd", "terraform", "aws", "cloud", "infrastructure", "jenkins"],
                department: "Engineering",
                baseWeight: 25
            },
            {
                role: "Data Engineer",
                keywords: ["data engineer", "etl", "spark", "hadoop", "airflow", "data pipeline", "bigquery", "snowflake", "kafka"],
                department: "Engineering",
                baseWeight: 25
            }
        ];
        let bestRole = titleHint && titleHint !== "Professional Role" ? titleHint : "Target Professional";
        let highestScore = 0;
        for (const def of roleDefinitions) {
            let score = 0;
            if (titleHint && titleHint.toLowerCase().includes(def.role.toLowerCase())) {
                score += 60;
            }
            for (const kw of def.keywords) {
                if (text.includes(kw)) {
                    score += 8;
                }
            }
            if (score > highestScore) {
                highestScore = score;
                bestRole = def.role;
            }
        }
        // If titleHint was explicit and meaningful, respect it directly
        if (titleHint && titleHint !== "Professional Role" && highestScore < 40) {
            bestRole = titleHint;
            highestScore = 50;
        }
        const confidence = Math.min(98, Math.max(76, Math.floor(75 + (highestScore / 70) * 23)));
        return { detectedRole: bestRole, confidence };
    }
    static detectDepartment(rawText, role) {
        const text = ((role || "") + " " + rawText).toLowerCase();
        if (/safety|ehs|hse|hira|ptw|tbt|nebosh|iosh|hazard|osha|iso\s*45001/i.test(text))
            return "Health & Safety / Operations";
        if (/nurse|nursing|clinical|hospital|patient|physician|healthcare|medical/i.test(text))
            return "Healthcare";
        if (/account|finance|audit|tax|budget|cpa|bookkeep/i.test(text))
            return "Finance & Accounting";
        if (/marketing|seo|sem|social media|content|brand|campaign/i.test(text))
            return "Marketing";
        if (/sales|account executive|b2b|quota|pipeline/i.test(text))
            return "Sales";
        if (/human resources|recruiting|talent|onboarding|hris/i.test(text))
            return "Human Resources";
        if (/operations|supply chain|logistics|inventory|procurement/i.test(text))
            return "Operations";
        if (/teacher|curriculum|classroom|student|instructional|education/i.test(text))
            return "Education";
        if (/legal|paralegal|compliance|litigation|contract/i.test(text))
            return "Legal";
        if (/mechanical|civil|electrical|chemical|hardware/i.test(text))
            return "Engineering";
        if (/design|ui\/ux|graphic|creative|visual/i.test(text))
            return "Design & Creative";
        if (/developer|software|programming|cloud|devops|backend|frontend/i.test(text))
            return "Technology";
        return "Operations";
    }
    static detectExperienceLevel(rawText) {
        if (/senior|sr\.|principal|lead|staff|head\s+of/i.test(rawText))
            return "Senior";
        if (/junior|jr\.|entry|associate|graduate|fresher|entry-level/i.test(rawText))
            return "Entry";
        if (/director|vp|vice\s+president|executive|chief/i.test(rawText))
            return "Executive";
        if (/manager|lead|supervisor/i.test(rawText))
            return "Lead";
        return "Mid";
    }
    static detectEmploymentType(rawText) {
        if (/contract|freelance|temporary/i.test(rawText))
            return "Contract";
        if (/part-time|part time/i.test(rawText))
            return "Part-time";
        if (/remote|work from home/i.test(rawText))
            return "Remote";
        if (/hybrid/i.test(rawText))
            return "Hybrid";
        return "Full-time";
    }
    static detectLocation(rawText) {
        const locMatch = rawText.match(/(?:location|workplace|office|based in):\s*([^\r\n]+)/i);
        if (locMatch)
            return locMatch[1].trim();
        if (/remote/i.test(rawText))
            return "Remote";
        return "Hybrid / On-site";
    }
    static extractSkills(rawText) {
        // Multi-industry skill taxonomy
        const universalSkillsCatalog = [
            // Health, Safety & Environmental (HSE / EHS)
            "Hazard Identification and Risk Assessment (HIRA)", "Permit to Work (PTW)",
            "Tool Box Talks (TBT)", "PPE Compliance", "Safety Inspections & Audits",
            "Incident Investigation & Near-Miss Reporting", "Corrective and Preventive Actions (CAPA)",
            "Job Safety Analysis (JSA)", "Emergency Response Planning", "Work at Height Safety",
            "Confined Space Safety", "Electrical Safety & Earthing", "Fire Safety & Extinguisher Inspection",
            "Hazardous Material Handling (HAZMAT)", "Lockout/Tagout (LOTO)", "NEBOSH", "IOSH",
            "OSHA Compliance", "ISO 45001", "ISO 14001", "Environmental Health and Safety (EHS)",
            "Risk Mitigation", "Behavior-Based Safety (BBS)", "Safety Culture Promotion",
            "First Aid & CPR", "Industrial Hygiene", "Ergonomics Assessment",
            // Healthcare & Clinical
            "Patient Care", "Triage", "Vital Signs", "HIPAA", "Medication Administration",
            "EHR", "EMR", "Epic", "Cerner", "CPR", "BLS", "ACLS", "Patient Assessment",
            "Phlebotomy", "Wound Care", "Patient Education", "Infection Control", "IV Therapy",
            "Care Planning", "Clinical Documentation", "Telehealth", "Discharge Planning",
            // Finance & Accounting
            "GAAP", "Financial Reporting", "General Ledger", "Accounts Payable", "Accounts Receivable",
            "Variance Analysis", "Financial Modeling", "QuickBooks", "SAP", "Auditing",
            "Tax Compliance", "Budgeting", "Microsoft Excel", "Financial Forecasting", "Payroll",
            "Cash Flow Analysis", "Internal Controls", "Account Reconciliation", "ERP Systems",
            // Marketing & Growth
            "SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media Marketing",
            "Copywriting", "Email Marketing", "HubSpot", "Mailchimp", "CRM",
            "Brand Strategy", "Market Research", "Conversion Rate Optimization", "PPC Advertising",
            "Digital Marketing", "Public Relations", "Campaign Management", "A/B Testing",
            // Sales & Client Success
            "B2B Sales", "Cold Calling", "Lead Generation", "Pipeline Management", "Salesforce",
            "Contract Negotiation", "Client Retention", "Account Management", "Product Demos",
            "Quota Attainment", "Relationship Building", "Customer Success", "Upselling",
            // Human Resources
            "Talent Acquisition", "Full-Cycle Recruiting", "Employee Onboarding", "Performance Management",
            "Labor Law Compliance", "Workday", "ATS Screening", "Employee Relations",
            "Benefits Administration", "HRIS", "Succession Planning", "Staffing",
            // Operations & Management
            "Project Management", "Agile", "Scrum", "Lean Six Sigma", "Process Improvement",
            "Supply Chain Management", "Inventory Control", "Vendor Management", "KPI Tracking",
            "Workflow Optimization", "Logistics", "Budget Management", "Change Management",
            // Education & Training
            "Lesson Planning", "Classroom Management", "Curriculum Development", "Student Assessment",
            "Special Education", "Differentiated Instruction", "Parent Communication",
            "Learning Management Systems", "Instructional Design", "Student Engagement",
            // Design & Creative
            "Figma", "Adobe Photoshop", "Adobe Illustrator", "InDesign", "UI/UX Design",
            "Wireframing", "Prototyping", "User Research", "Brand Identity", "Visual Design",
            // Engineering & Trades
            "AutoCAD", "SolidWorks", "MATLAB", "Circuit Design", "Quality Assurance",
            "Root Cause Analysis", "PLC Programming", "Preventative Maintenance", "Technical Documentation",
            // Software & IT
            "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "PHP", "Swift",
            "React", "Vue.js", "Angular", "Next.js", "Node.js", "Express.js", "Django", "FastAPI",
            "HTML", "CSS", "Tailwind CSS", "REST APIs", "GraphQL", "PostgreSQL", "MySQL", "MongoDB",
            "Redis", "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Git", "GitHub", "CI/CD", "Linux"
        ];
        const lowerText = rawText.toLowerCase();
        const matchedSkills = [];
        // 1. Match from multi-industry catalog (with acronym and base name resilience)
        for (const skill of universalSkillsCatalog) {
            const parenMatch = skill.match(/\(([^)]+)\)/);
            const acronym = parenMatch ? parenMatch[1] : null;
            const baseName = skill.replace(/\s*\([^)]+\)/g, "").trim();
            const escapedBase = baseName.toLowerCase().replace(/[\.\+\/]/g, "\\$&");
            const baseRegex = new RegExp(`\\b${escapedBase}\\b`, "i");
            let matched = baseRegex.test(lowerText);
            if (!matched && acronym) {
                const escapedAcronym = acronym.toLowerCase().replace(/[\.\+\/]/g, "\\$&");
                const acronymRegex = new RegExp(`\\b${escapedAcronym}\\b`, "i");
                matched = acronymRegex.test(lowerText);
            }
            if (matched && !matchedSkills.includes(skill)) {
                matchedSkills.push(skill);
            }
        }
        // 2. Dynamic extraction from bullet points under requirements/qualifications
        const lines = rawText.split(/\r?\n/).map((l) => l.trim());
        let inReqSection = false;
        for (const line of lines) {
            if (/requirements|qualifications|skills|competencies|what\s+you\s+need|must\s+haves/i.test(line)) {
                inReqSection = true;
                continue;
            }
            if (inReqSection && (/responsibilities|about\s+us|benefits|what\s+we\s+offer/i.test(line) && line.length < 40)) {
                inReqSection = false;
                continue;
            }
            if (inReqSection) {
                const bulletMatch = line.match(/^[•\-\*\d\.]\s*(.*)$/);
                if (bulletMatch) {
                    const content = bulletMatch[1].trim();
                    // Extract specific capitalized tools or 2-3 word skills
                    const phraseRegex = /\b(?:experience with|proficiency in|knowledge of|skilled in)\s+([A-Za-z0-9+#.\s]{3,35})(?:,|\.|\sand\s|$)/gi;
                    let match;
                    while ((match = phraseRegex.exec(content)) !== null) {
                        const extracted = match[1].trim();
                        if (extracted.length > 2 && extracted.length < 30 && !matchedSkills.some((s) => s.toLowerCase() === extracted.toLowerCase())) {
                            matchedSkills.push(extracted);
                        }
                    }
                }
            }
        }
        // Check for sections "Preferred" or "Nice to have"
        const preferredSectionMatch = rawText.match(/(?:preferred|nice\s+to\s+have|bonus|plus|desired)[\s\S]*?(?=\n\n[A-Z]|$)/i);
        const preferredText = preferredSectionMatch ? preferredSectionMatch[0].toLowerCase() : "";
        const requiredSkills = [];
        const preferredSkills = [];
        for (const skill of matchedSkills) {
            if (preferredText && preferredText.includes(skill.toLowerCase())) {
                preferredSkills.push(skill);
            }
            else {
                requiredSkills.push(skill);
            }
        }
        return {
            requiredSkills: requiredSkills.length > 0 ? requiredSkills : matchedSkills.slice(0, 8),
            preferredSkills: preferredSkills.length > 0 ? preferredSkills : matchedSkills.slice(8)
        };
    }
    static extractResponsibilities(rawText, detectedRole) {
        const lines = rawText.split(/\r?\n/).map((l) => l.trim());
        const bullets = [];
        let capture = false;
        for (const line of lines) {
            if (/responsibilities|what\s+you('ll|\s+will)\s+do|key\s+duties|core\s+functions|role\s+overview/i.test(line)) {
                capture = true;
                continue;
            }
            if (capture) {
                if (/requirements|qualifications|about\s+you|benefits|what\s+we\s+offer/i.test(line) && line.length < 40) {
                    capture = false;
                    break;
                }
                const clean = line.replace(/^[•\-\*\d\.]\s*/, "").trim();
                if (clean.length > 15)
                    bullets.push(clean);
            }
        }
        if (bullets.length === 0) {
            return [
                `Deliver high-impact results and execute core duties aligned with ${detectedRole || "the target role"}.`,
                "Collaborate cross-functionally with team members, leadership, and external stakeholders.",
                "Ensure compliance with organizational standards, industry best practices, and operational excellence.",
                "Continuously evaluate workflows and implement improvements to maximize efficiency and outcomes."
            ];
        }
        return bullets.slice(0, 8);
    }
    static extractQualifications(rawText, detectedRole) {
        const lines = rawText.split(/\r?\n/).map((l) => l.trim());
        const bullets = [];
        let capture = false;
        for (const line of lines) {
            if (/qualifications|requirements|what\s+we('re|\s+are)\s+looking\s+for|must\s+haves|education\s+&\s+experience/i.test(line)) {
                capture = true;
                continue;
            }
            if (capture) {
                if (/benefits|what\s+we\s+offer|compensation|about\s+the\s+company/i.test(line) && line.length < 40) {
                    capture = false;
                    break;
                }
                const clean = line.replace(/^[•\-\*\d\.]\s*/, "").trim();
                if (clean.length > 10)
                    bullets.push(clean);
            }
        }
        if (bullets.length === 0) {
            return [
                `Relevant degree, professional license, or equivalent hands-on experience in ${detectedRole || "the field"}.`,
                "Demonstrated track record of performance and reliability in a professional environment."
            ];
        }
        return bullets.slice(0, 6);
    }
}
exports.JobParser = JobParser;
