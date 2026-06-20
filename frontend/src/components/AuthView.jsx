import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Phone, ArrowRight, AlertCircle, Key, Check, Loader, Info } from 'lucide-react';

const AuthView = ({ onAuthSuccess, onSwitchToDealerRegister, apiBaseUrl }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot_password'
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP Simulation Toast
  const [simulatedOTP, setSimulatedOTP] = useState(null);
  
  // Login Form
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Register Form
  const [registerForm, setRegisterForm] = useState({
    username: '', email: '', password: '', phone: '', address: '', city: '', state: ''
  });

  // Forgot Password Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // OTP Validation State
  const [sessionId, setSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.non_field_errors?.[0] || data.detail || 'Invalid credentials');
      }
      setSessionId(data.session_id);
      setStep('otp');
      if (data.otp_code) {
        setSimulatedOTP({ code: data.otp_code, message: 'Simulated SMS Sent to ' + loginForm.username });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = Object.entries(data).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n') || 'Registration failed';
        throw new Error(errorMsg);
      }
      // Automate login step directly after registration to make UX fast
      setLoginForm({ username: registerForm.username, password: registerForm.password });
      setMode('login');
      setError('Registration successful! Please log in below.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.email?.[0] || data.detail || 'Password reset request failed');
      }
      setSessionId(data.session_id);
      setStep('otp');
      if (data.otp_code) {
        setSimulatedOTP({ code: data.otp_code, message: 'Simulated Password Reset Email Sent' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'forgot_password') {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/password-reset-confirm/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, otp_code: otpCode, new_password: newPassword })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.otp_code?.[0] || data.detail || 'Reset failed');
        }
        setSimulatedOTP(null);
        setStep('input');
        setMode('login');
        setError('Password reset success! Please log in.');
      } else {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/verify-otp/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, otp_code: otpCode })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.otp_code?.[0] || data.detail || 'Incorrect OTP code');
        }
        setSimulatedOTP(null);
        // Save SimpleJWT tokens
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.profile) {
          localStorage.setItem('profile', JSON.stringify(data.profile));
        }
        onAuthSuccess(data.user, data.profile);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-28 px-4 sm:px-6 lg:px-8 bg-grain-cream relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-grain-green/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-grain-gold/5 rounded-full blur-[100px] -z-10" />

      {/* Simulated OTP Notification Banner */}
      <AnimatePresence>
        {simulatedOTP && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-gray-900 text-white p-5 rounded-2xl shadow-2xl border border-grain-gold/30 flex gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-grain-gold/20 flex items-center justify-center text-grain-gold shrink-0">
              <Key className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-grain-gold uppercase tracking-wider">{simulatedOTP.message}</h4>
              <p className="text-xs text-gray-400 mt-1">Verification Code:</p>
              <div className="text-3xl font-black tracking-widest text-white mt-1 select-all cursor-pointer" title="Click to copy">
                {simulatedOTP.code}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">SIMULATION MODE: Copy & paste this code inside the input field below.</p>
            </div>
            <button 
              onClick={() => setSimulatedOTP(null)} 
              className="text-gray-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-grain-green rounded-2xl items-center justify-center text-white text-2xl font-bold shadow-lg shadow-grain-green/20 mb-4">
            HG
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 'otp' 
              ? 'Verify Security Code' 
              : mode === 'login' 
                ? 'Welcome Back' 
                : mode === 'register' 
                  ? 'Create Customer Account' 
                  : 'Reset Password'}
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {step === 'otp'
              ? 'Please enter the 6-digit verification code sent to your credentials.'
              : mode === 'login'
                ? 'Sign in to place orders, review products, and manage transactions.'
                : mode === 'register'
                  ? 'Access healthy grain collections at premium wholesale & retail rates.'
                  : 'Provide your registered email address to receive password instructions.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="whitespace-pre-line font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {step === 'otp' ? (
          <form onSubmit={handleOTPVerifySubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">6-Digit Code</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-center text-2xl font-extrabold tracking-widest focus:bg-white focus:border-grain-green outline-none transition-all"
                />
              </div>
            </div>

            {mode === 'forgot_password' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Create a strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-grain-green outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Verify Code'}
              <Check className="w-5 h-5" />
            </button>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setStep('input'); setSimulatedOTP(null); }} 
                className="text-xs text-gray-500 hover:text-grain-green font-bold uppercase tracking-wider"
              >
                ← Back to previous screen
              </button>
            </div>
          </form>
        ) : (
          <>
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Enter username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot_password')} 
                      className="text-xs text-grain-gold hover:text-grain-gold-dark font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Request OTP Login'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Create username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="email@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="Create password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="10-digit number"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Delivery Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Building name, street, locality"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">State</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={registerForm.state}
                      onChange={(e) => setRegisterForm({ ...registerForm, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base font-bold shadow-lg shadow-grain-green/20">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Register Account'}
                  <Check className="w-5 h-5" />
                </button>
              </form>
            )}

            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="Enter registered email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Request Password Reset'}
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    className="text-xs text-gray-500 hover:text-grain-green font-bold uppercase tracking-wider"
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            )}

            {/* View Switchers */}
            {mode !== 'forgot_password' && (
              <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-3">
                {mode === 'login' ? (
                  <>
                    <p className="text-sm text-gray-500">
                      Don't have a retail customer account?{' '}
                      <button onClick={() => setMode('register')} className="text-grain-green font-bold hover:underline">
                        Register here
                      </button>
                    </p>
                    <div className="bg-grain-green-light/50 p-4 rounded-2xl border border-grain-green/10 flex items-center gap-3 justify-center text-xs font-medium text-grain-green-dark">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Are you a dealer?{' '}
                        <button onClick={onSwitchToDealerRegister} className="underline font-bold hover:text-grain-green-dark">
                          Submit Dealership Onboarding Form
                        </button>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Already registered?{' '}
                    <button onClick={() => setMode('login')} className="text-grain-green font-bold hover:underline">
                      Log in here
                    </button>
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthView;
