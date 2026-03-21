import React from 'react';
import { motion } from 'motion/react';
import { Home, ReceiptText, History, User, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
  onSangriaClick: () => void;
  onReforcoClick: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onPlusClick,
  onSangriaClick,
  onReforcoClick
}) => {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const tabs = [
    { id: 'home', icon: Home, label: t('dashboard') },
    { id: 'entries', icon: ReceiptText, label: t('entries') },
    { id: 'history', icon: History, label: t('history') },
    { id: 'profile', icon: User, label: t('profile') },
  ];

  const menuOptions = [
    { label: 'Releases', action: onPlusClick },
    { label: 'Bleed', action: onSangriaClick },
    { label: 'Reinforcements', action: onReforcoClick },
  ];

  // SVG Paths for the circular notch animation
  // notchedPath: A smooth circular dip in the center (Estado 1)
  // flatPath: A straight line across the top (Estado 3)
  // Both paths have the same structure for smooth morphing.
  // Center is 200. Button radius is 32. Notch radius is 35 (3px gap).
  const notchedPath = "M0,0 H140 C165,0 175,35 200,35 C225,35 235,0 260,0 H400 V54 H0 Z";
  const flatPath = "M0,0 H140 C165,0 175,0 200,0 C225,0 235,0 260,0 H400 V54 H0 Z";

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col max-w-md mx-auto border-x border-black/5 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
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

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 h-28 pointer-events-none">
        {/* The Navigation Bar Background with Animated Notch */}
        <div className="absolute bottom-0 w-full h-[54px] pointer-events-auto">
          <svg 
            viewBox="0 0 400 54" 
            className="absolute inset-0 w-full h-full drop-shadow-[0_-4px_12px_rgba(0,0,0,0.15)]"
            style={{ fill: 'var(--nav-bg)' }}
            preserveAspectRatio="none"
          >
            <motion.path 
              d={isMenuOpen ? flatPath : notchedPath}
              animate={{ d: isMenuOpen ? flatPath : notchedPath }}
              transition={{ 
                type: "spring", 
                stiffness: 180, 
                damping: 28
              }}
            />
          </svg>
          
          {/* Distributed Icons - Centered in 54px height */}
          <div className="relative h-full flex items-center justify-between px-2">
            <div className="flex flex-1 justify-around pr-16">
              {tabs.slice(0, 2).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors",
                    activeTab === tab.id ? "text-primary" : "text-[var(--nav-icon-unselected)]"
                  )}
                >
                  <tab.icon size={22} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 justify-around pl-16">
              {tabs.slice(2).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors",
                    activeTab === tab.id ? "text-primary" : "text-[var(--nav-icon-unselected)]"
                  )}
                >
                  <tab.icon size={22} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central Button and Menu Card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center">
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.9 }}
                animate={{ opacity: 1, y: -180, scale: 1 }}
                exit={{ opacity: 0, y: 0, scale: 0.9 }}
                className="absolute bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 min-w-[180px] border border-black/5 dark:border-white/10 z-40"
              >
                <div className="flex flex-col gap-1">
                  {menuOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        option.action();
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-center"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            initial={false}
            animate={{ 
              // Nav height 112px (h-28). Bar height 54px. Bar top is at 58px.
              // Button center is 32px. To reach 58px, y must be 26.
              // Current travel was 86px (from 26 to -60). 
              // Half travel is 43px. New target: 26 - 43 = -17.
              // Adjusted for 6dp gap: y: 23 (from 26). New open target: 23 - 43 = -20.
              y: isMenuOpen ? -20 : 23, 
            }}
            transition={{ type: "spring", stiffness: 180, damping: 28 }}
            className={cn(
              "size-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 z-50",
              isMenuOpen && "shadow-primary/40"
            )}
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </div>
      </nav>
    </div>
  );
};
