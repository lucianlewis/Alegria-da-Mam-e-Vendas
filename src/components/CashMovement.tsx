import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle, Loader2, Banknote, Plus, Minus } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CashMovementType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CashMovementProps {
  type: CashMovementType;
  onBack: () => void;
  onSuccess: () => void;
}

export const CashMovement: React.FC<CashMovementProps> = ({ type, onBack, onSuccess }) => {
  const { t, formatCurrency, bills, coins } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [billQuantities, setBillQuantities] = useState<Record<number, number>>({});
  const [coinQuantities, setCoinQuantities] = useState<Record<number, number>>({});

  // Update amount when bill/coin quantities change
  useEffect(() => {
    const billsTotal = Object.entries(billQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
    const coinsTotal = Object.entries(coinQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
    const total = billsTotal + coinsTotal;
    if (total > 0) {
      setAmount(total.toString());
    }
  }, [billQuantities, coinQuantities]);

  const handleBillChange = (value: number, delta: number) => {
    setBillQuantities(prev => ({
      ...prev,
      [value]: Math.max(0, (prev[value] || 0) + delta)
    }));
  };

  const handleCoinChange = (value: number, delta: number) => {
    setCoinQuantities(prev => ({
      ...prev,
      [value]: Math.max(0, (prev[value] || 0) + delta)
    }));
  };

  const handleSubmit = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      const bills: Record<string, number> = {};
      Object.entries(billQuantities).forEach(([val, qty]) => {
        if (qty > 0) bills[val] = qty;
      });
      const coins: Record<string, number> = {};
      Object.entries(coinQuantities).forEach(([val, qty]) => {
        if (qty > 0) coins[val] = qty;
      });

      const movementData = {
        type,
        amount: parseFloat(amount),
        observation,
        timestamp: serverTimestamp(),
        cashDetails: {
          bills,
          coins,
          total: parseFloat(amount)
        },
        userId: auth.currentUser?.uid || 'unknown',
        userName: auth.currentUser?.displayName || t('unknown')
      };

      await addDoc(collection(db, 'cashMovements'), movementData);
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cashMovements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2 capitalize">{type === 'sangria' ? t('bleed') : t('reinforcement')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="m3-label-medium text-slate-500">{t('amount')}</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('amountPlaceholder')}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-16 px-4 m3-headline-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="m3-label-medium text-slate-500">{t('observation')}</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={t('addNotes')}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 m3-body-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none"
            />
          </div>

          {/* Cash Details Section */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Banknote size={18} />
              <h3 className="m3-label-small tracking-wider">{t('cashBreakdown')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <p className="m3-label-small text-slate-500 px-2">{t('bills')}</p>
              {bills.map(val => (
                <div key={val} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                  <span className="m3-title-small">{formatCurrency(val)}</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleBillChange(val, -1)}
                      className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center m3-title-medium">{billQuantities[val] || 0}</span>
                    <button 
                      onClick={() => handleBillChange(val, 1)}
                      className="size-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <p className="m3-label-small text-slate-500 px-2 mt-2">{t('coins')}</p>
              {coins.map(val => (
                <div key={val} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                  <span className="m3-title-small">{formatCurrency(val)}</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleCoinChange(val, -1)}
                      className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center m3-title-medium">{coinQuantities[val] || 0}</span>
                    <button 
                      onClick={() => handleCoinChange(val, 1)}
                      className="size-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-[var(--bg-color)]/80 backdrop-blur-md border-t border-[var(--border-color)]">
        <button
          onClick={handleSubmit}
          disabled={loading || !amount}
          className="w-full bg-primary hover:bg-primary/90 text-white m3-label-large py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {loading ? t('saving') : t('confirm')}
        </button>
      </footer>
    </div>
  );
};
