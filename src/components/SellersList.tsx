import React from 'react';
import { motion } from 'motion/react';
import { User, Plus, ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { Seller } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SellersListProps {
  sellers: Seller[];
  onBack: () => void;
  onAddSeller: () => void;
  onEditSeller: (seller: Seller) => void;
}

export const SellersList: React.FC<SellersListProps> = ({ sellers, onBack, onAddSeller, onEditSeller }) => {
  const { t } = useLanguage();
  
  return (
    <div className="p-4 space-y-6 min-h-screen bg-background-dark">
      <header className="flex items-center justify-between py-2">
        <button onClick={onBack} className="text-white flex size-10 items-center justify-center hover:bg-white/5 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold tracking-tight">{t('sellers')}</h2>
        <div className="size-10"></div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">{t('teamMembers')}</h3>
          <button 
            onClick={onAddSeller}
            className="text-primary text-[10px] font-bold uppercase flex items-center gap-1"
          >
            <Plus size={14} /> {t('addNew')}
          </button>
        </div>

        <div className="space-y-3">
          {sellers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-600">
                <User size={32} />
              </div>
              <p className="text-slate-500 text-sm">{t('noSellersYet')}</p>
              <button 
                onClick={onAddSeller}
                className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold"
              >
                {t('registerFirstSeller')}
              </button>
            </div>
          ) : (
            sellers.map((seller) => (
              <button
                key={seller.id}
                onClick={() => onEditSeller(seller)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 active:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {seller.photoURL ? (
                      <img src={seller.photoURL} className="w-full h-full object-cover" alt={seller.name} />
                    ) : (
                      <User size={24} className="text-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold">{seller.name}</h4>
                    <p className="text-[10px] text-slate-500">{t('goal')}: ${seller.goal.toLocaleString()}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
