import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle, Loader2, Banknote, Plus, Minus, AlertCircle, History as HistoryIcon, Lock, Unlock } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, limit, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { CashSession as CashSessionInterface, Sale, CashMovement } from '../types';
import { useLanguage, languages } from '../contexts/LanguageContext';

interface CashSessionProps {
  currentSession: CashSessionInterface | null;
  allSales: Sale[];
  allMovements: CashMovement[];
  onBack: () => void;
  onSuccess: () => void;
}

export const CashSession: React.FC<CashSessionProps> = ({ 
  currentSession, 
  allSales, 
  allMovements, 
  onBack, 
  onSuccess 
}) => {
  const { t, formatCurrency, language, bills, coins } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [billQuantities, setBillQuantities] = useState<Record<number, number>>({});
  const [coinQuantities, setCoinQuantities] = useState<Record<number, number>>({});
  const [observations, setObservations] = useState('');
  const [history, setHistory] = useState<CashSessionInterface[]>([]);
  const [expectedAmounts, setExpectedAmounts] = useState<Record<string, number>>({
    cash: 0,
    credit: 0,
    debit: 0,
    pix: 0,
    'payment-link': 0,
    'exchange-voucher': 0
  });
  const [mode, setMode] = useState<'opening' | 'closing'>(currentSession ? 'closing' : 'opening');
  const [lastClosedSession, setLastClosedSession] = useState<CashSessionInterface | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // New closing fields
  const [credit, setCredit] = useState<string>('');
  const [debit, setDebit] = useState<string>('');
  const [pix, setPix] = useState<string>('');
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [exchangeVoucher, setExchangeVoucher] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      const q = query(
        collection(db, 'cashSessions'),
        orderBy('openingTimestamp', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const historyList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashSessionInterface));
      setHistory(historyList);
      
      const lastClosed = historyList.find(s => s.status === 'closed');
      if (lastClosed) setLastClosedSession(lastClosed);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (currentSession && mode === 'closing') {
      calculateExpected();
    }
  }, [currentSession, mode, allSales, allMovements]);

  const calculateExpected = () => {
    if (!currentSession || !currentSession.openingTimestamp) return;

    const openingTime = currentSession.openingTimestamp?.toDate?.() || new Date(currentSession.openingTimestamp);
    const openingMillis = openingTime.getTime();

    // Filter sales since opening
    const sessionSales = allSales.filter(sale => {
      const saleTime = sale.timestamp?.toDate?.() || new Date(sale.timestamp);
      return saleTime.getTime() >= openingMillis;
    });
    
    const totalsByMethod: Record<string, number> = {
      cash: 0,
      credit: 0,
      debit: 0,
      pix: 0,
      'payment-link': 0,
      'exchange-voucher': 0
    };

    sessionSales.forEach(sale => {
      totalsByMethod[sale.paymentMethod] = (totalsByMethod[sale.paymentMethod] || 0) + sale.amount;
    });

    // Filter movements since opening
    const sessionMovements = allMovements.filter(m => {
      const mTime = m.timestamp?.toDate?.() || new Date(m.timestamp);
      return mTime.getTime() >= openingMillis;
    });
    
    const totalReforcos = sessionMovements.filter(m => m.type === 'reforco').reduce((acc, m) => acc + m.amount, 0);
    const totalSangrias = sessionMovements.filter(m => m.type === 'sangria').reduce((acc, m) => acc + m.amount, 0);

    const expectedCash = currentSession.openingAmount + totalsByMethod['cash'] + totalReforcos - totalSangrias;
    
    setExpectedAmounts({
      ...totalsByMethod,
      cash: expectedCash
    });
  };

  // Update amount when bill/coin quantities change
  useEffect(() => {
    const billsTotal = Object.entries(billQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
    const coinsTotal = Object.entries(coinQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
    const total = billsTotal + coinsTotal;
    setAmount(total.toString());
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

  const generateHash = async (data: string) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16).toUpperCase();
  };

  const handleSubmit = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      const selectedDate = new Date(sessionDate + 'T' + new Date().toTimeString().split(' ')[0]);
      const bills: Record<string, number> = {};
      Object.entries(billQuantities).forEach(([val, qty]) => {
        if (qty > 0) bills[val] = qty;
      });
      const coins: Record<string, number> = {};
      Object.entries(coinQuantities).forEach(([val, qty]) => {
        if (qty > 0) coins[val] = qty;
      });

      const details = {
        bills,
        coins,
        total: parseFloat(amount),
        credit: mode === 'closing' ? parseFloat(credit || '0') : undefined,
        debit: mode === 'closing' ? parseFloat(debit || '0') : undefined,
        pix: mode === 'closing' ? parseFloat(pix || '0') : undefined,
        paymentLink: mode === 'closing' ? parseFloat(paymentLink || '0') : undefined,
        exchangeVoucher: mode === 'closing' ? parseFloat(exchangeVoucher || '0') : undefined,
      };

      if (mode === 'closing' && currentSession) {
        // Closing session
        const closingTime = selectedDate;
        const timestampCode = closingTime.getTime().toString();
        const totalCash = parseFloat(amount);
        const openingTime = currentSession.openingTimestamp?.toDate?.() || new Date(currentSession.openingTimestamp);
        
        const hashData = `${openingTime.toISOString()}|${closingTime.toISOString()}|${totalCash}|${timestampCode}|${lastClosedSession?.id || 'genesis'}`;
        const transactionHash = await generateHash(hashData);

        const expectedCash = expectedAmounts['cash'] || 0;
        const diff = parseFloat(amount) - expectedCash;
        
        await updateDoc(doc(db, 'cashSessions', currentSession.id!), {
          closingTimestamp: Timestamp.fromDate(selectedDate),
          closingAmount: totalCash,
          closingDetails: details,
          expectedAmount: expectedCash,
          difference: diff,
          status: 'closed',
          observations,
          transactionHash,
          previousSessionId: lastClosedSession?.id || null
        });
      } else if (mode === 'opening' && !currentSession) {
        // Opening session
        await addDoc(collection(db, 'cashSessions'), {
          userId: auth.currentUser?.uid,
          userName: auth.currentUser?.displayName || t('unknown'),
          openingTimestamp: Timestamp.fromDate(selectedDate),
          openingAmount: parseFloat(amount),
          openingDetails: details,
          status: 'open',
          observations,
          previousSessionId: lastClosedSession?.id || null
        });
      }

      onSuccess();
    } catch (error) {
      handleFirestoreError(error, mode === 'closing' ? OperationType.UPDATE : OperationType.CREATE, 'cashSessions');
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
        <h1 className="text-xl font-bold flex-1 ml-2">{mode === 'closing' ? t('closing') : t('opening')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        {/* Mode Selector */}
        <div className="bg-[var(--card-bg)] p-1 rounded-2xl flex gap-1 border border-[var(--border-color)]">
          <button
            onClick={() => setMode('opening')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              mode === 'opening' 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Unlock size={14} />
            {t('opening')}
          </button>
          <button
            onClick={() => setMode('closing')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              mode === 'closing' 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Lock size={14} />
            {t('closing')}
          </button>
        </div>
        
        {/* Date Selector */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-2 flex items-center gap-2">
            {t('sessionDate')}
          </label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[var(--text-color)]"
          />
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Banknote size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">
                {mode === 'closing' ? t('closeCash') : t('openCash')}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                {mode === 'closing' ? t('closingAmount') : t('openingAmount')}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase px-2">{t('bills')}</label>
              <div className="grid grid-cols-1 gap-2">
                {bills.map(val => (
                  <div key={val} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-sm font-bold">{formatCurrency(val)}</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleBillChange(val, -1)}
                        className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-black">{billQuantities[val] || 0}</span>
                      <button 
                        onClick={() => handleBillChange(val, 1)}
                        className="size-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase px-2">{t('coins')}</label>
              <div className="grid grid-cols-1 gap-2">
                {coins.map(val => (
                  <div key={val} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-sm font-bold">{formatCurrency(val)}</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleCoinChange(val, -1)}
                        className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-black">{coinQuantities[val] || 0}</span>
                      <button 
                        onClick={() => handleCoinChange(val, 1)}
                        className="size-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              {mode === 'closing' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                    {t('totalsByPaymentMethod')}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-2 flex justify-between">
                        <span>{t('credit')}</span>
                        {expectedAmounts['credit'] !== undefined && (
                          <span className="text-primary/60 italic lowercase">{t('expected')}: {formatCurrency(expectedAmounts['credit'])}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={credit}
                        onChange={(e) => setCredit(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-2 flex justify-between">
                        <span>{t('debit')}</span>
                        {expectedAmounts['debit'] !== undefined && (
                          <span className="text-primary/60 italic lowercase">{t('expected')}: {formatCurrency(expectedAmounts['debit'])}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={debit}
                        onChange={(e) => setDebit(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-2 flex justify-between">
                        <span>{t('pix')}</span>
                        {expectedAmounts['pix'] !== undefined && (
                          <span className="text-primary/60 italic lowercase">{t('expected')}: {formatCurrency(expectedAmounts['pix'])}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={pix}
                        onChange={(e) => setPix(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-2 flex justify-between">
                        <span>{t('paymentLink')}</span>
                        {expectedAmounts['payment-link'] !== undefined && (
                          <span className="text-primary/60 italic lowercase">{t('expected')}: {formatCurrency(expectedAmounts['payment-link'])}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={paymentLink}
                        onChange={(e) => setPaymentLink(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-2 flex justify-between">
                        <span>{t('exchangeVoucher')}</span>
                        {expectedAmounts['exchange-voucher'] !== undefined && (
                          <span className="text-primary/60 italic lowercase">{t('expected')}: {formatCurrency(expectedAmounts['exchange-voucher'])}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={exchangeVoucher}
                        onChange={(e) => setExchangeVoucher(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'closing' && expectedAmounts['cash'] !== undefined && (
                <div className="bg-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-500">{t('expected')} ({t('cash')})</span>
                    <span className="text-slate-300">{formatCurrency(expectedAmounts['cash'])}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-500">{t('difference')}</span>
                    <span className={parseFloat(amount || '0') - expectedAmounts['cash'] >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {formatCurrency(parseFloat(amount || '0') - expectedAmounts['cash'])}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">{t('totalCash')}</span>
                <span className="text-2xl font-black text-primary">
                  {formatCurrency(parseFloat(amount || '0'))}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-2">{t('observations')}</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder={t('observationsPlaceholder')}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
              <HistoryIcon size={12} /> {t('history')}
            </h3>
            <div className="space-y-2">
              {history.map((session) => (
                <div key={session.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold">
                        {session.status === 'open' ? t('opening') : t('closing')}
                      </p>
                      {session.transactionHash && (
                        <span className="text-[8px] font-mono bg-white/10 px-1 rounded text-slate-400">
                          #{session.transactionHash}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {session.openingTimestamp?.toDate?.().toLocaleDateString() || new Date(session.openingTimestamp).toLocaleDateString()} - {session.userName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">
                      {formatCurrency(session.status === 'open' ? session.openingAmount : session.closingAmount!)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-[var(--bg-color)]/80 backdrop-blur-md border-t border-[var(--border-color)]">
        <button
          onClick={handleSubmit}
          disabled={loading || !amount || (mode === 'closing' && !currentSession) || (mode === 'opening' && !!currentSession)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {loading ? t('saving') : mode === 'closing' ? t('confirmClosing') : t('confirmOpening')}
        </button>
        {(mode === 'closing' && !currentSession) && (
          <p className="text-[10px] text-rose-500 font-bold text-center mt-2 uppercase tracking-tighter">
            {t('noOpenSessionFound')}
          </p>
        )}
        {(mode === 'opening' && !!currentSession) && (
          <p className="text-[10px] text-amber-500 font-bold text-center mt-2 uppercase tracking-tighter">
            {t('sessionAlreadyOpen')}
          </p>
        )}
      </footer>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
