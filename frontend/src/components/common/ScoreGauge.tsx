import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showStatus?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = "md",
  label = "ATS Match Score",
  showStatus = true
}) => {
  const isLg = size === "lg";
  const isSm = size === "sm";

  const radius = isLg ? 48 : isSm ? 28 : 40;
  const strokeWidth = isLg ? 10 : isSm ? 6 : 8;
  const svgSize = isLg ? "w-36 h-36" : isSm ? "w-20 h-20" : "w-28 h-28";
  const viewBoxSize = isLg ? 120 : isSm ? 70 : 100;
  const center = viewBoxSize / 2;

  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const isHigh = score >= 80;
  const isMed = score >= 65 && score < 80;

  const gradientId = `gauge-grad-${score >= 80 ? "emerald" : score >= 65 ? "amber" : "rose"}`;

  const getStatusText = (val: number) => {
    if (val >= 90) return "Optimal Recruiter Match";
    if (val >= 80) return "Strong ATS Alignment";
    if (val >= 65) return "Moderate Match";
    return "Action Needed";
  };

  const getStatusIcon = (val: number) => {
    if (val >= 80) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    if (val >= 65) return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
    return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
  };

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      <div className="relative flex items-center justify-center">
        <svg className={`${svgSize} transform -rotate-90 filter drop-shadow-sm`} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <defs>
            <linearGradient id="gauge-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gauge-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gauge-grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="text-slate-100 stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Value Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <div className="flex items-baseline space-x-0.5">
            <span className={`${isLg ? "text-4xl" : isSm ? "text-xl" : "text-3xl"} font-black tracking-tight text-slate-900`}>
              {score}
            </span>
            <span className={`${isLg ? "text-lg" : "text-xs"} font-bold text-slate-400`}>%</span>
          </div>
          {isLg && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 -mt-0.5">
              ATS Match
            </span>
          )}
        </div>
      </div>

      {!isLg && (
        <p className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      )}

      {showStatus && (
        <div
          className={`mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            isHigh
              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-xs"
              : isMed
              ? "bg-amber-50 text-amber-800 border-amber-200/80 shadow-xs"
              : "bg-rose-50 text-rose-800 border-rose-200/80 shadow-xs"
          }`}
        >
          {getStatusIcon(score)}
          <span>{getStatusText(score)}</span>
        </div>
      )}
    </div>
  );
};
