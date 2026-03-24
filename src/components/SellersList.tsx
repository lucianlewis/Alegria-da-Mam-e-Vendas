import React from 'react';
import { motion } from 'motion/react';
import { User, Plus, ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { Seller, Sale } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SellersListProps {
  sellers: Seller[];
  sales: Sale[];
  onBack: () => void;
  onAddSeller: () => void;
  onEditSeller: (seller: Seller) => void;
  onViewPerformance: (seller: Seller) => void;
}

export const SellersList: React.FC<SellersListProps> = ({ sellers, sales, onBack, onAddSeller, onEditSeller, onViewPerformance }) => {
  const { t, formatCurrency } = useLanguage();
  
  const getSellerProgress = (sellerId: string, goal: number) => {
    const now = new Date();
    const sellerSales = sales.filter(sale => {
      const saleDate = sale.timestamp?.toDate() || new Date();
      return sale.sellerId === sellerId && 
             saleDate.getMonth() === now.getMonth() && 
             saleDate.getFullYear() === now.getFullYear();
    });
    
    const totalAmount = sellerSales.reduce((acc, sale) => acc + sale.amount, 0);
    return Math.min(100, (totalAmount / goal) * 100);
  };
  
  return (
    <div className="p-4 space-y-6 min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
      <header className="flex items-center justify-between py-2">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="m3-headline-small tracking-tight">{t('sellers')}</h2>
        <div className="size-10"></div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="m3-label-small tracking-widest text-slate-500 px-2">{t('teamMembers')}</h3>
          <button 
            onClick={onAddSeller}
            className="text-primary m3-label-small flex items-center gap-1"
          >
            <Plus size={14} /> {t('addNew')}
          </button>
        </div>

        <div className="space-y-3">
          {sellers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="size-16 rounded-full bg-[var(--card-bg)] flex items-center justify-center mx-auto text-slate-600">
                <User size={32} />
              </div>
              <p className="text-slate-500 m3-body-medium">{t('noSellersYet')}</p>
              <button 
                onClick={onAddSeller}
                className="bg-primary text-white px-6 py-2 rounded-xl m3-label-medium"
              >
                {t('registerFirstSeller')}
              </button>
            </div>
          ) : (
            sellers.map((seller) => {
              const progress = getSellerProgress(seller.id, seller.goal);
              
              return (
                <div
                  key={seller.id}
                  className="w-full flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 transition-colors hover:bg-white/5 cursor-pointer space-y-3"
                  onClick={() => onViewPerformance(seller)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {seller.photoURL ? (
                          <img src={seller.photoURL} className="w-full h-full object-cover" alt={seller.name} />
                        ) : (
                          <User size={24} className="text-primary" />
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="m3-body-medium">{seller.name}</h4>
                        <p className="m3-label-small text-slate-500">{t('goal')}: {formatCurrency(seller.goal)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg m3-label-small"
                      >
                        {t('performance')}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSeller(seller);
                        }}
                        className="text-slate-400 hover:bg-white/5 size-8 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between m3-label-small tracking-wider">
                      <span className="text-slate-500">{t('monthlyProgress')}</span>
                      <span className="text-primary">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
