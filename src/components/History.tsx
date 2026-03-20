import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Download, Printer, ChevronDown, Trash2, Calendar, Clock, User, CreditCard, Banknote, Smartphone, QrCode, Store, MessageCircle, Instagram, AlertCircle, Loader2 } from 'lucide-react';
import { Sale } from '../types';
import { format } from 'date-fns';
import { enUS, ptBR, fr, es, de, hi, ru, ja, zhCN, ko, th } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

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
}

export const History: React.FC<HistoryProps> = ({ sales }) => {
  const { t, formatCurrency, language } = useLanguage();
  const currentLocale = locales[language] || enUS;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'credit': return CreditCard;
      case 'debit': return Smartphone;
      case 'pix': return QrCode;
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
        methods: { cash: 0, credit: 0, debit: 0, pix: 0 },
        salesCount: 0
      };
    }
    acc[dateKey].total += sale.amount;
    acc[dateKey].methods[sale.paymentMethod] += sale.amount;
    acc[dateKey].salesCount += 1;
    return acc;
  }, {} as Record<string, { date: Date, total: number, methods: Record<string, number>, salesCount: number }>);

  const sortedSummaries = Object.values(dailySummaries).sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between py-2">
          <h2 className="text-xl font-bold tracking-tight">{t('history')}</h2>
        </div>
      </header>

      <div className="space-y-6">
        {sortedSummaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
            <AlertCircle size={48} className="opacity-20" />
            <p className="text-sm font-bold">{t('noSalesFound')}</p>
          </div>
        ) : (
          sortedSummaries.map((summary) => (
            <motion.div 
              key={summary.date.toISOString()} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] space-y-6 shadow-lg"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight">
                    {format(summary.date, 'EEEE, dd', { locale: currentLocale })}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {format(summary.date, 'MMMM yyyy', { locale: currentLocale })} • {summary.salesCount} {t('salesToday')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{formatCurrency(summary.total)}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('grandTotal')}</p>
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
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{t(method)}</p>
                        <p className="text-sm font-black">{formatCurrency(amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="w-full py-3 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                <Download size={14} />
                {t('print')} {t('cashBreakdown')}
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
