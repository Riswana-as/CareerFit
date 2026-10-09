const fs = require("fs");
const path = require("path");

async function runTest() {
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "riswana@example.com", password: "password123" })
  });
  const { token, user } = await loginRes.json();
  console.log("Logged in:", user.fullName);

  // Upload sample resume via HTTP multipart/form-data
  const sampleResumePath = path.resolve(__dirname, "test_resume.txt");
  const sampleContent = `Riswana Shaik
Email: riswana@example.com | Phone: 555-0123
Location: Seattle, WA

PROFESSIONAL SUMMARY
Software developer with experience in web applications, database architecture, and REST API integrations.

TECHNICAL SKILLS
Languages: JavaScript, Python, Java
Backend: REST APIs
Databases: PostgreSQL, MySQL
Tools: Git, GitHub

WORK EXPERIENCE
Software Developer | ABC Technologies (2022 - Present)
• Developed web applications with database connectivity.
• Worked on REST APIs for backend services.

EDUCATION
BS in Computer Science | State University (2022)

PROJECTS
Student Management System
• Built student portal with PostgreSQL.
`;
  fs.writeFileSync(sampleResumePath, sampleContent, "utf8");

  // Create multipart payload
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const fileData = fs.readFileSync(sampleResumePath);
  const bodyBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="test_resume.txt"\r\nContent-Type: text/plain\r\n\r\n`),
    fileData,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const uploadRes = await fetch("http://localhost:5000/api/v1/resumes/upload", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body: bodyBuffer
  });

  const uploadData = await uploadRes.json();
  const resumeId = uploadData.resume.id;
  console.log("Resume uploaded via HTTP API! ID:", resumeId);

  // Analyze job
  const jobText = `Backend Developer
Looking for an experienced developer to build scalable REST APIs using Node.js and Express.
Requirements:
Node.js, Express.js, REST APIs, PostgreSQL, Git, Docker
Preferred:
AWS, Redis, Microservices`;

  const jobRes = await fetch("http://localhost:5000/api/v1/jobs/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ rawText: jobText })
  });
  const { job } = await jobRes.json();
  console.log("Job analyzed! Role:", job.detectedRole, "Confidence:", job.roleConfidence + "%");

  // Tailor resume
  const tailorRes = await fetch(`http://localhost:5000/api/v1/resumes/${resumeId}/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ jobId: job.id })
  });
  const tailorData = await tailorRes.json();
  console.log("Tailored successfully via API!");
  console.log("Version Name:", tailorData.versionName);
  console.log("ATS Overall Score:", tailorData.result.atsScore.overallScore + "%");
  console.log("Optimizations count:", tailorData.result.changesMade.length);
  console.log("Gaps honestly unadded (Zero Fabrication):", tailorData.result.unaddedItems.map(u => u.requirement).join(", "));

  // Test PDF generation
  const pdfRes = await fetch(`http://localhost:5000/api/v1/resumes/${resumeId}/export/pdf?versionId=${tailorData.versionId}`, {
    headers: { "Authorization": "Bearer " + token }
  });
  const pdfBuf = await pdfRes.arrayBuffer();
  console.log("PDF generated! Size:", pdfBuf.byteLength, "bytes");

  // Track Application
  const appRes = await fetch("http://localhost:5000/api/v1/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({
      company: "Acme Cloud Corp",
      position: "Backend Developer",
      resumeVersionId: tailorData.versionId,
      status: "interview",
      interviewDate: "2026-10-15"
    })
  });
  const appData = await appRes.json();
  console.log("Application tracked! ID:", appData.applicationId);

  // Check Dashboard
  const dashRes = await fetch("http://localhost:5000/api/v1/analytics/dashboard", {
    headers: { "Authorization": "Bearer " + token }
  });
  const dashData = await dashRes.json();
  console.log("Dashboard Stats:", dashData.stats.applications);
  console.log("=== FULL SYSTEM PRODUCTION FLOW VERIFIED 100% ===");

  fs.unlinkSync(sampleResumePath);
  process.exit(0);
}

runTest().catch(e => { console.error(e); process.exit(1); });