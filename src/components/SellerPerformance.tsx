import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, TrendingUp, Calendar, Clock, Trash2, Eye, Printer, Share2, X, Loader2, Banknote, CreditCard, Smartphone, QrCode, Store, MessageCircle, Instagram } from 'lucide-react';
import { Seller, Sale } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

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
                    <button className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Printer size={18} />
                    </button>
                    <button className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={() => setSelectedSale(null)}
                      className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </header>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase">{t('amount')}</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(selectedSale.amount)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{t('paymentMethod')}</p>
                      <div className="flex items-center gap-2">
                        {React.createElement(getMethodIcon(selectedSale.paymentMethod), { size: 14, className: "text-primary" })}
                        <span className="text-xs font-bold capitalize">{selectedSale.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{t('saleSource')}</p>
                      <div className="flex items-center gap-2">
                        {React.createElement(getSourceIcon(selectedSale.source), { size: 14, className: "text-primary" })}
                        <span className="text-xs font-bold capitalize">{selectedSale.source.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {selectedSale.cashDetails && (
                    <div className="p-4 bg-white/5 rounded-2xl space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{t('cashBreakdown')}</p>
                      
                      {selectedSale.cashDetails.bills && Object.keys(selectedSale.cashDetails.bills).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">{t('bills')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedSale.cashDetails.bills)
                              .sort((a, b) => Number(b[0]) - Number(a[0]))
                              .map(([val, qty]) => (
                                <div key={val} className="flex justify-between text-[11px] bg-white/5 p-2 rounded-lg">
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
                                <div key={val} className="flex justify-between text-[11px] bg-white/5 p-2 rounded-lg">
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
