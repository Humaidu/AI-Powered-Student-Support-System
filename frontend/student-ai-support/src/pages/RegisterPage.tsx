import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authApi } from "../api/authApi";
import { ApplicationFormData } from "../types/website";

type Step = "form" | "confirm";

export const RegisterPage: React.FC = () => {
  const location = useLocation();
  const [step, setStep] = useState<Step>("form");

  // Registration form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fromApplication, setFromApplication] = useState(false);

  // Confirmation step
  const [code, setCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  // Check for pending application data on mount
  useEffect(() => {
    const pendingAppData = localStorage.getItem("pendingApplication");
    if (pendingAppData) {
      try {
        const appData: ApplicationFormData = JSON.parse(pendingAppData);
        setName(appData.fullName);
        setEmail(appData.email);
        setFromApplication(true);
      } catch (err) {
        console.warn("Failed to parse pending application data", err);
      }
    }
    // Also check location state
    if (location.state?.fromApplication && location.state?.applicationData) {
      const appData = location.state.applicationData as ApplicationFormData;
      setName(appData.fullName);
      setEmail(appData.email);
      setFromApplication(true);
    }
  }, [location.state]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 10) {
      setErrorMsg(
        "Password must be at least 10 characters with uppercase, lowercase, and a number.",
      );
      return;
    }

    setIsSubmitting(true);
    const res = await authApi.register(name, email, password);
    setIsSubmitting(false);

    if (res.success && res.data) {
      if (res.data.needsConfirmation) {
        setSuccessMsg(`A verification code has been sent to ${email}.`);
        setStep("confirm");
      } else {
        // Mock mode: auto-confirmed, go straight to login
        // Clear pending application data on successful registration
        localStorage.removeItem("pendingApplication");
        navigate("/login");
      }
    } else {
      setErrorMsg(
        res.error?.message || "Registration failed. Please try again.",
      );
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!code) {
      setErrorMsg("Please enter the verification code.");
      return;
    }

    setIsSubmitting(true);
    const res = await authApi.confirmRegistration(email, code);
    setIsSubmitting(false);

    if (res.success) {
      // Clear pending application data on successful confirmation
      localStorage.removeItem("pendingApplication");
      navigate("/login", { state: { confirmed: true } });
    } else {
      setErrorMsg(
        res.error?.message ||
          "Verification failed. Check your code and try again.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9ff] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-[#c2c7d1] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[640px]">
        {/* Left Side */}
        <div className="bg-[#00355f] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-[#0f4c81]/40 blur-2xl pointer-events-none"></div>

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

          <div className="relative z-10 my-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-inner space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8ebdf9]/20 text-[#8ebdf9] border border-[#8ebdf9]/30 rounded-full text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  person_add
                </span>
                New Student Registration
              </div>
              <h2 className="font-headline text-2xl font-bold leading-tight">
                Create Your Academic Account
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                Register with your university email to access AI-powered
                academic advisement, course information, and institutional
                resources.
              </p>
              <div className="pt-2 border-t border-white/15 space-y-1.5 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[#8ebdf9]">
                    check_circle
                  </span>
                  Instant access to AI Assistant
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[#8ebdf9]">
                    check_circle
                  </span>
                  Verified institutional knowledge base
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[#8ebdf9]">
                    check_circle
                  </span>
                  Secure Cognito-backed authentication
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/15 text-xs text-white/60">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#8ebdf9] hover:underline font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 md:p-12 flex flex-col justify-between bg-white">
          <div>
            {step === "form" ? (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl font-bold text-[#00355f]">
                    Create Account
                  </h2>
                  <p className="text-sm text-[#42474f] mt-1">
                    Register with your university email address.
                  </p>
                </div>

                {fromApplication && (
                  <div className="mb-4 p-3 bg-[#c2e7ff] border border-[#0f4c81]/30 text-[#00355f] rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      info
                    </span>
                    <span>
                      <strong>Application in progress:</strong> Complete your
                      registration to finalize your programme application.
                    </span>
                  </div>
                )}

                {errorMsg && (
                  <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      error
                    </span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f] text-[20px]">
                        person
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. James Wilson"
                        className="w-full pl-10 pr-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                  </div>

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
                        placeholder="Min 10 chars, upper, lower, number"
                        className="w-full pl-10 pr-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f] text-[20px]">
                        lock_reset
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-10 pr-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#00355f] hover:bg-[#0f4c81] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-[#42474f]">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-[#0f4c81] hover:underline font-semibold"
                  >
                    Sign In
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl font-bold text-[#00355f]">
                    Verify Your Email
                  </h2>
                  <p className="text-sm text-[#42474f] mt-1">{successMsg}</p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      error
                    </span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleConfirm} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code from your email"
                      className="w-full px-4 py-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none transition-all tracking-widest"
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
                      <>
                        <span>Verify & Activate Account</span>
                        <span className="material-symbols-outlined text-[18px]">
                          verified
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-4 text-xs text-center text-[#42474f]">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setErrorMsg("");
                    }}
                    className="text-[#0f4c81] hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer"
                  >
                    Go back and try again
                  </button>
                </p>
              </>
            )}
          </div>

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
