import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Banknote, CreditCard, Smartphone, QrCode, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Sale, CashMovement, PaymentMethod } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PaymentMethodDetailProps {
  method: string;
  sales: Sale[];
  cashMovements: CashMovement[];
  onBack: () => void;
}

const BILL_VALUES = [200, 100, 50, 20, 10, 5, 2];
const COIN_VALUES = [1, 0.50, 0.25, 0.10, 0.05];

export const PaymentMethodDetail: React.FC<PaymentMethodDetailProps> = ({ method, sales, cashMovements, onBack }) => {
  const { t, formatCurrency } = useLanguage();

  const methodIcons = {
    cash: Banknote,
    credit: CreditCard,
    debit: Smartphone,
    pix: QrCode,
  };

  const Icon = methodIcons[method as keyof typeof methodIcons] || Info;

  const methodSales = sales.filter(s => s.paymentMethod === method);
  const totalSales = methodSales.reduce((acc, s) => acc + s.amount, 0);

  // Cash specific calculations
  const sangrias = cashMovements.filter(m => m.type === 'sangria');
  const reforcos = cashMovements.filter(m => m.type === 'reforco');

  const totalSangrias = sangrias.reduce((acc, m) => acc + m.amount, 0);
  const totalReforcos = reforcos.reduce((acc, m) => acc + m.amount, 0);

  const netCash = totalSales - totalSangrias + totalReforcos;

  // Aggregate cash breakdown
  const aggregateCash = () => {
    const bills: Record<string, number> = {};
    const coins: Record<string, number> = {};

    // Add from sales
    methodSales.forEach(sale => {
      if (sale.cashDetails) {
        Object.entries(sale.cashDetails.bills).forEach(([val, qty]) => {
          bills[val] = (bills[val] || 0) + qty;
        });
        Object.entries(sale.cashDetails.coins).forEach(([val, qty]) => {
          coins[val] = (coins[val] || 0) + qty;
        });
      }
    });

    // Add from reforcos
    reforcos.forEach(m => {
      if (m.cashDetails) {
        Object.entries(m.cashDetails.bills).forEach(([val, qty]) => {
          bills[val] = (bills[val] || 0) + qty;
        });
        Object.entries(m.cashDetails.coins).forEach(([val, qty]) => {
          coins[val] = (coins[val] || 0) + qty;
        });
      }
    });

    // Subtract from sangrias
    sangrias.forEach(m => {
      if (m.cashDetails) {
        Object.entries(m.cashDetails.bills).forEach(([val, qty]) => {
          bills[val] = (bills[val] || 0) - qty;
        });
        Object.entries(m.cashDetails.coins).forEach(([val, qty]) => {
          coins[val] = (coins[val] || 0) - qty;
        });
      }
    });

    return { bills, coins };
  };

  const { bills, coins } = aggregateCash();

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 ml-2">{t(method)} - {t('paymentMethodDetail')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Summary Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 space-y-4 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 text-primary">
            <Icon size={24} />
            <h2 className="text-xs font-bold uppercase tracking-widest">{t('summary')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
              <span className="text-sm font-bold text-slate-500">{t('totalSalesByMethod')}</span>
              <span className="text-lg font-black">{formatCurrency(totalSales)}</span>
            </div>

            {method === 'cash' && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                  <span className="text-sm font-bold text-slate-500">{t('totalSangrias')}</span>
                  <span className="text-lg font-black text-red-500">-{formatCurrency(totalSangrias)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                  <span className="text-sm font-bold text-slate-500">{t('totalReforcos')}</span>
                  <span className="text-lg font-black text-emerald-500">+{formatCurrency(totalReforcos)}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm font-black text-primary uppercase tracking-wider">{t('calculatedCash')}</span>
                  <span className="text-2xl font-black text-primary">{formatCurrency(netCash)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cash Breakdown (Only for Cash) */}
        {method === 'cash' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Banknote size={18} className="text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('cashBreakdown')}</h3>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-[var(--border-color)]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('bills')}</p>
              </div>
              <div className="divide-y divide-[var(--border-color)]/30">
                {BILL_VALUES.map(val => {
                  const qty = bills[val.toString()] || 0;
                  return (
                    <div key={val} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {val}
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(val)}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-slate-500">x{qty}</span>
                        <span className="text-sm font-black w-20 text-right">{formatCurrency(val * qty)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-white/5 border-y border-[var(--border-color)]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('coins')}</p>
              </div>
              <div className="divide-y divide-[var(--border-color)]/30">
                {COIN_VALUES.map(val => {
                  const qty = coins[val.toString()] || 0;
                  return (
                    <div key={val} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px]">
                          {val}
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(val)}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-slate-500">x{qty}</span>
                        <span className="text-sm font-black w-20 text-right">{formatCurrency(val * qty)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-6 bg-primary/5 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-primary">{t('total')}</span>
                <span className="text-xl font-black text-primary">{formatCurrency(netCash)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sales List for this method */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary px-2">{t('recentSales')}</h3>
          <div className="space-y-3">
            {methodSales.map((sale, idx) => (
              <div key={sale.id || idx} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{sale.sellerName}</p>
                    <p className="text-[10px] text-slate-500">{t(sale.source)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatCurrency(sale.amount)}</p>
                  <p className="text-[10px] text-slate-500">
                    {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}
            {methodSales.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">{t('noSalesFound')}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
