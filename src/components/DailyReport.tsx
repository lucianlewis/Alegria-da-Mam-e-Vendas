import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Share2, Download, CheckCircle2, TrendingUp, Link as LinkIcon, Trash2, Loader2, AlertCircle, Banknote, CreditCard, Smartphone, QrCode, Ticket } from 'lucide-react';
import { Sale, CashMovement, Goal, Seller } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateDailyGoal } from '../utils/goalUtils';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface DailyReportProps {
  date: Date;
  sales: Sale[];
  cashMovements: CashMovement[];
  goal?: Goal;
  sellers: Seller[];
  onBack: () => void;
  onDeleteSale?: (id: string) => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({ date, sales, cashMovements, goal, sellers, onBack, onDeleteSale }) => {
  const { t, formatCurrency, language } = useLanguage();
  const currentLocale = language === 'pt-BR' ? ptBR : enUS;

  // Calculations
  const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);
  const transactions = sales.length;
  const averageTicket = transactions > 0 ? totalSales / transactions : 0;

  const methods = sales.reduce((acc, s) => {
    if (s.payments && s.payments.length > 0) {
      s.payments.forEach(p => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
      });
    } else {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const sources = sales.reduce((acc, s) => {
    acc[s.source] = (acc[s.source] || 0) + s.amount;
    return acc;
  }, {} as Record<string, number>);

  const sangrias = cashMovements
    .filter(m => m.type === 'sangria')
    .reduce((acc, m) => acc + m.amount, 0);
  const reforcos = cashMovements
    .filter(m => m.type === 'reforco')
    .reduce((acc, m) => acc + m.amount, 0);

  const goalTarget = calculateDailyGoal(sellers, date);
  const diff = totalSales - goalTarget;
  const isGoalMet = diff >= 0;
  const progress = Math.min(100, (totalSales / goalTarget) * 100);
  const actualProgress = (totalSales / goalTarget) * 100;

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const colors = {
    bg: isDark ? '#121212' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1a1a1a',
    card: isDark ? '#1e1e1e' : '#f8fafc',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    muted: isDark ? '#94a3b8' : '#64748b',
    primary: '#ff0080',
    success: '#10b981',
    error: '#f43f5e',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
  };

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDeleteSale) return;
    try {
      setDeletingId(id);
      await onDeleteSale(id);
      setShowDeleteConfirm(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('daily-report-content');
    if (!element || isGenerating) return;

    try {
      setIsGenerating(true);
      // Ensure the element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: colors.bg,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('daily-report-content');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${t('dailyReport').toLowerCase().replace(/\s+/g, '-')}-${format(date, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-50 min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[var(--bg-color)] border-b border-[var(--border-color)]">
        <button onClick={onBack} className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small">{t('dailyReport')}</h1>
        <button className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors">
          <Share2 size={20} />
        </button>
      </header>

      <div className="p-4 max-w-md mx-auto w-full">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full py-4 bg-primary text-white rounded-2xl m3-label-large tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {isGenerating ? t('generating') || 'GERANDO...' : t('downloadPDF')}
        </button>
      </div>

      <main id="daily-report-content" className="p-4 space-y-6 max-w-md mx-auto w-full" style={{ backgroundColor: colors.bg }}>
        <div className="text-center space-y-1 py-4">
          <h2 className="m3-headline-small tracking-tight" style={{ color: colors.text }}>
            {format(date, `dd '${t('of')}' MMMM, yyyy`, { locale: currentLocale })}
          </h2>
          <p className="m3-body-small tracking-widest italic opacity-70" style={{ color: colors.muted }}>
            {t('closing')}: {format(new Date(), 'HH:mm')}
          </p>
        </div>

        {/* Sales Summary */}
        <section className="rounded-[32px] p-6 space-y-6 border" style={{ backgroundColor: colors.card, borderColor: colors.border, boxShadow: colors.shadow }}>
          <h3 className="m3-label-small tracking-[0.2em]" style={{ color: colors.primary }}>{t('salesSummary')}</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="m3-body-medium" style={{ color: colors.muted }}>{t('grossSales')}</span>
              <span className="m3-title-medium" style={{ color: colors.text }}>{formatCurrency(totalSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="m3-body-medium" style={{ color: colors.muted }}>{t('discounts')}</span>
              <span className="m3-title-medium" style={{ color: colors.error }}>- {formatCurrency(0)}</span>
            </div>
            <div className="pt-4 border-t flex justify-between items-end" style={{ borderColor: colors.border }}>
              <span className="m3-title-large" style={{ color: colors.text }}>{t('netTotal')}</span>
              <span className="m3-headline-large" style={{ color: colors.primary }}>{formatCurrency(totalSales)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 space-y-1 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <p className="m3-label-small tracking-wider" style={{ color: colors.muted }}>{t('transactions')}</p>
              <p className="m3-headline-small" style={{ color: colors.text }}>{transactions}</p>
              <div className="flex items-center gap-1 m3-label-small" style={{ color: colors.success }}>
                <TrendingUp size={10} />
                <span>+5% {t('vs')} {t('yesterday')}</span>
              </div>
            </div>
            <div className="rounded-2xl p-4 space-y-1 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <p className="m3-label-small tracking-wider" style={{ color: colors.muted }}>{t('averageTicket')}</p>
              <p className="m3-headline-small" style={{ color: colors.text }}>{formatCurrency(averageTicket)}</p>
              <div className="flex items-center gap-1 m3-label-small" style={{ color: colors.success }}>
                <TrendingUp size={10} />
                <span>+7% {t('vs')} {t('yesterday')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sales by Source */}
        <section className="rounded-[32px] p-6 space-y-6 border" style={{ backgroundColor: colors.card, borderColor: colors.border, boxShadow: colors.shadow }}>
          <h3 className="m3-label-small tracking-[0.2em]" style={{ color: colors.primary }}>{t('salesBySource')}</h3>
          
          <div className="space-y-4">
            {[
              { id: 'physical-store', label: t('physicalStore') },
              { id: 'whatsapp', label: t('whatsapp') },
              { id: 'instagram', label: t('instagram') },
            ].map((source) => (
              <div key={source.id} className="flex justify-between items-center">
                <span className="m3-body-medium" style={{ color: colors.muted }}>{source.label}</span>
                <span className="m3-title-medium" style={{ color: colors.text }}>{formatCurrency(sources[source.id] || 0)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cash Reconciliation */}
        <section className="rounded-[32px] p-6 space-y-6 border" style={{ backgroundColor: colors.card, borderColor: colors.border, boxShadow: colors.shadow }}>
          <h3 className="m3-label-small tracking-[0.2em]" style={{ color: colors.primary }}>{t('cashReconciliation')}</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center m3-body-medium">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: colors.muted }}>
                    <Banknote size={16} />
                  </div>
                  <span style={{ color: colors.text }}>{t('cash')}</span>
                </div>
                <span style={{ color: colors.text }}>{formatCurrency(methods['cash'] || 0)}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="h-full w-[40%]" style={{ backgroundColor: colors.muted }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center m3-body-medium">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: colors.primary }}>
                    <CreditCard size={16} />
                  </div>
                  <span style={{ color: colors.text }}>{t('card')} ({t('debitCredit')})</span>
                </div>
                <span style={{ color: colors.text }}>{formatCurrency((methods['credit'] || 0) + (methods['debit'] || 0))}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="h-full w-[70%]" style={{ backgroundColor: colors.primary }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center m3-body-medium">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: colors.success }}>
                    <QrCode size={16} />
                  </div>
                  <span style={{ color: colors.text }}>{t('pix')}</span>
                </div>
                <span style={{ color: colors.text }}>{formatCurrency(methods['pix'] || 0)}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="h-full w-[25%]" style={{ backgroundColor: colors.success }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center m3-body-medium">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: colors.primary }}>
                    <LinkIcon size={16} />
                  </div>
                  <span style={{ color: colors.text }}>{t('paymentLink')}</span>
                </div>
                <span style={{ color: colors.text }}>{formatCurrency(methods['payment-link'] || 0)}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="h-full w-[15%]" style={{ backgroundColor: colors.primary }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center m3-body-medium">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: colors.muted }}>
                    <Ticket size={16} />
                  </div>
                  <span style={{ color: colors.text }}>{t('exchangeVoucher')}</span>
                </div>
                <span style={{ color: colors.text }}>{formatCurrency(methods['exchange-voucher'] || 0)}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="h-full w-[10%]" style={{ backgroundColor: colors.muted }} />
              </div>
            </div>

            <div className="rounded-2xl p-4 grid grid-cols-2 gap-4 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="space-y-1">
                <p className="m3-label-small tracking-wider" style={{ color: colors.muted }}>{t('totalSangrias')}</p>
                <p className="m3-title-small" style={{ color: colors.error }}>- {formatCurrency(sangrias)}</p>
              </div>
              <div className="space-y-1 border-l pl-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <p className="m3-label-small tracking-wider" style={{ color: colors.muted }}>{t('totalReforcos')}</p>
                <p className="m3-title-small" style={{ color: colors.success }}>+ {formatCurrency(reforcos)}</p>
              </div>
            </div>

            <div className="rounded-2xl p-4 flex gap-3 items-start border" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle2 style={{ color: colors.success }} className="shrink-0" size={18} />
              <p className="m3-label-small leading-relaxed" style={{ color: '#059669' }}>
                {t('cashReconciledSuccess')}
              </p>
            </div>
          </div>
        </section>

        {/* Individual Sales List */}
        <section className="rounded-[32px] p-6 space-y-6 border" style={{ backgroundColor: colors.card, borderColor: colors.border, boxShadow: colors.shadow }}>
          <h3 className="m3-label-small tracking-[0.2em]" style={{ color: colors.primary }}>{t('recentSales')}</h3>
          
          <div className="space-y-3">
            {sales.sort((a, b) => {
              const timeA = a.timestamp?.toDate().getTime() || 0;
              const timeB = b.timestamp?.toDate().getTime() || 0;
              return timeB - timeA;
            }).map((sale, idx) => (
              <div key={sale.id || idx} className="flex justify-between items-center py-3 border-b last:border-0" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: colors.primary }}>
                    {sale.paymentMethod === 'cash' && <Banknote size={14} />}
                    {sale.paymentMethod === 'credit' && <CreditCard size={14} />}
                    {sale.paymentMethod === 'debit' && <Smartphone size={14} />}
                    {sale.paymentMethod === 'pix' && <QrCode size={14} />}
                    {sale.paymentMethod === 'payment-link' && <LinkIcon size={14} />}
                    {sale.paymentMethod === 'exchange-voucher' && <Ticket size={14} />}
                  </div>
                  <div>
                    <p className="m3-body-medium" style={{ color: colors.text }}>{sale.sellerName}</p>
                    <p className="m3-label-small tracking-wider" style={{ color: colors.muted }}>
                      {t(sale.paymentMethod)} • {t(sale.source)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="m3-title-medium" style={{ color: colors.text }}>{formatCurrency(sale.amount)}</p>
                    <p className="m3-label-small" style={{ color: colors.muted }}>
                      {sale.timestamp?.toDate ? format(sale.timestamp.toDate(), 'HH:mm') : ''}
                    </p>
                  </div>
                  {onDeleteSale && (
                    <button 
                      onClick={() => setShowDeleteConfirm(sale.id!)}
                      disabled={deletingId === sale.id}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {deletingId === sale.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirm(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-xs bg-[var(--card-bg)] rounded-[32px] p-6 text-center space-y-6 border border-[var(--border-color)] shadow-2xl"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                  <Trash2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="m3-title-large" style={{ color: colors.text }}>{t('confirmDelete')}</h3>
                  <p className="m3-body-medium" style={{ color: colors.muted }}>{t('confirmDeleteSale')}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 m3-label-medium tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    style={{ color: colors.text }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={deletingId === showDeleteConfirm}
                    className="flex-1 py-3 rounded-2xl bg-rose-500 text-white m3-label-medium tracking-widest hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {deletingId === showDeleteConfirm ? <Loader2 className="animate-spin" size={16} /> : t('delete')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Daily Goal */}
        <section className="rounded-[32px] p-6 space-y-6 border" style={{ backgroundColor: colors.card, borderColor: colors.border, boxShadow: colors.shadow }}>
          <h3 className="m3-label-small tracking-[0.2em]" style={{ color: colors.success }}>{t('dailyGoal')}</h3>
          
          <div className="flex flex-col items-center py-4 space-y-6">
            <div className="relative size-48">
              <svg className="size-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  style={{ color: 'rgba(255, 255, 255, 0.05)' }}
                />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke={colors.primary} 
                  strokeWidth="10" 
                  strokeDasharray={`${progress * 2.82} 282`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="m3-headline-large" style={{ color: colors.text }}>{actualProgress.toFixed(0)}%</span>
                <span className="m3-label-small tracking-widest" style={{ color: colors.muted }}>{t('achieved')}</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="m3-body-medium" style={{ color: colors.text }}>
                {diff === 0 ? (
                  <span style={{ color: colors.success }}>{t('goalMet')}</span>
                ) : (
                  <>
                    {isGoalMet ? `${t('exceededBy')} ` : `${t('onlyMissing')} `}
                    <span style={{ color: isGoalMet ? colors.success : colors.primary }}>
                      {formatCurrency(Math.abs(diff))}
                    </span>
                  </>
                )}
              </p>
              <p className="m3-label-small tracking-widest" style={{ color: colors.muted }}>
                {t('goalOfTheDay')}: {formatCurrency(goalTarget)}
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center space-y-1 pt-4 opacity-50">
          <p className="m3-label-small tracking-[0.2em]" style={{ color: colors.muted }}>
            {t('reportGeneratedAutomatically')}
          </p>
          <p className="m3-label-small" style={{ color: colors.muted }}>
            {t('id')} {t('ofReport')}: #DR-{format(date, 'yyyyMMdd')}-{transactions}
          </p>
        </footer>
      </main>
    </motion.div>
  );
};
