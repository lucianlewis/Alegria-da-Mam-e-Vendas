import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, TrendingUp, Calendar, Clock, Trash2, Eye, Share2, X, Loader2, Banknote, CreditCard, Smartphone, QrCode, Store, MessageCircle, Instagram, FileText } from 'lucide-react';
import { Seller, Sale } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface SellerPerformanceProps {
  seller: Seller;
  onBack: () => void;
}

export const SellerPerformance: React.FC<SellerPerformanceProps> = ({ seller, onBack }) => {
  const { t, formatCurrency, language } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const currentLocale = language === 'pt-BR' ? ptBR : enUS;

  useEffect(() => {
    const q = query(
      collection(db, 'sales'),
      where('sellerId', '==', seller.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
      setSales(salesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [seller.id]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setShowConfirm(null);
    try {
      await deleteDoc(doc(db, 'sales', id));
    } catch (error) {
      console.error("Error deleting sale:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = async (sale: Sale) => {
    const date = sale.timestamp ? format(sale.timestamp.toDate(), 'PPP HH:mm:ss', { locale: currentLocale }) : '--';
    const amount = formatCurrency(sale.amount);
    const sellerName = seller.name;
    const method = t(sale.paymentMethod);
    const source = t(sale.source.replace('-', ' '));

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
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">${t('viewSale')}</div>
        <div style="font-size: 36px; font-weight: 900; color: #ff0080; margin-bottom: 24px;">${amount}</div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">${t('seller')}</div>
            <div style="font-size: 14px; font-weight: 700; color: #1a1a1a;">${sellerName}</div>
          </div>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">${t('day')}</div>
            <div style="font-size: 14px; font-weight: 700; color: #1a1a1a;">${date.split(' ')[0]} ${date.split(' ')[1]}</div>
          </div>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">${t('paymentMethod')}</div>
            <div style="font-size: 14px; font-weight: 700; color: #1a1a1a;">${method}</div>
          </div>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">${t('saleSource')}</div>
            <div style="font-size: 14px; font-weight: 700; color: #1a1a1a;">${source}</div>
          </div>
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; font-weight: 600; color: #94a3b8; margin-top: 40px; text-transform: uppercase; letter-spacing: 1px;">
        ${new Date().toLocaleString()} • PipBase
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
      pdf.save(`pipbase-${t('sale').toLowerCase()}-${sale.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(container);
    }
  };
;

  const handleShare = async (sale: Sale) => {
    const date = sale.timestamp ? format(sale.timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: currentLocale }) : '--';
    const amount = formatCurrency(sale.amount);
    const text = `*${t('saleDetails')}*\n\n` +
                 `*${t('seller')}:* ${seller.name}\n` +
                 `*${t('amount')}:* ${amount}\n` +
                 `*${t('paymentMethod')}:* ${t(sale.paymentMethod)}\n` +
                 `*${t('saleSource')}:* ${t(sale.source.replace('-', ' '))}\n` +
                 `*${t('day')}:* ${date}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('saleDetails'),
          text: text,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert(t('copiedToClipboard'));
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  const totalSales = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const progress = Math.min(100, (totalSales / seller.goal) * 100);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'credit': return CreditCard;
      case 'debit': return CreditCard;
      case 'pix': return QrCode;
      default: return Smartphone;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return MessageCircle;
      case 'instagram': return Instagram;
      default: return Store;
    }
  };

  return (
    <div className="p-4 space-y-6 min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
      <header className="flex items-center justify-between py-2">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold tracking-tight">{t('sellerPerformance')}</h2>
        <div className="size-10"></div>
      </header>

      {/* Seller Header */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {seller.photoURL ? (
              <img src={seller.photoURL} className="w-full h-full object-cover" alt={seller.name} />
            ) : (
              <User size={32} className="text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">{seller.name}</h3>
            <p className="text-xs text-slate-500">{t('goal')}: {formatCurrency(seller.goal)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-500">{t('progress')}</span>
            <span className="text-primary">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>
          <div className="flex justify-between items-end pt-1">
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-500 uppercase font-bold">{t('totalSales')}</p>
              <p className="text-xl font-black">{formatCurrency(totalSales)}</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">{t('salesHistory')}</h3>
        
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--border-color)]">
              <p className="text-slate-500 text-sm">{t('noSalesFound')}</p>
            </div>
          ) : (
            sales.map((sale) => {
              const MethodIcon = getMethodIcon(sale.paymentMethod);
              const SourceIcon = getSourceIcon(sale.source);
              
              return (
                <motion.div
                  layout
                  key={sale.id}
                  className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <SourceIcon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{formatCurrency(sale.amount)}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Calendar size={10} />
                          <span>{sale.timestamp ? format(sale.timestamp.toDate(), 'dd MMM', { locale: currentLocale }) : '--'}</span>
                          <span className="opacity-30">•</span>
                          <Clock size={10} />
                          <span>{sale.timestamp ? format(sale.timestamp.toDate(), 'HH:mm') : '--'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="text-primary hover:bg-primary/10 size-8 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => sale.id && setShowConfirm(sale.id)}
                        disabled={deletingId === sale.id}
                        className="text-rose-500 hover:bg-rose-500/10 size-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        {deletingId === sale.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showConfirm === sale.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-3 mt-2">
                          <p className="text-[10px] font-bold text-rose-500 uppercase text-center">{t('confirmDelete')}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowConfirm(null)}
                              className="flex-1 bg-white/10 py-2 rounded-lg text-[10px] font-bold uppercase"
                            >
                              {t('cancel')}
                            </button>
                            <button 
                              onClick={() => sale.id && handleDelete(sale.id)}
                              className="flex-1 bg-rose-500 text-white py-2 rounded-lg text-[10px] font-bold uppercase"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSale(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-[var(--card-bg)] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-[var(--border-color)]"
            >
              <div className="p-6 space-y-6">
                <header className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{t('viewSale')}</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePrint(selectedSale)}
                      className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <FileText size={18} />
                    </button>
                    <button 
                      onClick={() => handleShare(selectedSale)}
                      className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={() => setSelectedSale(null)}
                      className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </header>

                  <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)]">
                    <span className="text-xs font-bold text-slate-500 uppercase">{t('amount')}</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(selectedSale.amount)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{t('paymentMethod')}</p>
                      <div className="flex items-center gap-2">
                        {React.createElement(getMethodIcon(selectedSale.paymentMethod), { size: 14, className: "text-primary" })}
                        <span className="text-xs font-bold capitalize">{t(selectedSale.paymentMethod)}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{t('saleSource')}</p>
                      <div className="flex items-center gap-2">
                        {React.createElement(getSourceIcon(selectedSale.source), { size: 14, className: "text-primary" })}
                        <span className="text-xs font-bold capitalize">{t(selectedSale.source.replace('-', ' '))}</span>
                      </div>
                    </div>
                  </div>

                  {selectedSale.cashDetails && (
                    <div className="p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{t('cashBreakdown')}</p>
                      
                      {selectedSale.cashDetails.bills && Object.keys(selectedSale.cashDetails.bills).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">{t('bills')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedSale.cashDetails.bills)
                              .sort((a, b) => Number(b[0]) - Number(a[0]))
                              .map(([val, qty]) => (
                                <div key={val} className="flex justify-between text-[11px] bg-slate-100 dark:bg-white/10 p-2 rounded-lg">
                                  <span>{formatCurrency(Number(val))}</span>
                                  <span className="font-bold">x{qty}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {selectedSale.cashDetails.coins && Object.keys(selectedSale.cashDetails.coins).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">{t('coins')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedSale.cashDetails.coins)
                              .sort((a, b) => Number(b[0]) - Number(a[0]))
                              .map(([val, qty]) => (
                                <div key={val} className="flex justify-between text-[11px] bg-slate-100 dark:bg-white/10 p-2 rounded-lg">
                                  <span>{formatCurrency(Number(val))}</span>
                                  <span className="font-bold">x{qty}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center pt-2">
                    <Calendar size={12} />
                    <span>{selectedSale.timestamp ? format(selectedSale.timestamp.toDate(), 'PPP', { locale: currentLocale }) : '--'}</span>
                    <span className="opacity-30">•</span>
                    <Clock size={12} />
                    <span>{selectedSale.timestamp ? format(selectedSale.timestamp.toDate(), 'HH:mm:ss') : '--'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
