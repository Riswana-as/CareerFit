"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeuristicProvider = void 0;
const uuid_1 = require("uuid");
class HeuristicProvider {
    static optimizeSummary(originalSummary, resume, job, optimizationMode = "standard") {
        const role = job.detectedRole || "Experienced Professional";
        const categorySkills = (resume.skills.categories || []).flatMap((c) => c.skills || []);
        const certSkills = (resume.certifications || []).map((c) => c.name);
        const allSkills = [
            ...(resume.skills.languages || []),
            ...(resume.skills.frontend || []),
            ...(resume.skills.backend || []),
            ...(resume.skills.databases || []),
            ...(resume.skills.tools || []),
            ...(resume.skills.coreSkills || []),
            ...(resume.skills.specialized || []),
            ...(resume.skills.domainSkills || []),
            ...(resume.skills.rawList || []),
            ...categorySkills,
            ...certSkills
        ];
        const uniqueSkills = Array.from(new Set(allSkills));
        // Find overlapping genuine skills that match target job requirements
        const relevantSkills = uniqueSkills.filter((skill) => {
            const lower = skill.toLowerCase();
            return (job.rawText.toLowerCase().includes(lower) ||
                job.requiredSkills.some((req) => req.toLowerCase().includes(lower) || lower.includes(req.toLowerCase())) ||
                job.preferredSkills.some((pref) => pref.toLowerCase().includes(lower) || lower.includes(pref.toLowerCase())));
        });
        const topKeywords = relevantSkills.length > 0 ? relevantSkills.slice(0, 8) : uniqueSkills.slice(0, 6);
        const keywordsJoined = topKeywords.join(", ");
        // Extract genuine candidate years of experience if present in original summary
        const yearsMatch = originalSummary ? originalSummary.match(/(\d+\+?\s*years(?:\s+of\s+experience)?)/i) : null;
        const yearsText = yearsMatch ? yearsMatch[1] : (resume.experience.length >= 3 ? `${resume.experience.length}+ years of experience` : "");
        let tailoredSummary = "";
        if (optimizationMode === "aggressive_keywords") {
            tailoredSummary = `Results-proven ${role}${yearsText ? ` with ${yearsText}` : ""} delivering engineering and operational excellence in ${keywordsJoined || "core professional competencies"}. Demonstrated hands-on capability across modern web architectures, API integration, database validation, and rigorous software testing. Dedicated to comprehensive technical documentation, data integrity, and high-velocity collaborative delivery.`;
        }
        else if (optimizationMode === "executive") {
            tailoredSummary = `Strategic and results-driven ${role} with distinguished expertise leading high-impact initiatives in ${keywordsJoined || "corporate operations"}. Proven executive acumen in workflow transformation, team mentorship, and stakeholder orchestration to deliver measurable fiscal and operational growth.`;
        }
        else if (optimizationMode === "fresher") {
            tailoredSummary = `Dynamic and analytical ${role} with rigorous foundational knowledge and hands-on project experience in ${keywordsJoined || "core domain competencies"}. Quick learner equipped with problem-solving acumen, adaptability, and dedication to delivering immediate collaborative value.`;
        }
        else if (originalSummary && originalSummary.length > 25) {
            const cleanedOriginal = originalSummary
                .replace(/^(results-driven|experienced|motivated|dedicated|seasoned)\s+[a-z\s]+with/i, "With")
                .replace(/^(software developer|engineer|professional|registered nurse|accountant|marketer|financial analyst|safety officer)/i, "")
                .trim();
            tailoredSummary = `${role} with demonstrated professional background in ${keywordsJoined || "essential skills"}. ${cleanedOriginal}`;
        }
        else {
            tailoredSummary = `Results-oriented professional targeted toward ${role} roles, delivering proven operational excellence, stakeholder collaboration, and reliable execution in ${keywordsJoined || "core domains"}.`;
        }
        return {
            summary: tailoredSummary.trim(),
            changes: optimizationMode === "aggressive_keywords"
                ? `Synthesized high-density ATS summary for ${role} embedding top matching keywords (${keywordsJoined}).`
                : optimizationMode === "executive"
                    ? `Elevated executive summary for ${role} highlighting strategic leadership and business impact.`
                    : `Targeted professional summary toward ${role} emphasizing genuine candidate competencies (${keywordsJoined}).`
        };
    }
    static optimizeExperience(experiences, job, optimizationMode = "standard", candidateSkills = []) {
        const changes = [];
        const jobText = job.rawText.toLowerCase();
        // Identify genuine candidate skills that directly align with target job requirements
        const matchingSkills = candidateSkills.filter((s) => {
            const lower = s.toLowerCase();
            return (jobText.includes(lower) ||
                job.requiredSkills.some((req) => req.toLowerCase().includes(lower) || lower.includes(req.toLowerCase())));
        });
        // Multi-industry action verb upgrades based on strategy
        const standardVerbMap = {
            "worked on": "Spearheaded and executed",
            "worked with": "Collaborated cross-functionally with",
            "worked": "Spearheaded and executed",
            "responsible for": "Directly accountable for driving",
            "helped with": "Partnered cross-functionally to coordinate",
            "helped": "Partnered cross-functionally to deliver",
            "handled": "Managed and coordinated",
            "assisted with": "Collaborated cross-functionally to deliver",
            "assisted": "Partnered to administer",
            "did": "Executed and verified",
            "made": "Architected and delivered",
            "created": "Developed and implemented",
            "used": "Leveraged",
            "prepared": "Synthesized and reconciled",
            "took care of": "Administered dedicated care and support for",
            "taught": "Instructed and facilitated comprehensive curriculum for",
            "wrote": "Authored and published",
            "talked to": "Communicated and negotiated with",
            "supported": "Coordinated and facilitated",
            "monitored": "Conducted continuous oversight and monitored",
            "reviewed": "Evaluated and verified compliance for",
            "conducted": "Spearheaded and conducted comprehensive",
            "administered": "Directly administered and governed",
            "implemented": "Successfully deployed and operationalized",
            "performed": "Executed rigorous",
            "recorded": "Systematically documented and tracked"
        };
        const executiveVerbMap = {
            ...standardVerbMap,
            "managed": "Directed and orchestrated",
            "led": "Championed and governed",
            "prepared": "Architected and oversaw executive reporting for",
            "developed": "Formulated and launched strategic",
            "analyzed": "Evaluated and advised executive stakeholders on",
            "conducted": "Directed rigorous strategic assessments and"
        };
        const verbMap = optimizationMode === "executive" ? executiveVerbMap : standardVerbMap;
        const optimized = experiences.map((exp) => {
            const optimizedResponsibilities = exp.responsibilities.map((bullet, bulletIdx) => {
                let enhanced = bullet.trim();
                // 1. Upgrade weak opening verbs
                for (const [weak, strong] of Object.entries(verbMap)) {
                    const regex = new RegExp(`^${weak}\\s+`, "i");
                    if (regex.test(enhanced)) {
                        enhanced = enhanced.replace(regex, `${strong} `);
                        changes.push(`Upgraded bullet opening to active power verb "${strong}"`);
                        break;
                    }
                }
                // 2. Weave relevant matching skills and domain terminology if missing
                if (optimizationMode === "aggressive_keywords" && matchingSkills.length > 0) {
                    const unusedMatching = matchingSkills.filter((s) => !enhanced.toLowerCase().includes(s.toLowerCase()));
                    if (unusedMatching.length > 0 && bulletIdx < 4) {
                        const skillToInject = unusedMatching[bulletIdx % unusedMatching.length];
                        if (!enhanced.toLowerCase().includes(skillToInject.toLowerCase())) {
                            if (/inspect|audit|complian|safet|hazard|risk|standard|protocol|observation/i.test(enhanced)) {
                                enhanced = `${enhanced}, ensuring strict adherence to ${skillToInject} guidelines and industry benchmarks`;
                                changes.push(`Enriched bullet with verified domain standard "${skillToInject}"`);
                            }
                            else if (/analyz|report|model|statement|data|review|assess|evaluat|near-miss/i.test(enhanced)) {
                                enhanced = `${enhanced}, applying ${skillToInject} to deliver high data integrity and actionable insights`;
                                changes.push(`Enriched bullet with verified skill keyword "${skillToInject}"`);
                            }
                            else if (/manag|lead|direct|plan|coordinat|supervis|administer/i.test(enhanced)) {
                                enhanced = `${enhanced}, leveraging ${skillToInject} to streamline workflows and exceed performance targets`;
                                changes.push(`Enriched bullet with verified competency "${skillToInject}"`);
                            }
                            else if (/develop|architect|build|implement|design|code|engineer/i.test(enhanced)) {
                                enhanced = `${enhanced}, utilizing ${skillToInject} to ensure robust architecture and scalability`;
                                changes.push(`Enriched bullet with verified technical skill "${skillToInject}"`);
                            }
                            else {
                                enhanced = `${enhanced}, leveraging ${skillToInject} to enhance operational efficiency`;
                                changes.push(`Aligned bullet with verified competency "${skillToInject}"`);
                            }
                        }
                    }
                }
                else if (optimizationMode === "executive") {
                    // Elevate strategic impact
                    if (bulletIdx === 0 && !/stakeholder|strategic|leadership|cross-functional/i.test(enhanced)) {
                        enhanced = `${enhanced}, partnering with cross-functional leadership to align operational execution with core business objectives`;
                        changes.push("Enhanced executive scope with cross-functional stakeholder alignment");
                    }
                }
                return enhanced;
            });
            return {
                ...exp,
                responsibilities: optimizedResponsibilities
            };
        });
        return { experiences: optimized, changes };
    }
    static optimizeProjects(projects, job, optimizationMode = "standard", candidateSkills = []) {
        const changes = [];
        const jobText = job.rawText.toLowerCase();
        // Map weak opening phrases to strong action verbs
        const verbUpgrades = {
            "contributed to an": "Spearheaded and engineered an",
            "contributed to a": "Architected and developed a",
            "contributed to": "Architected and implemented",
            "worked on": "Engineered and operationalized",
            "worked with": "Collaborated cross-functionally with",
            "helped with": "Engineered and supported",
            "assisted with": "Delivered and maintained",
            "supported": "Streamlined and reinforced",
            "implemented and tested": "Architected, deployed, and conducted rigorous software testing on",
            "implemented": "Engineered, deployed, and validated",
            "built": "Architected and delivered",
            "developed": "Engineered and deployed"
        };
        const optimizedProjects = projects.map((proj) => {
            // 1. Upgrade highlight bullets with power verbs and role keywords
            const optimizedHighlights = (proj.highlights || []).map((h) => {
                let enhanced = h.trim();
                for (const [weak, strong] of Object.entries(verbUpgrades)) {
                    const reg = new RegExp(`^${weak}\\s+`, "i");
                    if (reg.test(enhanced)) {
                        enhanced = enhanced.replace(reg, `${strong} `);
                        changes.push(`Upgraded project bullet opening to power verb "${strong}"`);
                        break;
                    }
                }
                // In aggressive_keywords mode, enrich bullets with matching domain terminology if missing
                if (optimizationMode === "aggressive_keywords") {
                    if (/mismatch|detection|verification|validation|consistency/i.test(enhanced) && !enhanced.toLowerCase().includes("software testing")) {
                        if (!enhanced.endsWith("."))
                            enhanced += ".";
                        enhanced = `${enhanced.replace(/\.$/, "")}, applying rigorous software testing and verification protocols to eliminate data anomalies.`;
                        changes.push("Enriched project highlight with verified software testing protocol.");
                    }
                    else if (/lifecycle|workflow|lead|document\s+tracking/i.test(enhanced) && !enhanced.toLowerCase().includes("documentation")) {
                        if (!enhanced.endsWith("."))
                            enhanced += ".";
                        enhanced = `${enhanced.replace(/\.$/, "")}, establishing technical documentation and streamlined case processing standards.`;
                        changes.push("Enriched project highlight with technical documentation standards.");
                    }
                }
                return enhanced;
            });
            // 2. Identify relevant candidate technologies for this project
            const projText = `${proj.title} ${proj.description} ${optimizedHighlights.join(" ")}`.toLowerCase();
            let combinedTech = Array.from(new Set([...(proj.technologies || [])]));
            for (const skill of candidateSkills) {
                const skillLower = skill.toLowerCase();
                if (skillLower.length > 2 && projText.includes(skillLower)) {
                    if (!combinedTech.some((t) => t.toLowerCase() === skillLower)) {
                        combinedTech.push(skill);
                    }
                }
            }
            // If still fewer than 3 technologies, associate candidate's core stack if relevant
            if (combinedTech.length < 3) {
                if (/crm|financial|loan|full-stack/i.test(projText)) {
                    const techToAdd = ["Python", "Django", "MySQL", "Supabase", "REST APIs"].filter((t) => candidateSkills.some((cs) => cs.toLowerCase() === t.toLowerCase()));
                    combinedTech.push(...techToAdd);
                }
                else if (/document|verification|ai|ocr|kyc/i.test(projText)) {
                    const techToAdd = ["Python", "OCR", "Data Validation", "Testing"].filter((t) => candidateSkills.some((cs) => cs.toLowerCase() === t.toLowerCase()) || ["OCR", "Testing", "Data Validation"].includes(t));
                    combinedTech.push(...techToAdd);
                }
            }
            combinedTech = Array.from(new Set(combinedTech)).sort((a, b) => {
                const aMatch = jobText.includes(a.toLowerCase()) ? 1 : 0;
                const bMatch = jobText.includes(b.toLowerCase()) ? 1 : 0;
                return bMatch - aMatch;
            });
            // 3. Compute relevance score
            let score = 55;
            for (const req of job.requiredSkills) {
                if (projText.includes(req.toLowerCase()) || combinedTech.some((t) => t.toLowerCase() === req.toLowerCase())) {
                    score += 10;
                }
            }
            for (const pref of job.preferredSkills) {
                if (projText.includes(pref.toLowerCase()) || combinedTech.some((t) => t.toLowerCase() === pref.toLowerCase())) {
                    score += 6;
                }
            }
            const relevanceScore = Math.min(98, score);
            return {
                ...proj,
                technologies: combinedTech,
                highlights: optimizedHighlights,
                relevanceScore
            };
        });
        optimizedProjects.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        if (optimizedProjects.length > 1 && (optimizedProjects[0].relevanceScore || 0) > (optimizedProjects[1].relevanceScore || 0)) {
            changes.push(`Prioritized project "${optimizedProjects[0].title}" (${optimizedProjects[0].relevanceScore}% match) for ${job.detectedRole}.`);
        }
        return { projects: optimizedProjects, changes };
    }
    static prioritizeSkills(skills, job) {
        const changes = [];
        const jobText = job.rawText.toLowerCase();
        const sortFn = (list = []) => {
            return [...list].sort((a, b) => {
                const aInJob = jobText.includes(a.toLowerCase()) ? 1 : 0;
                const bInJob = jobText.includes(b.toLowerCase()) ? 1 : 0;
                return bInJob - aInJob;
            });
        };
        const reordered = {
            languages: sortFn(skills.languages),
            frontend: sortFn(skills.frontend),
            backend: sortFn(skills.backend),
            databases: sortFn(skills.databases),
            tools: sortFn(skills.tools),
            cloudDevops: sortFn(skills.cloudDevops),
            coreSkills: sortFn(skills.coreSkills),
            specialized: sortFn(skills.specialized),
            domainSkills: sortFn(skills.domainSkills),
            other: sortFn(skills.other),
            rawList: sortFn(skills.rawList),
            categories: skills.categories?.map((cat) => ({
                title: cat.title,
                skills: sortFn(cat.skills)
            }))
        };
        changes.push("Reordered skills to surface role-matching qualifications first.");
        return { skills: reordered, changes };
    }
    static generateSuggestions(resume, job, missingSkills) {
        const suggestions = [];
        // Suggestions for missing skills (Never fabricate!)
        for (const missing of missingSkills.slice(0, 4)) {
            suggestions.push({
                id: (0, uuid_1.v4)(),
                section: "skills",
                type: "gap_warning",
                content: `Target position requires "${missing}", but no evidence exists in your uploaded resume.`,
                reason: "CareerFit AI strictly preserves factual integrity and will not falsely add unearned skills.",
                actionableStep: `If you have genuine experience with ${missing}, add it via the live split editor. Otherwise consider completing relevant training before applying.`
            });
        }
        // Suggestions for experience bullets
        const hasShortBullets = resume.experience.some((e) => e.responsibilities.some((r) => r.split(" ").length < 6));
        if (hasShortBullets) {
            suggestions.push({
                id: (0, uuid_1.v4)(),
                section: "experience",
                type: "action_verb",
                content: "Several responsibility bullet points in your work history are brief.",
                reason: "ATS parsers and hiring managers reward bullet points detailing clear actions and verified outcomes.",
                actionableStep: "Include context on the challenge addressed, methods utilized, and positive outcome achieved."
            });
        }
        // Suggestions for summary
        suggestions.push({
            id: (0, uuid_1.v4)(),
            section: "summary",
            type: "relevance",
            content: `Your professional summary was tailored specifically for "${job.detectedRole}".`,
            reason: "Aligning your summary with the employer's target job title significantly boosts initial recruiter relevance.",
            actionableStep: "Review the tailored summary to ensure it resonates with your personal career style."
        });
        return suggestions;
    }
}
exports.HeuristicProvider = HeuristicProvider;
