import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Brain, Target, Sparkles, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { fetchAPI } from '@/lib/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [userType, setUserType] = useState('professional');
  const [useCase, setUseCase] = useState('');
  const [bio, setBio] = useState('');

  const [apiUseCases, setApiUseCases] = useState<string[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Simulate API Fetch
  useEffect(() => {
    async function fetchUseCases() {
      setApiLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApiUseCases([
          "Invoice Processing",
          "Resume Parsing",
          "General Document Chat"
        ]);
      } catch (err) {
        setApiUseCases(["General Assistance"]);
      } finally {
        setApiLoading(false);
      }
    }
    fetchUseCases();
  }, []);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!useCase) {
      setError('Please select or enter your primary use case.');
      setLoading(false);
      return;
    }

    try {
      await fetchAPI('/users/onboarding', {
        method: 'POST',
        body: JSON.stringify({ user_type: userType, primary_use_case: useCase, bio: bio })
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-zinc-50 dark:bg-black font-sans selection:bg-emerald-500/30 relative overflow-y-auto">
      
      {/* Subtle Top Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-15 dark:opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--color-emerald-500),transparent_70%)]"></div>

      {/* WIDENED CONTAINER: Changed from 500px to 520px to give more horizontal breathing room */}
      <div className="w-full max-w-[520px] space-y-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center items-center gap-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white font-display">
            <Zap className="h-6 w-6 text-emerald-500" /> DOCMOSISS
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-semibold tracking-tight text-zinc-900 dark:text-white">
              Tailor your workspace
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Docmosiss adapts its AI context window to your industry.
            </p>
          </div>
        </div>

        {/* The Main Form Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleOnboarding} className="space-y-7">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
                {error}
              </div>
            )}

            {/* 1. User Type Cards (FIXED: Now stretching horizontally, not vertically) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', label: 'Student', icon: Brain },
                  { value: 'professional', label: 'Professional', icon: Zap },
                  { value: 'freelancer', label: 'Freelancer', icon: Target },
                  { value: 'other', label: 'Other', icon: Sparkles }
                ].map((item) => (
                  <button key={item.value} type="button" onClick={() => setUserType(item.value)}
                    // CHANGED to h-12, flex-row, justify-start, items-center
                    className={`h-12 px-4 rounded-xl border flex flex-row justify-start items-center gap-3 transition-all duration-200 shadow-sm ${
                      userType === item.value 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/50 ring-1 ring-emerald-500' 
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${userType === item.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`} />
                    <span className={`text-sm font-medium ${userType === item.value ? 'text-emerald-900 dark:text-emerald-300' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Primary Use Case */}
            <div className="space-y-3">
              <Label htmlFor="useCase" className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">Primary Goal</Label>
              <Input 
                id="useCase" 
                required 
                value={useCase} 
                onChange={(e) => setUseCase(e.target.value)} 
                placeholder="e.g., Analyzing legal contracts" 
                className="h-11 px-4 text-sm bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-lg shadow-sm focus-visible:ring-emerald-500" 
              />
              
              {/* Quick Select Pills */}
              {apiLoading ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-7 w-[100px] rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {apiUseCases.map((use, idx) => (
                    <Badge key={idx} variant="secondary" onClick={() => setUseCase(use)} 
                      className={`py-1.5 px-3 rounded-full text-xs font-medium cursor-pointer transition-all ${
                        useCase === use 
                          ? 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white hover:bg-emerald-700' 
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      {use}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Bio */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="bio" className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">Bio</Label>
                <span className="text-xs text-zinc-400">Optional</span>
              </div>
              <Textarea 
                id="bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="What does your team do?" 
                className="min-h-[90px] resize-none px-4 py-3 text-sm bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-lg shadow-sm focus-visible:ring-emerald-500" 
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 rounded-lg transition-all">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Initializing Workspace...</span>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          © 2026 Docmosiss Inc. All rights reserved.
        </p>

      </div>
    </div>
  );
}