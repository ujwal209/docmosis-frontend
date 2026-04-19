import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, X, Sun, Moon, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch on the toggle icon
  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-zinc-950 dark:text-white font-display">
          <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
          DOCMOSISS
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <a href="#solutions" className="hover:text-black dark:hover:text-white transition-colors">Solutions</a>
          <a href="#analysis" className="hover:text-black dark:hover:text-white transition-colors">AI Analysis</a>
          <a href="#benefits" className="hover:text-black dark:hover:text-white transition-colors">Benefits</a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* THEME TOGGLE */}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-zinc-600 dark:text-zinc-400"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-zinc-600 dark:text-zinc-400"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-zinc-900 dark:text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-900 px-6 py-6 flex flex-col gap-6 transition-colors duration-300">
          <a href="#solutions" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-600 dark:text-zinc-400">Solutions</a>
          <a href="#analysis" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-600 dark:text-zinc-400">AI Analysis</a>
          <a href="#benefits" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-600 dark:text-zinc-400">Benefits</a>
          <div className="flex flex-col gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button asChild variant="outline" onClick={() => setIsOpen(false)} className="w-full">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild onClick={() => setIsOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}