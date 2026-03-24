import React from 'react';
import { auth, signInWithGoogle } from '../firebase';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export const Auth: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-color)] p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="m3-headline-large text-[var(--text-color)] tracking-tighter">
            Sales<span className="text-primary">Pro</span>
          </h1>
          <p className="m3-body-medium text-slate-400">{t('welcomeMessage')}</p>
        </div>

        <div className="bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border-color)] shadow-2xl space-y-6">
          <p className="m3-body-small text-slate-300">{t('signInDescription')}</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-black m3-label-large py-4 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {t('signInWithGoogle')}
          </button>
        </div>

        <p className="m3-label-small text-slate-500">
          {t('authAgreement')}
        </p>
      </motion.div>
    </div>
  );
};
