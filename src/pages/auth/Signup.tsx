import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Zap, KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from '@/lib/api';

export default function Signup() {
  const navigate = useNavigate();
  
  // 1. Initialize State from sessionStorage to survive refreshes
  const [step, setStep] = useState<1 | 2>(() => Number(sessionStorage.getItem('signup_step')) as 1 | 2 || 1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => sessionStorage.getItem('signup_email') || '');
  const [password, setPassword] = useState(() => sessionStorage.getItem('signup_password') || '');
  const [otp, setOtp] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Resend Timer State
  const [countdown, setCountdown] = useState(0);

  // Handle Resend Timer Tick
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: name })
      });
      
      // Save state to survive a page refresh
      sessionStorage.setItem('signup_step', '2');
      sessionStorage.setItem('signup_email', email);
      sessionStorage.setItem('signup_password', password); // Temporary for auto-login
      
      setStep(2);
      setCountdown(60); // Start 60s cooldown
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verify the OTP
      await fetchAPI('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp_code: otp })
      });
      
      // 2. Silently Log them in to get the Supabase JWT
      const loginData = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      // 3. Save Token & Clean up storage
      localStorage.setItem('docmosiss_token', loginData.access_token);
      sessionStorage.removeItem('signup_step');
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_password');
      
      // 4. Send straight to Onboarding!
      navigate('/onboarding'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await fetchAPI('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccessMsg('A new code has been sent to your email.');
      setCountdown(60); // Restart cooldown
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    sessionStorage.clear();
    setStep(1);
    setOtp('');
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 font-sans transition-colors duration-300 bg-zinc-50 dark:bg-black">
      {/* LEFT SIDE: Premium Branding */}
      <div className="hidden md:flex flex-col justify-between bg-zinc-950 p-12 text-white border-r border-zinc-900">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter font-display hover:opacity-80 transition-opacity">
          <Zap className="h-6 w-6 text-emerald-500" /> DOCMOSISS
        </Link>
        <div className="max-w-md">
          <h2 className="text-4xl font-display font-semibold tracking-tight leading-tight mb-6">
            Stop reading. Start understanding.
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Create your account to transform complex reports into clear, cited summaries with our advanced AI engine.
          </p>
        </div>
        <p className="text-sm text-zinc-600">© 2026 Docmosiss Inc.</p>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="flex flex-col justify-center items-center px-6 py-12 relative">
        <Card className="w-full max-w-md shadow-xl dark:shadow-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="space-y-1 text-center md:text-left">
            <CardTitle className="text-3xl font-display font-bold text-zinc-950 dark:text-white">
              {step === 1 ? "Create an account" : "Verify your email"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Start converting and analyzing documents instantly." 
                : `We sent a 6-digit code to ${email}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-900">{error}</div>}
            {successMsg && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-sm rounded-md border border-emerald-200 dark:border-emerald-900">{successMsg}</div>}

            {step === 1 ? (
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="pl-9 py-6 bg-zinc-50 dark:bg-zinc-900" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" className="pl-9 py-6 bg-zinc-50 dark:bg-zinc-900" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className="pl-9 py-6 bg-zinc-50 dark:bg-zinc-900" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full font-semibold py-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                  {loading ? "Processing..." : "Create Free Account"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="otp">6-Digit Code</Label>
                    <button 
                      type="button" 
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || loading}
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input id="otp" type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="pl-9 py-6 bg-zinc-50 dark:bg-zinc-900 tracking-widest text-lg font-bold" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full font-semibold py-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
                <button type="button" onClick={handleGoBack} className="w-full text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mt-4">
                  Wrong email? Go back
                </button>
              </form>
            )}
            
            {step === 1 && (
              <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                Already have an account? <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Log in</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}