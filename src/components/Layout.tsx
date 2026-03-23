import React from 'react';
import { motion } from 'motion/react';
import { Home, ReceiptText, History, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../firebase';

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
    { id: 'profile', icon: null, label: t('profile') },
  ];

  const menuOptions = [
    { icon: ReceiptText, action: onPlusClick, angle: 210 },
    { icon: TrendingDown, action: onSangriaClick, angle: 270 },
    { icon: TrendingUp, action: onReforcoClick, angle: 330 },
  ];

  const radius = 53.5;

  // SVG Paths for the circular notch animation
  // Centered in a 1000-unit viewBox to maintain consistent shape with preserveAspectRatio="xMidYMin slice"
  // Center is 500. Button size is 56px (size-14). Radius is 28.
  // Notch depth is 32 (4px gap from button center). Notch width is 130.
  const notchedPath = "M0,0 H435 C460,0 475,32 500,32 C525,32 540,0 565,0 H1000 V54 H0 Z";
  const flatPath = "M0,0 H435 C460,0 475,0 500,0 C525,0 540,0 565,0 H1000 V54 H0 Z";

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
            viewBox="0 0 1000 54" 
            className="absolute inset-0 w-full h-full drop-shadow-[0_-4px_12px_rgba(0,0,0,0.15)]"
            style={{ fill: 'var(--nav-bg)' }}
            preserveAspectRatio="xMidYMin slice"
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
                  {tab.id === 'profile' ? (
                    <div className={cn(
                      "size-[22px] rounded-full overflow-hidden border-2 transition-all",
                      activeTab === 'profile' ? "border-primary" : "border-transparent opacity-70"
                    )}>
                      <img 
                        src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
                        className="w-full h-full object-cover" 
                        alt={t('profileImage')} 
                      />
                    </div>
                  ) : (
                    tab.icon && <tab.icon size={22} />
                  )}
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
                  {tab.id === 'profile' ? (
                    <div className={cn(
                      "size-[22px] rounded-full overflow-hidden border-2 transition-all",
                      activeTab === 'profile' ? "border-primary" : "border-transparent opacity-70"
                    )}>
                      <img 
                        src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
                        className="w-full h-full object-cover" 
                        alt={t('profileImage')} 
                      />
                    </div>
                  ) : (
                    tab.icon && <tab.icon size={22} />
                  )}
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
              <div className="absolute z-40 flex flex-col items-center">
                {menuOptions.map((option, idx) => {
                  const x = radius * Math.cos((option.angle * Math.PI) / 180);
                  const y = radius * Math.sin((option.angle * Math.PI) / 180);
                  
                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: 1, 
                        x,
                        y: y - 2, // Aligning with the main button's open position
                        scale: 1 
                      }}
                      exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        delay: idx * 0.05
                      }}
                      onClick={() => {
                        option.action();
                        setIsMenuOpen(false);
                      }}
                      className="absolute size-[39px] rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                    >
                      <option.icon size={20} strokeWidth={2.5} />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          <motion.button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            initial={false}
            animate={{ 
              // Center of button (radius 28) should align with bar top (58px from nav top).
              // Original center is at 28. Translation of 30px puts center at 58px.
              // When elevated, we want a 4dp gap from the bar top (58px).
              // Bar top is at 58px. Button bottom should be at 58 - 4 = 54px.
              // Button height is 56px. Top should be at 54 - 56 = -2px.
              y: isMenuOpen ? -2 : 30, 
            }}
            transition={{ type: "spring", stiffness: 180, damping: 28 }}
            className={cn(
              "size-14 bg-primary rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 z-50",
              isMenuOpen && "shadow-primary/40"
            )}
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
        </div>
      </nav>
    </div>
  );
};
