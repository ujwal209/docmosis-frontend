import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/lib/nav';

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-around px-2 z-50 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              isActive 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}