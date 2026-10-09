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

  const handleSampleResume = async () => {
    const sampleText = `
Riswana Shaik
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

    const blob = new Blob([sampleText], { type: "text/plain" });
    const file = new File([blob], "Riswana_Shaik_Resume.txt", { type: "text/plain" });
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
            <span>Max 10MB</span>
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

      {/* Quick Demo Option */}
      <div className="mt-6 text-center">
        <span className="text-xs text-slate-500">Don't have a resume handy? </span>
        <button
          type="button"
          onClick={handleSampleResume}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center space-x-1"
        >
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Load Pre-Filled Sample Software Developer Resume
        </button>
      </div>
    </div>
  );
};
