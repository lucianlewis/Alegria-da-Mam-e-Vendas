import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, HelpCircle, CheckCircle, Camera, Loader2, Sparkles } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeReceipt, generateSalesMotivationImage } from '../services/geminiService';
import { PaymentMethod } from '../types';

interface NewSaleProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const NewSale: React.FC<NewSaleProps> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [motivationImage, setMotivationImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!amount || !auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'sales'), {
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'Unknown',
        amount: parseFloat(amount),
        paymentMethod,
        timestamp: serverTimestamp(),
      });

      // Generate motivational image for high sales
      if (parseFloat(amount) > 100) {
        // Check for API key for image generation
        if (typeof window !== 'undefined' && window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await window.aistudio.openSelectKey();
          }
        }
        const img = await generateSalesMotivationImage(`A celebration for a $${amount} sale!`);
        if (img) setMotivationImage(img);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save sale", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-background-dark p-4 border-b border-white/5">
        <button onClick={onBack} className="text-white flex size-10 items-center justify-center hover:bg-white/5 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 ml-2">New Sale</h1>
        <button className="text-primary flex size-10 items-center justify-center">
          <HelpCircle size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Sparkles size={16} /> AI Assistant
            </h3>
            <p className="text-xs text-slate-400">Scan a receipt to auto-fill the form</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {analyzing ? 'Analyzing...' : 'Scan'}
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
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">Sale Details</h2>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'credit', 'debit', 'pix'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as PaymentMethod)}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-bold capitalize transition-all",
                      paymentMethod === method 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-white/5 border-white/10 text-slate-400"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 pl-10 pr-4 text-2xl font-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Achievement Unlocked!</h3>
            <img src={motivationImage} className="w-full rounded-2xl shadow-2xl border border-white/10" alt="Motivational" />
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-background-dark/80 backdrop-blur-md border-t border-white/5">
        <button
          onClick={handleSubmit}
          disabled={loading || !amount}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {loading ? 'Saving...' : 'Confirm Sale'}
        </button>
      </footer>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
