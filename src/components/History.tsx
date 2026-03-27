import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Download, ChevronDown, Trash2, Calendar, Clock, User, CreditCard, Banknote, Smartphone, QrCode, Store, MessageCircle, Instagram, AlertCircle, Loader2, FileText, Link as LinkIcon, Ticket } from 'lucide-react';
import { Sale, CashMovement, Goal, Seller } from '../types';
import { format, isSameDay } from 'date-fns';
import { enUS, ptBR, fr, es, de, hi, ru, ja, zhCN, ko, th } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { sanitizeForDisplay } from '../utils/sanitize';
import html2canvas from 'html2canvas';
import { DailyReport } from './DailyReport';
import { Skeleton } from './ui/Skeleton';
import { PullToRefresh } from './ui/PullToRefresh';

const locales: Record<string, any> = {
  'en': enUS,
  'pt-BR': ptBR,
  'fr': fr,
  'es': es,
  'de': de,
  'hi': hi,
  'ru': ru,
  'ja': ja,
  'zh': zhCN,
  'ko': ko,
  'th': th,
};

interface HistoryProps {
  sales: Sale[];
  cashMovements: CashMovement[];
  goals: Goal[];
  sellers: Seller[];
}

export const History: React.FC<HistoryProps> = ({ sales, cashMovements, goals, sellers }) => {
  const { t, formatCurrency, language } = useLanguage();
  const currentLocale = locales[language] || enUS;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
  };
  
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'credit': return CreditCard;
      case 'debit': return Smartphone;
      case 'pix': return QrCode;
      case 'payment-link': return LinkIcon;
      case 'exchange-voucher': return Ticket;
      default: return Banknote;
    }
  };

  const dailySummaries = sales.reduce((acc, sale) => {
    const date = sale.timestamp?.toDate() || new Date();
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: date,
        total: 0,
        methods: { cash: 0, credit: 0, debit: 0, pix: 0, 'payment-link': 0, 'exchange-voucher': 0 },
        salesCount: 0
      };
    }
    acc[dateKey].total += sale.amount;
    
    if (sale.payments && sale.payments.length > 0) {
      sale.payments.forEach(p => {
        acc[dateKey].methods[p.method] = (acc[dateKey].methods[p.method] || 0) + p.amount;
      });
    } else {
      acc[dateKey].methods[sale.paymentMethod] = (acc[dateKey].methods[sale.paymentMethod] || 0) + sale.amount;
    }

    acc[dateKey].salesCount += 1;
    return acc;
  }, {} as Record<string, { date: Date, total: number, methods: Record<string, number>, salesCount: number }>);

  const sortedSummaries = Object.values(dailySummaries).sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const handleDeleteSale = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteDoc(doc(db, 'sales', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (summary: any) => {
    const date = format(summary.date, 'EEEE, dd MMMM yyyy', { locale: currentLocale });
    const total = formatCurrency(summary.total);
    
    let methodsText = '';
    Object.entries(summary.methods).forEach(([method, amount]) => {
      if (amount as number > 0) {
        methodsText += `\n- ${t(method)}: ${formatCurrency(amount as number)}`;
      }
    });

    const shareText = `*${t('summary')} - ${date}*\n${methodsText}\n\n*${t('grandTotal')}: ${total}*`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t('summary')} - ${date}`,
          text: shareText,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert(t('share') + ' (Clipboard)');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 space-y-6 pb-24">
        {loading ? (
          <div className="space-y-6">
            <header className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-8 w-32 rounded-lg" variant="dark" />
              </div>
            </header>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" variant="dark" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-8 w-24 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(j => (
                      <Skeleton key={j} className="h-12 w-full rounded-2xl" />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-12 flex-1 rounded-xl" />
                    <Skeleton className="h-12 flex-1 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-2">
                <h2 className="m3-headline-small">{t('history')}</h2>
              </div>
            </header>

            <div className="space-y-6">
              <AnimatePresence>
                {selectedSummary && (
                  <DailyReport 
                    date={selectedSummary.date}
                    sales={sales.filter(s => isSameDay(s.timestamp?.toDate() || new Date(), selectedSummary.date))}
                    cashMovements={cashMovements.filter(m => isSameDay(m.timestamp?.toDate() || new Date(), selectedSummary.date))}
                    goal={goals[0]} // Using first goal as default
                    sellers={sellers}
                    onBack={() => setSelectedSummary(null)}
                    onDeleteSale={handleDeleteSale}
                  />
                )}
              </AnimatePresence>

              {sortedSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                  <AlertCircle size={48} className="opacity-20" />
                  <p className="m3-label-large">{t('noSalesFound')}</p>
                </div>
              ) : (
                sortedSummaries.map((summary) => (
                  <motion.div 
                    key={summary.date.toISOString()} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedSummary(summary)}
                    className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] space-y-6 shadow-lg cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="m3-title-large tracking-tight">
                          {format(summary.date, 'EEEE, dd', { locale: currentLocale })}
                        </h3>
                        <p className="m3-label-small text-slate-500 tracking-widest">
                          {format(summary.date, 'MMMM yyyy', { locale: currentLocale })} • {summary.salesCount} {t('salesToday')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="m3-headline-small text-primary">{formatCurrency(summary.total)}</p>
                        <p className="m3-label-small text-slate-500 tracking-widest">{t('grandTotal')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(summary.methods).map(([method, amount]) => {
                        const Icon = getMethodIcon(method);
                        if (amount === 0) return null;
                        return (
                          <div key={method} className="bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-white/5">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="m3-label-small text-slate-500 tracking-tight">{t(method)}</p>
                              <p className="m3-title-small">{formatCurrency(amount)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSummary(summary);
                        }}
                        className="flex-1 py-3 rounded-xl border border-primary/20 text-primary m3-label-medium tracking-widest hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText size={14} />
                        {t('pdf')}
                      </button>
                      <button 
                        onClick={() => handleShare(summary)}
                        className="flex-1 py-3 rounded-xl border border-primary/20 text-primary m3-label-medium tracking-widest hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 size={14} />
                        {t('share')}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
};
