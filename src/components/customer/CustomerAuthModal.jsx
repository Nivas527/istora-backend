import React, { useState } from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';

export default function CustomerAuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    loginWithEmail,
    registerWithEmail,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    isLoading
  } = useCustomerAuth();

  const { activeStore } = useStore();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [otpChannel, setOtpChannel] = useState('sms'); // 'sms' | 'whatsapp'
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsOtpSent(false);
    setOtpCode('');
  };

  const handleTabChange = (tab) => {
    resetFormState();
    setAuthModalTab(tab);
  };

  // 1. Email Sign In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await loginWithEmail(email || 'alex.rivera@example.com', password || 'password123', activeStore?.id);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    }
  };

  // 1b. Fast Demo Login
  const handleDemoShopperLogin = async () => {
    setErrorMsg('');
    try {
      await loginWithEmail('alex.rivera@example.com', 'password123', activeStore?.id);
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed');
    }
  };

  // 2. Email Sign Up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    try {
      await registerWithEmail({ name, email, password, phone }, activeStore?.id);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  // 3. Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }
    try {
      const res = await sendOtp(phone, otpChannel, activeStore?.id);
      setIsOtpSent(true);
      setOtpMessage(res.message || 'OTP sent successfully!');
      if (res.demoOtp) {
        setOtpCode(res.demoOtp); // Convenience auto-fill for instant testing
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch OTP.');
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otpCode) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }
    try {
      await verifyOtp(phone, otpCode, name, activeStore?.id);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid verification code.');
    }
  };

  // 5. Google 1-Click
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      await loginWithGoogle(null, activeStore?.id);
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-900 dark:to-zinc-850">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Customer Portal
            </span>
          </div>
          
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {authModalTab === 'signin' && 'Sign in to your account'}
            {authModalTab === 'signup' && 'Create your customer account'}
            {authModalTab === 'otp' && 'Instant Mobile Sign-in'}
            {authModalTab === 'google' && 'Google 1-Click Verification'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Access order history, live tracking, GST tax invoices & saved addresses.
          </p>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mx-6 px-6 mt-4 gap-4 text-xs font-semibold">
            <button
              onClick={() => handleTabChange('signin')}
              className={`pb-2 transition-colors border-b-2 ${
                authModalTab === 'signin'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`pb-2 transition-colors border-b-2 ${
                authModalTab === 'signup'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => handleTabChange('otp')}
              className={`pb-2 transition-colors border-b-2 flex items-center gap-1 ${
                authModalTab === 'otp'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: EMAIL SIGN IN */}
          {authModalTab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <span className="text-[11px] text-zinc-400">Demo: password123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick 1-Click Demo Helper */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoShopperLogin}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Sign In as Demo Shopper (Alex Rivera)</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EMAIL SIGN UP */}
          {authModalTab === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  Phone (Optional for SMS / WhatsApp order updates)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: MOBILE PHONE OTP */}
          {authModalTab === 'otp' && (
            <div className="space-y-4">
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Channel Selection */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">
                      Dispatch Channel
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          otpChannel === 'sms'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SMS Text</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOtpChannel('whatsapp')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          otpChannel === 'whatsapp'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {otpMessage}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Demo OTP Code: <strong className="font-mono tracking-widest text-emerald-800 dark:text-emerald-200">123456</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                      Enter 6-digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full text-center tracking-[0.3em] font-mono text-xl py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? <span>Verifying...</span> : <span>Verify & Log In</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 pt-1 underline"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Social Divider & Google OAuth */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-semibold">
                Or Continue With
              </span>
            </div>
          </div>

          {/* Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer Privacy Note */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
          <span>🔒 256-bit SSL encrypted</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Sub-second checkout enabled</span>
          </span>
        </div>
      </div>
    </div>
  );
}

