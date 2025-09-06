import { useLocation, useNavigate } from 'react-router-dom';
import { Database, Home, Settings, Terminal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/dashboard', icon: Database, label: 'Dashboard' },
  { path: '/browser', icon: Database, label: 'Browser' },
  { path: '/console', icon: Terminal, label: 'Console' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 p-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 h-auto text-xs transition-all",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="hidden sm:block">{label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};