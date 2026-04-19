import { Zap, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
      {/* Mobile Logo (Only shows on mobile) */}
      <Link
        to="/dashboard"
        className="flex md:hidden items-center gap-1.5 font-bold font-display text-lg text-zinc-900 dark:text-white"
      >
        <Zap className="h-5 w-5 text-emerald-500" /> DOCMOSISS
      </Link>

      {/* Desktop Search */}
      <div className="hidden md:flex relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search documents, entities, or chats..."
          className="pl-9 bg-zinc-100/50 border-transparent dark:bg-zinc-900/50 dark:border-zinc-800 focus-visible:ring-emerald-500"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-500 rounded-full"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-zinc-950 cursor-pointer">
          U
        </div>
      </div>
    </header>
  );
}
