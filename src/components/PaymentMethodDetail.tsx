import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Banknote, CreditCard, Smartphone, QrCode, TrendingUp, TrendingDown, Info, FileText, Trash2, Loader2, Calendar, Clock } from 'lucide-react';
import { Sale, CashMovement, PaymentMethod } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface PaymentMethodDetailProps {
  method: string;
  sales: Sale[];
  cashMovements: CashMovement[];
  onBack: () => void;
}

export const PaymentMethodDetail: React.FC<PaymentMethodDetailProps> = ({ method, sales, cashMovements, onBack }) => {
  const { t, formatCurrency, language, bills: availableBills, coins: availableCoins } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const currentLocale = language === 'pt-BR' ? ptBR : enUS;

  const methodIcons = {
    cash: Banknote,
    credit: CreditCard,
    debit: Smartphone,
    pix: QrCode,
    'payment-link': Smartphone,
    'exchange-voucher': Banknote,
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

  const handlePrint = async () => {
    const date = new Date().toLocaleDateString();
    const total = formatCurrency(totalSales);
    
    let cashBreakdownHtml = '';
    if (method === 'cash') {
      cashBreakdownHtml = `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #ff0080;">
          <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #ff0080; margin-bottom: 16px;">${t('cashBreakdown')}</h2>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #64748b; font-size: 12px;">${t('totalSalesByMethod')}:</span>
            <span style="font-weight: 800; color: #1a1a1a; font-size: 12px;">${formatCurrency(totalSales)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #64748b; font-size: 12px;">${t('totalSangrias')}:</span>
            <span style="font-weight: 800; color: #ef4444; font-size: 12px;">-${formatCurrency(totalSangrias)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <span style="font-weight: 600; color: #64748b; font-size: 12px;">${t('totalReforcos')}:</span>
            <span style="font-weight: 800; color: #10b981; font-size: 12px;">+${formatCurrency(totalReforcos)}</span>
          </div>
          <div style="background: #ff0080; color: white; padding: 12px; border-radius: 12px; text-align: right; font-weight: 900; font-size: 14px;">
            ${t('calculatedCash')}: ${formatCurrency(netCash)}
          </div>
        </div>
      `;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '400px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = "'Inter', sans-serif";

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 48px; height: 48px; background-color: #ff0080; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;"></div>
        <div style="font-weight: 900; font-size: 24px; letter-spacing: -1px; color: #ff0080;">PipBase</div>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px;">${t(method)} - ${t('paymentMethodDetail')}</div>
        <div style="font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 24px;">${date}</div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 600; color: #64748b; font-size: 14px;">${t('totalSales')}:</span>
          <span style="font-weight: 800; color: #1a1a1a; font-size: 14px;">${total}</span>
        </div>
        ${cashBreakdownHtml}
      </div>

      <div style="text-align: center; font-size: 10px; font-weight: 600; color: #94a3b8; margin-top: 40px; text-transform: uppercase; letter-spacing: 1px;">
        ${new Date().toLocaleString()} • PipBase App
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`pipbase-${t('detail').toLowerCase()}-${method}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'sales', id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting sale:', error);
    } finally {
      setIsDeleting(false);
    }
  };
;

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 ml-2">
          {method === 'payment-link' ? t('paymentLink') : 
           method === 'exchange-voucher' ? t('exchangeVoucher') : 
           t(method)} - {t('paymentMethodDetail')}
        </h1>
        <button 
          onClick={handlePrint}
          className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full"
        >
          <FileText size={24} />
        </button>
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
                {availableBills.map(val => {
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
                {availableCoins.map(val => {
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
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-black">{formatCurrency(sale.amount)}</p>
                    <p className="text-[10px] text-slate-500">
                      {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDeleteConfirm(sale.id)}
                    className="text-rose-500 hover:bg-rose-500/10 size-8 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {methodSales.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">{t('noSalesFound')}</p>
            )}
          </div>
        </div>
      </main>

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
            >
              <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{t('confirmDelete')}</h3>
                <p className="text-sm text-slate-500">{t('confirmDeleteSale')}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => handleDeleteSale(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
