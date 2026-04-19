import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import MobileNav from '@/components/dashboard/MobileNav';
import { Toaster } from "@/components/ui/sonner"; // <-- NEW IMPORT

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      {/* ADD THE TOASTER HERE */}
      <Toaster position="bottom-right" richColors theme="system" /> 
    </div>
  );
}