import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, HelpCircle, CheckCircle, Camera, Loader2, Sparkles, Store, MessageCircle, Instagram, Banknote, Plus, Minus } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { analyzeReceipt, generateSalesMotivationImage } from '../services/geminiService';
import { PaymentMethod, SaleSource, Seller } from '../types';
import { useLanguage, languages } from '../contexts/LanguageContext';

interface NewSaleProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const NewSale: React.FC<NewSaleProps> = ({ onBack, onSuccess }) => {
  const { t, formatCurrency, language, bills, coins } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [source, setSource] = useState<SaleSource>('physical-store');
  const [sellerId, setSellerId] = useState<string>(auth.currentUser?.uid || '');
  const [sellerName, setSellerName] = useState<string>(auth.currentUser?.displayName || t('unknown'));
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [billQuantities, setBillQuantities] = useState<Record<number, number>>({});
  const [coinQuantities, setCoinQuantities] = useState<Record<number, number>>({});
  const [motivationImage, setMotivationImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSellers = async () => {
      const q = query(collection(db, 'sellers'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const sellersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      setSellers(sellersList);
      
      // If current user is a seller, pre-select them
      const currentSeller = sellersList.find(s => s.id === auth.currentUser?.uid);
      if (currentSeller) {
        setSellerId(currentSeller.id!);
        setSellerName(currentSeller.name);
      }
    };
    fetchSellers();
  }, []);

  // Update amount when bill/coin quantities change
  useEffect(() => {
    if (paymentMethod === 'cash') {
      const billsTotal = Object.entries(billQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
      const coinsTotal = Object.entries(coinQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
      const total = billsTotal + coinsTotal;
      if (total > 0) {
        setAmount(total.toString());
      }
    }
  }, [billQuantities, coinQuantities, paymentMethod]);

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

  const currencySymbol = languages.find(l => l.code === language)?.flag === '🇺🇸' ? '$' : 
                   languages.find(l => l.code === language)?.currency === 'USD' ? '$' :
                   new Intl.NumberFormat(languages.find(l => l.code === language)?.locale || 'en-US', {
                     style: 'currency',
                     currency: languages.find(l => l.code === language)?.currency || 'USD',
                   }).format(0).replace(/\d/g, '').replace(/[.,]/g, '').trim();

  const handleAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeReceipt(base64);
        if (result.amount) setAmount(result.amount.toString());
        if (result.paymentMethod) setPaymentMethod(result.paymentMethod.toLowerCase() as PaymentMethod);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !sellerId) return;

    setLoading(true);
    try {
      const saleData: any = {
        sellerId,
        sellerName,
        amount: parseFloat(amount),
        paymentMethod,
        source,
        timestamp: serverTimestamp(),
      };

      if (paymentMethod === 'cash') {
        const bills: Record<string, number> = {};
        Object.entries(billQuantities).forEach(([val, qty]) => {
          if (qty > 0) bills[val] = qty;
        });
        const coins: Record<string, number> = {};
        Object.entries(coinQuantities).forEach(([val, qty]) => {
          if (qty > 0) coins[val] = qty;
        });
        saleData.cashDetails = {
          bills,
          coins,
          total: parseFloat(amount)
        };
      }

      await addDoc(collection(db, 'sales'), saleData);

      // Generate motivational image for high sales
      if (parseFloat(amount) > 100) {
        // Check for API key for image generation
        if (typeof window !== 'undefined' && window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await window.aistudio.openSelectKey();
          }
        }
        const img = await generateSalesMotivationImage(`A celebration for a ${formatCurrency(parseFloat(amount))} sale!`);
        if (img) setMotivationImage(img);
      }

      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
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
        <h1 className="text-xl font-bold flex-1 ml-2">{t('newSale')}</h1>
        <button className="text-primary flex size-10 items-center justify-center">
          <HelpCircle size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Sparkles size={16} /> {t('aiAssistant')}
            </h3>
            <p className="text-xs text-slate-400">{t('scanReceipt')}</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {analyzing ? t('analyzing') : t('scan')}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAnalyze} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('saleDetails')}</h2>
          
          <div className="space-y-6">
            {/* Seller Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('seller')}</label>
              <select 
                value={sellerId}
                onChange={(e) => {
                  const s = sellers.find(sel => sel.id === e.target.value);
                  setSellerId(e.target.value);
                  if (s) setSellerName(s.name);
                }}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl h-12 px-4 text-sm font-bold focus:border-primary outline-none"
              >
                <option value="">{t('selectSeller')}</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Sale Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('saleSource')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'physical-store', label: t('physicalStore'), icon: Store },
                  { id: 'whatsapp', label: t('whatsapp'), icon: MessageCircle },
                  { id: 'instagram', label: t('instagram'), icon: Instagram },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSource(item.id as SaleSource)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-xl border text-[10px] font-bold transition-all",
                      source === item.id 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-[var(--card-bg)] border-[var(--border-color)] text-slate-400"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('paymentMethod')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: t('cash') },
                  { id: 'credit', label: t('credit') },
                  { id: 'debit', label: t('debit') },
                  { id: 'pix', label: t('pix') },
                  { id: 'payment-link', label: t('paymentLink') },
                  { id: 'exchange-voucher', label: t('exchangeVoucher') },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-bold capitalize transition-all",
                      paymentMethod === method.id 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-[var(--card-bg)] border-[var(--border-color)] text-slate-400"
                    )}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Details Section */}
            <AnimatePresence>
              {paymentMethod === 'cash' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Banknote size={18} />
                      <h3 className="text-xs font-bold uppercase tracking-wider">{t('cashBreakdown')}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase px-2">{t('bills')}</p>
                      {bills.map(val => (
                        <div key={val} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
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
                              className="size-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mt-2">{t('coins')}</p>
                      {coins.map(val => (
                        <div key={val} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
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
                              className="size-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">{t('totalCash')}</span>
                      <span className="text-lg font-black text-primary">
                        {formatCurrency(
                          Object.entries(billQuantities).reduce((acc, [v, q]) => acc + (Number(v) * q), 0) +
                          Object.entries(coinQuantities).reduce((acc, [v, q]) => acc + (Number(v) * q), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('amount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">{currencySymbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('amountPlaceholder')}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-16 pl-10 pr-4 text-2xl font-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {motivationImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">{t('achievementUnlocked')}</h3>
            <img src={motivationImage} className="w-full rounded-2xl shadow-2xl border border-white/10" alt={t('motivationalImage')} />
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-[var(--bg-color)]/80 backdrop-blur-md border-t border-[var(--border-color)]">
        <button
          onClick={handleSubmit}
          disabled={loading || !amount}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {loading ? t('saving') : t('confirmSale')}
        </button>
      </footer>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
