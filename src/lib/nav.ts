import { LayoutDashboard, FileUp, Sparkles, FileSearch, HardDrive } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/drive', label: 'My Drive', icon: HardDrive }, // <-- ADDED THIS LINE
  { path: '/dashboard/convert', label: 'Convert Docs', icon: FileUp },
  { path: '/dashboard/assistant', label: 'AI Assistant', icon: Sparkles },
  { path: '/dashboard/analysis', label: 'Analysis', icon: FileSearch },
];