import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";
import { config } from "../config/environment";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState(
    config.IS_MOCK ? "j.wilson@hypervisor.edu" : "",
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot-password inline flow: null | 'email' | 'reset'
  const [forgotStep, setForgotStep] = useState<null | "email" | "reset">(null);
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpMsg, setFpMsg] = useState("");
  const [fpError, setFpError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your university email address.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate("/dashboard");
    } else {
      setErrorMsg(
        res.error?.message || "Login failed. Please verify credentials.",
      );
    }
  };

  const quickLoginStudent = async () => {
    setEmail("j.wilson@hypervisor.edu");
    setIsSubmitting(true);
    await login("j.wilson@hypervisor.edu");
    setIsSubmitting(false);
    navigate("/dashboard");
  };

  const quickLoginAdmin = async () => {
    setEmail("a.voss@hypervisor.edu");
    setIsSubmitting(true);
    await login("a.voss@hypervisor.edu");
    setIsSubmitting(false);
    navigate("/dashboard");
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail) {
      setFpError("Please enter your university email.");
      return;
    }
    setFpError("");
    setIsSubmitting(true);
    const res = await authApi.forgotPassword(fpEmail);
    setIsSubmitting(false);
    if (res.success) {
      setFpMsg("A reset code has been sent to your email.");
      setForgotStep("reset");
    } else {
      setFpError(res.error?.message || "Failed to send reset code.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpCode || !fpNewPassword) {
      setFpError("Please fill in all fields.");
      return;
    }
    setFpError("");
    setIsSubmitting(true);
    const res = await authApi.resetPassword(fpEmail, fpCode, fpNewPassword);
    setIsSubmitting(false);
    if (res.success) {
      setForgotStep(null);
      setErrorMsg("");
      setFpMsg("");
      alert("Password reset successful. Please log in with your new password.");
    } else {
      setFpError(
        res.error?.message || "Reset failed. Check your code and try again.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9ff] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-[#c2c7d1] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[640px]">
        {/* Left Side: Visual Hero & Institutional Card */}
        <div className="bg-[#00355f] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-[#0f4c81]/40 blur-2xl pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-full academic-pattern opacity-10 pointer-events-none"></div>

          {/* Top Header */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Hypervisor Logo"
              className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-white/20"
            />
            <div>
              <h1 className="font-headline text-xl font-bold tracking-tight">
                Hypervisor
              </h1>
              <p className="text-[10px] text-[#8ebdf9] uppercase tracking-widest font-semibold">
                Educational Complex
              </p>
            </div>
          </div>

          {/* Middle Callout Card */}
          <div className="relative z-10 my-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-inner space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8ebdf9]/20 text-[#8ebdf9] border border-[#8ebdf9]/30 rounded-full text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  verified
                </span>
                Academic Excellence
              </div>
              <h2 className="font-headline text-2xl font-bold leading-tight">
                AI-Powered Student & Faculty Support Platform
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                Instant access to verified institutional knowledge, automated
                RAG academic advisement, course registration rules, and bursar
                policies.
              </p>
              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
                <span>RAG OpenSearch Index</span>
                <span className="font-mono text-[#8ebdf9] font-semibold">
                  Bedrock / Gemini Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Login Preset Buttons — mock mode only */}
          {config.IS_MOCK && (
            <div className="relative z-10 pt-4 border-t border-white/15">
              <p className="text-xs text-white/70 mb-2 font-medium">
                Quick Demo Preset Sign-In:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={quickLoginStudent}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    person
                  </span>
                  Student (James)
                </button>
                <button
                  type="button"
                  onClick={quickLoginAdmin}
                  className="px-3 py-2 bg-[#8ebdf9]/20 hover:bg-[#8ebdf9]/30 border border-[#8ebdf9]/40 rounded-xl text-xs font-semibold text-[#8ebdf9] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    manage_accounts
                  </span>
                  Dean (Prof. Voss)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Sign In / Forgot Password Form */}
        <div className="p-8 md:p-12 flex flex-col justify-between bg-white">
          <div>
            {forgotStep ? (
              <>
                <div className="mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(null);
                      setFpError("");
                      setFpMsg("");
                    }}
                    className="flex items-center gap-1 text-xs text-[#0f4c81] hover:underline mb-4"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_back
                    </span>{" "}
                    Back to Sign In
                  </button>
                  <h2 className="font-headline text-2xl font-bold text-[#00355f]">
                    {forgotStep === "email"
                      ? "Reset Password"
                      : "Enter Reset Code"}
                  </h2>
                  <p className="text-sm text-[#42474f] mt-1">
                    {forgotStep === "email"
                      ? "Enter your university email to receive a reset code."
                      : `A code was sent to ${fpEmail}. Enter it below with your new password.`}
                  </p>
                </div>

                {fpError && (
                  <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      error
                    </span>
                    {fpError}
                  </div>
                )}
                {fpMsg && (
                  <div className="mb-4 p-3 bg-[#d4f4e8] border border-[#1a7a4a]/30 text-[#1a7a4a] rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                    {fpMsg}
                  </div>
                )}

                {forgotStep === "email" ? (
                  <form
                    onSubmit={handleForgotPasswordRequest}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                        University Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f] text-[20px]">
                          mail
                        </span>
                        <input
                          type="email"
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                          placeholder="student@hypervisor.edu"
                          className="w-full pl-10 pr-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#00355f] hover:bg-[#0f4c81] text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        "Send Reset Code"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                        Reset Code
                      </label>
                      <input
                        type="text"
                        value={fpCode}
                        onChange={(e) => setFpCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={fpNewPassword}
                        onChange={(e) => setFpNewPassword(e.target.value)}
                        placeholder="Min 10 chars, upper, lower, number"
                        className="w-full px-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#00355f] hover:bg-[#0f4c81] text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl font-bold text-[#00355f]">
                    Sign In to Portal
                  </h2>
                  <p className="text-sm text-[#42474f] mt-1">
                    Access your academic account with university credentials.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      error
                    </span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                      University Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f] text-[20px]">
                        mail
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@hypervisor.edu"
                        className="w-full pl-10 pr-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f] text-[20px]">
                        lock
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-[#42474f] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-[#00355f] focus:ring-[#00355f]"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFpEmail(email);
                        setFpError("");
                        setFpMsg("");
                        setForgotStep("email");
                      }}
                      className="text-[#0f4c81] hover:underline font-semibold cursor-pointer bg-transparent border-none p-0 text-xs"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#00355f] hover:bg-[#0f4c81] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-[#42474f]">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#0f4c81] hover:underline font-semibold"
                  >
                    Create Account
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-4 border-t border-[#c2c7d1] flex items-center justify-between text-[11px] text-[#42474f]">
            <Link to="/help" className="hover:underline cursor-pointer">
              Privacy Policy
            </Link>
            <span className="text-[#c2c7d1]">•</span>
            <Link to="/help" className="hover:underline cursor-pointer">
              Terms of Service
            </Link>
            <span className="text-[#c2c7d1]">•</span>
            <Link to="/help" className="hover:underline cursor-pointer">
              Technical Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
