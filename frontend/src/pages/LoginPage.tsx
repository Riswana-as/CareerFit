import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.login({ email, password });
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("riswana@example.com");
    setPassword("password123");
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to CareerFit AI</h2>
          <p className="text-xs text-slate-500">Access your truthful, job-tailored ATS resumes</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-700">Password</label>
              <span className="text-[11px] text-brand-600 hover:underline cursor-pointer">Forgot password?</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex flex-col space-y-3 text-center text-xs">
          <button
            type="button"
            onClick={handleDemoFill}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition-colors"
          >
            ⚡ Auto-fill Demo Account (Riswana)
          </button>

          <p className="text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

