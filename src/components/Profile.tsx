import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Shield, Globe, Lock, FileText, Trash2, ChevronRight, Moon, Check } from 'lucide-react';
import { auth, logout } from '../firebase';
import { useLanguage, languages, LanguageCode } from '../contexts/LanguageContext';

interface ProfileProps {
  onNavigateSellers: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigateSellers }) => {
  const user = auth.currentUser;
  const { t, language, setLanguage } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  const sections = [
    {
      title: t('management'),
      items: [
        { icon: Globe, label: t('stores'), sub: `${t('manageRetail')} (12)` },
        { icon: Shield, label: t('sellers'), sub: `${t('staffPermissions')} (48)`, onClick: onNavigateSellers },
      ]
    },
    {
      title: t('preferences'),
      items: [
        { icon: Moon, label: t('darkMode'), toggle: true },
        { 
          icon: Globe, 
          label: t('language'), 
          value: `${currentLanguage.flag} ${currentLanguage.name}`,
          onClick: () => setShowLanguageDropdown(!showLanguageDropdown)
        },
        { icon: Lock, label: t('privacySettings') },
        { icon: FileText, label: t('termsOfService') },
      ]
    }
  ];

  const handleLanguageSelect = (code: LanguageCode) => {
    setLanguage(code);
    setShowLanguageDropdown(false);
  };

  return (
    <div className="p-4 space-y-8">
      <header className="flex items-center justify-center py-2 relative">
        <h2 className="text-lg font-bold">{t('adminProfile')}</h2>
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="size-32 rounded-full bg-white/10 border-4 border-primary/20 overflow-hidden shadow-2xl">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              className="w-full h-full object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="absolute bottom-0 right-0 size-8 bg-primary rounded-full border-4 border-background-dark flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-2xl font-black tracking-tight">{user?.displayName || 'User'}</h3>
          <p className="text-primary font-bold text-sm">@{user?.email?.split('@')[0]}</p>
          <p className="text-slate-500 text-xs">{user?.email}</p>
        </div>

        <button className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
          {t('editProfile')}
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">{section.title}</h4>
          <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
            {section.items.map((item, idx) => (
              <React.Fragment key={item.label}>
                <div 
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center justify-between p-4 active:bg-white/5 transition-colors",
                    (idx !== section.items.length - 1 || (item.label === t('language') && showLanguageDropdown)) && "border-b border-white/5",
                    item.onClick && "cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      {item.sub && <p className="text-[10px] text-slate-500">{item.sub}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && <span className="text-xs text-slate-500">{item.value}</span>}
                    {item.toggle ? (
                      <div className="w-10 h-6 bg-primary rounded-full relative p-1">
                        <div className="size-4 bg-white rounded-full ml-auto" />
                      </div>
                    ) : (
                      <ChevronRight 
                        size={16} 
                        className={cn(
                          "text-slate-600 transition-transform",
                          item.label === t('language') && showLanguageDropdown && "rotate-90"
                        )} 
                      />
                    )}
                  </div>
                </div>

                {item.label === t('language') && (
                  <AnimatePresence>
                    {showLanguageDropdown && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/20"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <div className={cn(
                              "size-2 rounded-full",
                              language === lang.code ? "bg-primary" : "bg-slate-700"
                            )} />
                            <span className="text-lg leading-none">{lang.flag}</span>
                            <span className={cn(
                              "text-sm font-medium",
                              language === lang.code ? "text-white" : "text-slate-400"
                            )}>
                              {lang.name}
                            </span>
                            {language === lang.code && <Check size={14} className="ml-auto text-primary" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
        <button className="w-full flex items-center gap-4 p-4 text-rose-500 active:bg-rose-500/10 transition-colors border-b border-white/5">
          <Trash2 size={20} />
          <span className="text-sm font-bold">{t('deleteAccount')}</span>
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 p-4 text-rose-500 active:bg-rose-500/10 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-bold">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
