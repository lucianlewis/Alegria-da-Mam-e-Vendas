import React from 'react';
import { motion } from 'motion/react';
import { Banknote, CreditCard, Smartphone, QrCode, User as UserIcon, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Sale, Seller } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface EntriesProps {
  sales: Sale[];
  sellers: Seller[];
  onViewPerformance: (seller: Seller) => void;
  onViewMethodDetail: (method: string) => void;
}

export const Entries: React.FC<EntriesProps> = ({ sales, sellers, onViewPerformance, onViewMethodDetail }) => {
  const { t, formatCurrency } = useLanguage();
  
  const methodIcons = {
    cash: Banknote,
    credit: CreditCard,
    debit: Smartphone,
    pix: QrCode,
  };

  const totalsByMethod = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 space-y-8">
      <header className="flex items-center justify-center py-2 relative">
        <h2 className="text-lg font-bold">{t('entries')}</h2>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('totalsByPaymentMethod')}</h3>
          <span className="text-slate-500 text-[10px] font-bold uppercase">{t('dailyView')}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {['cash', 'credit', 'debit', 'pix'].map((method) => {
            const Icon = methodIcons[method as keyof typeof methodIcons];
            return (
              <div 
                key={method} 
                onClick={() => onViewMethodDetail(method)}
                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 transition-all cursor-pointer active:scale-[0.98] hover:bg-white/5 group"
              >
                <Icon size={20} className="text-primary group-hover:scale-110 transition-transform" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-tight">{t(method)}</p>
                  <p className="text-xl font-black">{formatCurrency(totalsByMethod[method] || 0)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('sellerPerformance')}</h3>
        <div className="space-y-3">
          {Array.from(new Set(sales.map(s => s.sellerId))).map(sellerId => {
            const sellerSales = sales.filter(s => s.sellerId === sellerId);
            const total = sellerSales.reduce((acc, s) => acc + s.amount, 0);
            const name = sellerSales[0].sellerName;
            
            // Try to find the seller object by ID, then by name
            let seller = sellers.find(s => s.id === sellerId);
            if (!seller) {
              seller = sellers.find(s => s.name === name);
            }
            
            // If still not found, create a virtual seller object
            const displaySeller: Seller = (seller as Seller) || {
              id: sellerId,
              name: name,
              email: '',
              phone: '',
              goal: 0,
              observations: '',
              photoURL: ''
            };
            
            return (
              <div 
                key={sellerId} 
                onClick={() => onViewPerformance(displaySeller)}
                className="flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 transition-all cursor-pointer active:scale-[0.98] hover:bg-white/5 group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{name}</h4>
                    <p className="text-[10px] text-slate-500">{sellerSales.length} {t('salesToday')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-black">{formatCurrency(total)}</p>
                    <div className="flex items-center justify-end gap-1 text-primary text-[10px] font-bold">
                      <TrendingUp size={10} />
                      <span>+15.2%</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-primary transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{t('grandTotal')}</p>
            <h2 className="text-white text-3xl font-black">{formatCurrency(sales.reduce((acc, s) => acc + s.amount, 0))}</h2>
          </div>
          <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            <TrendingUp size={28} />
          </div>
        </div>
      </div>
    </div>
  );
};
