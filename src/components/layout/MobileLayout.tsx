import { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';

interface MobileLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export const MobileLayout = ({ children, showNavigation = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 overflow-hidden">
        {children}
      </main>
      {showNavigation && <BottomNavigation />}
    </div>
  );
};