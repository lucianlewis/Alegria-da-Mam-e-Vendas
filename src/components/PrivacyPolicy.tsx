import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2">{t('privacyPolicy')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
        <div className="space-y-4">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield size={24} />
          </div>
          <h2 className="m3-headline-medium">{t('dataProtection')}</h2>
          <p className="m3-body-medium text-slate-500 leading-relaxed">
            {t('privacyIntro')}
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Eye size={20} className="text-primary" />
              {t('dataCollection')}
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              {t('dataCollectionText')}
            </p>
            <ul className="space-y-2 pl-4">
              {['fullName', 'email', 'salesData', 'inventoryData'].map(item => (
                <li key={item} className="flex items-center gap-2 m3-body-small text-slate-400">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {t(item)}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              {t('dataSecurity')}
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              {t('dataSecurityText')}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              {t('lgpdCompliance')}
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              {t('lgpdText')}
            </p>
          </section>
        </div>

        <footer className="pt-8 border-t border-[var(--border-color)] text-center">
          <p className="m3-label-small text-slate-500 uppercase tracking-widest">
            {t('lastUpdated')}: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </main>
    </div>
  );
};
