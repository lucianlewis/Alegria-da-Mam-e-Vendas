import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, HelpCircle, CheckCircle, Camera, Loader2, Sparkles, Store, MessageCircle, Instagram, Banknote, Plus, Minus, FileUp, Link as LinkIcon, Trash2, CreditCard, Smartphone, QrCode, Ticket } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { analyzeReceipt, generateSalesMotivationImage, analyzeSpreadsheetData } from '../services/geminiService';
import { PaymentMethod, SaleSource, Seller, SalePayment } from '../types';
import { useLanguage, languages } from '../contexts/LanguageContext';

interface NewSaleProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const NewSale: React.FC<NewSaleProps> = ({ onBack, onSuccess }) => {
  const { t, formatCurrency, language, bills, coins } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedSales, setExtractedSales] = useState<any[]>([]);
  const [selectedSalesIndices, setSelectedSalesIndices] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [payments, setPayments] = useState<{ id: string; method: PaymentMethod; amount: string }[]>([
    { id: Math.random().toString(36).substr(2, 9), method: 'cash', amount: '' }
  ]);
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saleTime, setSaleTime] = useState<string>(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [source, setSource] = useState<SaleSource>('physical-store');
  const [sellerId, setSellerId] = useState<string>(auth.currentUser?.uid || '');
  const [sellerName, setSellerName] = useState<string>(auth.currentUser?.displayName || t('unknown'));
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [billQuantities, setBillQuantities] = useState<Record<number, number>>({});
  const [coinQuantities, setCoinQuantities] = useState<Record<number, number>>({});
  const [motivationImage, setMotivationImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);

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
    const cashPayment = payments.find(p => p.method === 'cash');
    if (cashPayment) {
      const billsTotal = Object.entries(billQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
      const coinsTotal = Object.entries(coinQuantities).reduce((acc, [value, qty]) => acc + (Number(value) * qty), 0);
      const total = billsTotal + coinsTotal;
      if (total > 0) {
        setPayments(prev => prev.map(p => 
          p.method === 'cash' ? { ...p, amount: total.toString() } : p
        ));
      }
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
        if (result.amount) {
          const method = (result.paymentMethod?.toLowerCase() as PaymentMethod) || 'cash';
          setPayments([{ id: Math.random().toString(36).substr(2, 9), method, amount: result.amount.toString() }]);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_csv(ws);
        
        const sales = await analyzeSpreadsheetData(data);
        
        if (sales && sales.length > 0) {
          setExtractedSales(sales);
          setSelectedSalesIndices(new Set(sales.map((_: any, i: number) => i)));
          setShowPreview(true);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Spreadsheet extraction failed", error);
    } finally {
      setExtracting(false);
    }
  };

  const handleRegisterExtractedSales = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const selectedSales = extractedSales.filter((_, i) => selectedSalesIndices.has(i));
      
      for (const sale of selectedSales) {
        const saleRef = doc(collection(db, 'sales'));
        
        // Create a proper timestamp from extracted date and time
        const [year, month, day] = sale.date.split('-').map(Number);
        const [hours, minutes] = sale.time.split(':').map(Number);
        const saleDate = new Date(year, month - 1, day, hours, minutes);

        batch.set(saleRef, {
          ...sale,
          sellerId: sellerId || auth.currentUser?.uid,
          sellerName: sale.sellerName || sellerName,
          timestamp: saleDate, // Use the retroactive date
          createdAt: serverTimestamp(), // Keep track of when it was actually added
        });
      }
      
      await batch.commit();
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setLoading(false);
    }
  };

  const toggleSaleSelection = (index: number) => {
    const newSelected = new Set(selectedSalesIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSalesIndices(newSelected);
  };

  const toggleAllSales = () => {
    if (selectedSalesIndices.size === extractedSales.length) {
      setSelectedSalesIndices(new Set());
    } else {
      setSelectedSalesIndices(new Set(extractedSales.map((_, i) => i)));
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const multiAllowed = ['credit', 'debit', 'pix'].includes(method);
    
    setPayments(prev => {
      const existing = prev.find(p => p.method === method);
      
      if (existing) {
        if (multiAllowed) {
          // Add another instance
          return [...prev, { id: Math.random().toString(36).substr(2, 9), method, amount: '' }];
        } else {
          // Toggle off if not multi-allowed and not the last one
          if (prev.length === 1) return prev;
          return prev.filter(p => p.method !== method);
        }
      } else {
        // Add first instance
        return [...prev, { id: Math.random().toString(36).substr(2, 9), method, amount: '' }];
      }
    });
  };

  const removePayment = (id: string) => {
    setPayments(prev => {
      if (prev.length === 1) return prev;
      return prev.filter(p => p.id !== id);
    });
  };

  const updatePaymentAmount = (id: string, amount: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, amount } : p));
  };

  const totalAmount = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  const handleSubmit = async () => {
    if (totalAmount <= 0 || !sellerId) return;

    setLoading(true);
    try {
      const salePayments: SalePayment[] = payments.map(p => {
        const payment: SalePayment = {
          method: p.method,
          amount: parseFloat(p.amount) || 0
        };
        if (p.method === 'cash') {
          const bills: Record<string, number> = {};
          Object.entries(billQuantities).forEach(([val, qty]) => {
            if (qty > 0) bills[val] = qty;
          });
          const coins: Record<string, number> = {};
          Object.entries(coinQuantities).forEach(([val, qty]) => {
            if (qty > 0) coins[val] = qty;
          });
          payment.cashDetails = {
            bills,
            coins,
            total: payment.amount
          };
        }
        return payment;
      }).filter(p => p.amount > 0);

      if (salePayments.length === 0) {
        setLoading(false);
        return;
      }

      const [year, month, day] = saleDate.split('-').map(Number);
      const [hours, minutes] = saleTime.split(':').map(Number);
      const customTimestamp = new Date(year, month - 1, day, hours, minutes);

      const saleData: any = {
        sellerId,
        sellerName,
        amount: totalAmount,
        paymentMethod: salePayments[0].method,
        payments: salePayments,
        source,
        timestamp: customTimestamp,
        createdAt: serverTimestamp(),
      };

      if (salePayments.some(p => p.method === 'cash')) {
        const cashP = salePayments.find(p => p.method === 'cash');
        saleData.cashDetails = cashP?.cashDetails;
      }

      await addDoc(collection(db, 'sales'), saleData);

      // Generate motivational image for high sales
      if (totalAmount > 100) {
        // Check for API key for image generation
        if (typeof window !== 'undefined' && window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await window.aistudio.openSelectKey();
          }
        }
        const img = await generateSalesMotivationImage(`A celebration for a ${formatCurrency(totalAmount)} sale!`);
        if (img) setMotivationImage(img);
      }

      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setLoading(false);
    }
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
        <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
          <button onClick={() => setShowPreview(false)} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex-1 ml-2">{t('extractedSales')}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs font-bold text-slate-500">{t('selectSalesToRegister')}</p>
            <button 
              onClick={toggleAllSales}
              className="text-xs font-bold text-primary"
            >
              {selectedSalesIndices.size === extractedSales.length ? t('deselectAll') : t('selectAll')}
            </button>
          </div>

          <div className="space-y-3">
            {extractedSales.map((sale, index) => (
              <div 
                key={index}
                onClick={() => toggleSaleSelection(index)}
                className={cn(
                  "bg-[var(--card-bg)] border rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]",
                  selectedSalesIndices.has(index) ? "border-primary ring-1 ring-primary" : "border-[var(--border-color)]"
                )}
              >
                <div className={cn(
                  "size-6 rounded-md border-2 flex items-center justify-center transition-colors",
                  selectedSalesIndices.has(index) ? "bg-primary border-primary text-white" : "border-[var(--border-color)]"
                )}>
                  {selectedSalesIndices.has(index) && <CheckCircle size={16} />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">{formatCurrency(sale.amount)}</span>
                    <span className="text-[10px] font-bold text-slate-500">{sale.date} {sale.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--muted-text)] font-bold">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t(sale.paymentMethod)}</span>
                    <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">{t(sale.source)}</span>
                    {sale.sellerName && <span className="text-slate-400">{sale.sellerName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-[var(--bg-color)]/80 backdrop-blur-md border-t border-[var(--border-color)]">
          <button
            onClick={handleRegisterExtractedSales}
            disabled={loading || selectedSalesIndices.size === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
            {loading ? t('saving') : t('registerSales')}
          </button>
        </footer>
      </div>
    );
  }

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
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-primary flex items-center gap-2 tracking-wider">
                <Sparkles size={14} /> {t('aiAssistant')}
              </h3>
              <p className="text-[10px] text-[var(--muted-text)] leading-tight">{t('scanReceipt')}</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="w-full bg-primary text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
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

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-3">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-blue-500 flex items-center gap-2 tracking-wider">
                <FileUp size={14} /> {t('spreadsheet')}
              </h3>
              <p className="text-[10px] text-[var(--muted-text)] leading-tight">{t('uploadSpreadsheet')}</p>
            </div>
            <button 
              onClick={() => spreadsheetInputRef.current?.click()}
              disabled={extracting}
              className="w-full bg-blue-500 text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {extracting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              {extracting ? t('extractingData') : t('upload')}
            </button>
            <input 
              type="file" 
              ref={spreadsheetInputRef} 
              onChange={handleSpreadsheetUpload} 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold tracking-widest text-primary">{t('saleDetails')}</h2>
          
          <div className="space-y-6">
            {/* Seller Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">{t('seller')}</label>
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

            {/* Date and Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">{t('date')}</label>
                <input 
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl h-12 px-4 text-sm font-bold focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">{t('time')}</label>
                <input 
                  type="time"
                  value={saleTime}
                  onChange={(e) => setSaleTime(e.target.value)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl h-12 px-4 text-sm font-bold focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Sale Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">{t('saleSource')}</label>
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
                    <item.icon size={18} className={source === item.id ? "opacity-100" : "opacity-50"} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">{t('paymentMethod')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: t('cash'), icon: Banknote },
                  { id: 'credit', label: t('credit'), icon: CreditCard },
                  { id: 'debit', label: t('debit'), icon: Smartphone },
                  { id: 'pix', label: t('pix'), icon: QrCode },
                  { id: 'payment-link', label: t('paymentLink'), icon: LinkIcon },
                  { id: 'exchange-voucher', label: t('exchangeVoucher'), icon: Ticket },
                ].map((method) => {
                  const isSelected = payments.some(p => p.method === method.id);
                  const count = payments.filter(p => p.method === method.id).length;
                  const multiAllowed = ['credit', 'debit', 'pix'].includes(method.id);

                  return (
                    <button
                      key={method.id}
                      onClick={() => togglePaymentMethod(method.id as PaymentMethod)}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-bold capitalize transition-all",
                        isSelected 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-[var(--card-bg)] border-[var(--border-color)] text-slate-400"
                      )}
                    >
                      <method.icon size={14} className={isSelected ? "opacity-100" : "opacity-50"} />
                      {method.label}
                      {multiAllowed && count > 0 && (
                        <span className="absolute -top-2 -right-2 size-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Inputs */}
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={payment.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      {payment.method === 'cash' && <Banknote size={14} />}
                      {payment.method === 'credit' && <CreditCard size={14} />}
                      {payment.method === 'debit' && <Smartphone size={14} />}
                      {payment.method === 'pix' && <QrCode size={14} />}
                      {payment.method === 'payment-link' && <LinkIcon size={14} />}
                      {payment.method === 'exchange-voucher' && <Ticket size={14} />}
                      {t(payment.method)} {['credit', 'debit', 'pix'].includes(payment.method) && payments.filter(p => p.method === payment.method).length > 1 ? `#${payments.filter(p => p.method === payment.method).indexOf(payment) + 1}` : ''}
                    </label>
                    {payments.length > 1 && (
                      <button 
                        onClick={() => removePayment(payment.id)}
                        className="text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">{currencySymbol}</span>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updatePaymentAmount(payment.id, e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-16 pl-10 pr-4 text-2xl font-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Cash Details Section inside the specific method input area if it's cash */}
                  {payment.method === 'cash' && (
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-4 mt-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Banknote size={18} />
                        <h3 className="text-xs font-bold tracking-wider">{t('cashBreakdown')}</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <p className="text-[10px] font-bold text-slate-500 px-2">{t('bills')}</p>
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

                        <p className="text-[10px] font-bold text-slate-500 px-2 mt-2">{t('coins')}</p>
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
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Summary */}
            {payments.length > 1 && (
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-[var(--muted-text)]">{t('totalAmount')}</span>
                <span className="text-xl font-black text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {motivationImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-bold text-primary tracking-widest">{t('achievementUnlocked')}</h3>
            <img src={motivationImage} className="w-full rounded-2xl shadow-2xl border border-white/10" alt={t('motivationalImage')} referrerPolicy="no-referrer" />
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-[var(--bg-color)]/80 backdrop-blur-md border-t border-[var(--border-color)]">
        <button
          onClick={handleSubmit}
          disabled={loading || totalAmount <= 0}
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
