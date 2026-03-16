import React from 'react';
import { motion } from 'motion/react';
import { Home, ReceiptText, History, User, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onPlusClick }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'entries', icon: ReceiptText, label: 'Entries' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col max-w-md mx-auto border-x border-white/5 relative overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-32">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background-dark/95 backdrop-blur-lg border-t border-white/5 pb-8 pt-2 px-6 flex items-center justify-between z-30">
        <div className="flex items-center justify-between w-full relative h-16">
          {tabs.slice(0, 2).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                activeTab === tab.id ? "text-primary" : "text-slate-500"
              )}
            >
              <tab.icon size={24} fill={activeTab === tab.id ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}

          <div className="relative -top-6">
            <button 
              onClick={onPlusClick}
              className="size-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          {tabs.slice(2).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                activeTab === tab.id ? "text-primary" : "text-slate-500"
              )}
            >
              <tab.icon size={24} fill={activeTab === tab.id ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
