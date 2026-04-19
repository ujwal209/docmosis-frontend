import { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Navbar from '../components/Navbar';
import { FileText, Brain, ArrowRight, Layers, Zap, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const container = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // --- AUTH REDIRECT ---
  useEffect(() => {
    // FIX: Match the key 'docmosiss_token' used in your Login.tsx
    const token = localStorage.getItem('docmosiss_token');
    if (token) {
      navigate('/dashboard');
    } else {
      setIsCheckingAuth(false); // Only show landing if NO token found
    }
  }, [navigate]);

  useGSAP(() => {
    if (isCheckingAuth) return;
    gsap.from(".hero-elem", { y: 40, opacity: 0, duration: 1, stagger: 0.15, ease: "power4.out", delay: 0.1 });
    const sections = gsap.utils.toArray('.scroll-section');
    sections.forEach((section: any) => {
      gsap.from(section.querySelectorAll('.scroll-elem'), {
        scrollTrigger: { trigger: section, start: "top 85%" },
        y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
      });
    });
  }, { scope: container, dependencies: [isCheckingAuth] });

  // Prevent flicker: Show nothing while checking for the token
  if (isCheckingAuth) return <div className="min-h-screen bg-black" />;

  return (
    <div ref={container} className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors duration-300 overflow-x-hidden">
      <Navbar />

      <section className="pt-40 md:pt-52 pb-24 md:pb-32 px-6 flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
        <h1 className="hero-elem text-5xl md:text-8xl font-bold font-display tracking-tighter leading-[1.1] mb-6 md:mb-8 text-zinc-950 dark:text-white">
          Understand every <br className="hidden md:block"/> document instantly.
        </h1>
        <p className="hero-elem text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10 md:mb-12">
          Transform complex files into clear, actionable insights. Convert formats flawlessly and let our AI read, analyze, and summarize your data in seconds.
        </p>
        <div className="hero-elem flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="rounded-full px-8 py-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link to="/signup">Start Free Trial <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-base border-zinc-200 dark:border-zinc-800">
            <a href="#analysis"> Explore Features </a>
          </Button>
        </div>
      </section>

      {/* ... rest of your landing page code ... */}
      <section id="solutions" className="scroll-section py-24 md:py-32 bg-white dark:bg-zinc-950 px-6 border-y border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="scroll-elem text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4 text-zinc-950 dark:text-white">
              Flawless Document Conversion.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
              Upload any file type. We strip away the clutter, preserve the important information, and format it exactly how you need it.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Universal Uploads", desc: "PDFs, Word documents, spreadsheets, or raw text. If you can read it, we can process it." },
              { icon: Layers, title: "Clean Formatting", desc: "We automatically remove messy layouts and extract the pure text, tables, and data." },
              { icon: Zap, title: "Instant Export", desc: "Download your newly formatted documents immediately, ready for professional use." }
            ].map((Item, idx) => (
              <Card key={idx} className="scroll-elem rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
                <CardHeader>
                  <Item.icon className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mb-2" />
                  <CardTitle className="text-xl">{Item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{Item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="analysis" className="scroll-section py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h2 className="scroll-elem text-3xl md:text-5xl font-display font-bold tracking-tight mb-6 text-zinc-950 dark:text-white">
              Let AI do the heavy reading.
            </h2>
            <p className="scroll-elem text-zinc-600 dark:text-zinc-400 text-lg mb-8 leading-relaxed">
              Stop wasting hours reading through hundred-page contracts or reports. Our intelligent system reads your documents and acts as your personal research assistant.
            </p>
            <ul className="scroll-elem space-y-4 mb-10">
              {[
                "Ask plain-English questions about your files.",
                "Get instant, accurate summaries of long reports.",
                "Extract specific clauses, dates, or financial figures.",
                "Cross-reference information across multiple documents."
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="link" className="scroll-elem p-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-base font-semibold">
              <Link to="/signup"> See AI Analysis in action <ArrowRight className="h-4 w-4 ml-2" /> </Link>
            </Button>
          </div>
          <div className="md:w-1/2 scroll-elem w-full">
            <Card className="rounded-2xl shadow-xl dark:shadow-none dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                  <span className="font-semibold text-zinc-900 dark:text-white">Docmosiss Assistant</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg rounded-tr-none ml-auto w-3/4 text-sm text-zinc-800 dark:text-zinc-200">
                  Can you summarize the key financial risks mentioned in the Q3 report?
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 p-4 rounded-lg rounded-tl-none w-5/6 text-sm text-zinc-800 dark:text-zinc-200">
                  Based on the document, there are three main risks: <br/><br/>
                  1. Supply chain delays impacting Q4 delivery.<br/>
                  2. Increased material costs by 12%.<br/>
                  3. Pending compliance audits in the EU market.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="scroll-section py-24 md:py-32 px-6">
        <div className="scroll-elem max-w-4xl mx-auto bg-emerald-600 dark:bg-emerald-600 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-6">
            Ready to unlock your documents?
          </h2>
          <p className="text-emerald-50 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of professionals saving hours every week with Docmosiss document intelligence.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full px-8 py-6 text-base font-bold text-emerald-700 hover:bg-zinc-100 shadow-lg hover:shadow-xl transition-all">
            <Link to="/signup"> Create Your Free Account </Link>
          </Button>
        </div>
      </section>
      
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-12 px-6 text-center text-zinc-500 dark:text-zinc-600 text-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-display font-bold text-zinc-900 dark:text-white text-lg tracking-tighter">DOCMOSISS</div>
          <p>© 2026 Docmosiss Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}