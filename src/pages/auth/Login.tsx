import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      // Save the token!
      localStorage.setItem('docmosiss_token', data.access_token);
      
      // Send them to the app
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 font-sans transition-colors duration-300 bg-zinc-50 dark:bg-black">
      {/* LEFT SIDE */}
      <div className="hidden md:flex flex-col justify-between bg-zinc-950 p-12 text-white border-r border-zinc-900">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter font-display hover:opacity-80 transition-opacity">
          <Zap className="h-6 w-6 text-emerald-500" /> DOCMOSISS
        </Link>
        <div className="max-w-md">
          <h2 className="text-4xl font-display font-semibold tracking-tight leading-tight mb-6">
            Document intelligence, instantly.
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Log in to convert complex formats and let AI analyze your data in seconds.
          </p>
        </div>
        <p className="text-sm text-zinc-600">© 2026 Docmosiss Inc.</p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col justify-center items-center px-6 py-12 relative">
        <Card className="w-full max-w-md shadow-xl dark:shadow-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="space-y-1 text-center md:text-left">
            <CardTitle className="text-3xl font-display font-bold text-zinc-950 dark:text-white">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your workspace.</CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-900">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="pl-9 py-6 bg-zinc-50 dark:bg-zinc-900" />
                </div>
              </div>
              
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 py-6 bg-zinc-50 dark:bg-zinc-900" />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full font-semibold py-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                {loading ? "Authenticating..." : "Log in to Docmosiss"}
              </Button>
            </form>
            
            <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              Don't have an account? <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}