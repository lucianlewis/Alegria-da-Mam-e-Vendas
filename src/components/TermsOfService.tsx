import React from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2">{t('termsOfService')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
        <div className="space-y-4">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText size={24} />
          </div>
          <h2 className="m3-headline-medium">{t('termsOfUse')}</h2>
          <p className="m3-body-medium text-slate-500 leading-relaxed">
            {t('termsIntro')}
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" />
              {t('acceptance')}
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              {t('acceptanceText')}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <AlertTriangle size={20} className="text-primary" />
              {t('userResponsibilities')}
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              {t('userResponsibilitiesText')}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              {t('limitationOfLiability')}
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              {t('limitationOfLiabilityText')}
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
