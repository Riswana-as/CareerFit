import React from "react";

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
  const getColor = (val: number) => {
    if (val >= 80) return "text-emerald-600 bg-emerald-500 border-emerald-500 text-emerald-700";
    if (val >= 65) return "text-amber-600 bg-amber-500 border-amber-500 text-amber-700";
    return "text-rose-600 bg-rose-500 border-rose-500 text-rose-700";
  };

  const getStatusText = (val: number) => {
    if (val >= 80) return "Strong ATS Match";
    if (val >= 65) return "Moderate Match (Action Needed)";
    return "High Risk / Low Match";
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="text-slate-100 stroke-current"
            strokeWidth="9"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className={`${score >= 80 ? "text-emerald-500" : score >= 65 ? "text-amber-500" : "text-rose-500"} stroke-current transition-all duration-1000 ease-out`}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{score}%</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {showStatus && (
        <span
          className={`mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            score >= 80
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : score >= 65
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {getStatusText(score)}
        </span>
      )}
    </div>
  );
};
