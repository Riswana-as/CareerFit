import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";

interface FileUploaderProps {
  onUploadSuccess: (resumeData: { id: string; title: string; parsedData: any }) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    const validExtensions = [".pdf", ".docx", ".txt"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setError("Please upload a supported document (.pdf, .docx, or .txt)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 10MB.");
      return;
    }

    setUploadedFileName(file.name);
    setIsLoading(true);

    try {
      const res = await apiClient.uploadResume(file);
      onUploadSuccess(res.data.resume);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload and parse resume.");
      setUploadedFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSampleResume = (type: "software" | "healthcare" | "marketing" | "finance") => {
    let sampleText = "";
    let fileName = "";

    if (type === "healthcare") {
      fileName = "Elena_Rostova_RN_Resume.txt";
      sampleText = `Elena Rostova, BSN, RN
Email: elena.rostova.rn@example.com
Phone: (555) 432-8765
Location: Chicago, IL
LinkedIn: linkedin.com/in/elena-rostova-rn

PROFESSIONAL SUMMARY
Compassionate and detail-oriented Registered Nurse with 4+ years of clinical acute care experience. Expert in patient triage, vital signs monitoring, medication administration, and electronic health record documentation. Dedicated to patient safety, HIPAA compliance, and interdisciplinary clinical collaboration.

CORE COMPETENCIES & CLINICAL SKILLS
Clinical Skills: Patient Care, Triage, Vital Signs, Patient Assessment, Medication Administration, IV Therapy, Wound Care, BLS, CPR, Infection Control
Systems & Tools: Epic EHR, Cerner EMR, Clinical Documentation, Pyxis Medication Dispensing
Compliance: HIPAA, Patient Education, Quality Improvement, Care Planning

WORK EXPERIENCE
Staff Registered Nurse | MetroHealth Medical Center (2022 - Present)
• Administered comprehensive bedside care and acute triage for up to 6 adult medical-surgical patients per shift.
• Conducted meticulous patient assessments, monitored vital signs, and recognized clinical deterioration early.
• Managed IV therapy, medication administration, and sterile wound dressings in full compliance with hospital protocols.
• Documented clinical progress and care plans in Epic EHR, maintaining 100% HIPAA regulatory compliance.
• Collaborated daily with attending physicians, pharmacists, and physical therapists on multidisciplinary rounds.

Clinical Nurse Assistant / LPN | Lakeview Community Hospital (2020 - 2022)
• Assisted registered nurses with vital signs recording, patient mobilization, and hygiene care.
• Monitored intake/output metrics and reported changes in patient status promptly to charge nurse.
• Educated patients and families on post-procedure discharge instructions and medication schedules.

EDUCATION
Bachelor of Science in Nursing (BSN)
Illinois University of Health Sciences (Graduated 2020)
Honors: Magna Cum Laude • Dean's List

LICENSES & CERTIFICATIONS
• Registered Nurse (RN) - State of Illinois License #RN-892415
• Basic Life Support (BLS) for Healthcare Providers - American Heart Association
• Advanced Cardiovascular Life Support (ACLS) Certified
`;
    } else if (type === "marketing") {
      fileName = "Marcus_Vance_Marketing_Resume.txt";
      sampleText = `Marcus Vance
Email: marcus.vance@example.com
Phone: (555) 987-6543
Location: Austin, TX
LinkedIn: linkedin.com/in/marcus-vance

PROFESSIONAL SUMMARY
Data-driven Digital Marketing Specialist with 3+ years of experience accelerating organic brand visibility, content performance, and lead acquisition. Proven expertise in SEO, Google Analytics, content strategy, email marketing, and CRM automation.

CORE COMPETENCIES
Digital Marketing: SEO, SEM, Google Analytics, Content Marketing, Social Media Marketing, Copywriting
Platforms & CRM: HubSpot, WordPress, Mailchimp, Salesforce, Google Ads, A/B Testing
Strategy: Conversion Rate Optimization (CRO), Brand Strategy, Market Research, Campaign Management

WORK EXPERIENCE
Digital Marketing Specialist | GrowthPulse Media (2022 - Present)
• Orchestrated multi-channel marketing campaigns that increased organic website traffic and qualified leads.
• Managed comprehensive SEO keyword research, on-page optimization, and editorial blog calendar.
• Tracked campaign conversion funnels and user engagement metrics using Google Analytics and HubSpot.
• Designed automated email marketing workflows, boosting email click-through rates.

Marketing Coordinator | BrightWave Digital (2021 - 2022)
• Authored engaging copy for social media platforms, email newsletters, and landing pages.
• Monitored brand mentions and managed customer communication across digital channels.
• Collaborated with graphic design team to produce branded visual marketing assets.

EDUCATION
Bachelor of Arts in Marketing & Communications
University of Texas at Austin (Graduated 2021)

KEY INITIATIVES & PROJECTS
Organic Search Growth Campaign
• Revamped technical on-page SEO across 50 core product pages, driving organic search ranking improvements.
• Conducted comprehensive competitor gap analysis and keyword intent mapping.
`;
    } else if (type === "finance") {
      fileName = "David_Chen_Finance_Resume.txt";
      sampleText = `David Chen
Email: david.chen.cpa@example.com
Phone: (555) 234-5678
Location: New York, NY
LinkedIn: linkedin.com/in/david-chen-finance

PROFESSIONAL SUMMARY
Analytical Financial Analyst and Accountant with 3+ years of experience in financial modeling, variance analysis, GAAP compliance, and general ledger reconciliation. Skilled in corporate budgeting, financial forecasting, Microsoft Excel, and QuickBooks.

CORE COMPETENCIES
Financial Analysis: Financial Modeling, Variance Analysis, Budgeting, Financial Forecasting, Cash Flow Analysis
Accounting: GAAP, General Ledger, Accounts Payable, Accounts Receivable, Account Reconciliation, Auditing
Systems: Microsoft Excel, QuickBooks, SAP ERP, Financial Reporting

WORK EXPERIENCE
Financial Analyst | Summit Capital Partners (2022 - Present)
• Built monthly financial variance models comparing actual revenues and operational expenditures against budgets.
• Prepared detailed quarterly financial reports and presentation decks for executive leadership.
• Analyzed cash flow patterns and identified cost optimization opportunities across operational departments.
• Reconciled general ledger balance sheets and assisted with annual external audit preparations under GAAP.

Junior Staff Accountant | Apex Financial Services (2021 - 2022)
• Handled accounts payable and accounts receivable processing, verifying vendor invoices and payment schedules.
• Performed monthly bank reconciliations and journal entries within QuickBooks.
• Maintained internal financial documentation to ensure audit readiness and compliance.

EDUCATION
Bachelor of Business Administration (BBA) in Finance & Accounting
Baruch College, City University of New York (Graduated 2021)
GPA: 3.85 / 4.0
`;
    } else {
      fileName = "Riswana_Shaik_Resume.txt";
      sampleText = `Riswana Shaik
Email: riswana.shaik@example.com
Phone: (555) 789-0123
Location: Seattle, WA
LinkedIn: linkedin.com/in/riswana-shaik
GitHub: github.com/riswana

PROFESSIONAL SUMMARY
Software developer with 3+ years of experience in web application development, database architecture, and REST API integrations. Passionate about clean code, performance optimization, and scalable backend services.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, HTML, CSS
Backend: REST APIs, Express.js basics, Node.js fundamentals
Databases: PostgreSQL, MySQL, Redis
Tools: Git, GitHub, Linux, Postman

WORK EXPERIENCE
Software Developer | Alpha Tech Solutions (2022 - Present)
• Engineered and maintained high-traffic web applications with database-driven backend connectivity.
• Built RESTful API endpoints for user authentication, payment status processing, and catalog search.
• Optimized PostgreSQL relational database queries, improving endpoint response time significantly.
• Collaborated in an agile scrum team to deliver bi-weekly production features.

Junior Web Developer | CloudPeak Studios (2021 - 2022)
• Developed responsive frontend user interfaces using JavaScript, HTML5, and CSS3.
• Integrated third-party web services and handled client-side state management.
• Wrote unit tests and resolved cross-browser compatibility issues.

EDUCATION
Bachelor of Science in Computer Science
State University of Washington (Graduated 2021)
GPA: 3.8 / 4.0

KEY PROJECTS
Student Management Portal
• Built full-stack portal allowing course enrollment and grade management with PostgreSQL.
• Implemented role-based access control and secure password hashing.

E-Commerce Storefront
• Developed complete online shopping interface with cart management and order tracking.
• Connected backend API services for real-time inventory verification.
`;
    }

    const blob = new Blob([sampleText], { type: "text/plain" });
    const file = new File([blob], fileName, { type: "text/plain" });
    handleFileSelect(file);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-brand-500 bg-brand-50/50 scale-[1.01]"
            : "border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept=".pdf,.docx,.txt"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : uploadedFileName ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isLoading
                ? "Extracting & parsing resume sections..."
                : uploadedFileName
                ? `Uploaded: ${uploadedFileName}`
                : "Drag and drop your current resume here"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Supports ATS-standard PDF, Microsoft Word (.docx), or plain text (.txt)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <span>Universal Career Support</span>
            <span>•</span>
            <span>Zero Data Fabrication</span>
            <span>•</span>
            <span>Original File Always Preserved</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Multi-Industry Demo Options */}
      <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2.5">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Or load a pre-filled sample resume from any career field:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleSampleResume("software")}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-600 rounded-xl transition-all shadow-2xs"
          >
            💻 Software Developer
          </button>
          <button
            type="button"
            onClick={() => handleSampleResume("healthcare")}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-600 rounded-xl transition-all shadow-2xs"
          >
            🏥 Registered Nurse (RN)
          </button>
          <button
            type="button"
            onClick={() => handleSampleResume("marketing")}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-600 rounded-xl transition-all shadow-2xs"
          >
            📈 Marketing Specialist
          </button>
          <button
            type="button"
            onClick={() => handleSampleResume("finance")}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-600 rounded-xl transition-all shadow-2xs"
          >
            💰 Financial Analyst
          </button>
        </div>
      </div>
    </div>
  );
};
