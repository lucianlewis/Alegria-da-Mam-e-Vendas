import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Camera, User, Loader2, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Seller } from '../types';
import { useLanguage, languages } from '../contexts/LanguageContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface EditSellerProps {
  seller?: Seller;
  onBack: () => void;
  onSuccess: () => void;
}

export const EditSeller: React.FC<EditSellerProps> = ({ seller, onBack, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(seller?.name || '');
  const [email, setEmail] = useState(seller?.email || '');
  const [phone, setPhone] = useState(seller?.phone || '');
  const [goal, setGoal] = useState(seller?.goal?.toString() || '');
  const [observations, setObservations] = useState(seller?.observations || '');
  const [photoURL, setPhotoURL] = useState(seller?.photoURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencySymbol = languages.find(l => l.code === language)?.flag === '🇺🇸' ? '$' : 
                   languages.find(l => l.code === language)?.currency === 'USD' ? '$' :
                   new Intl.NumberFormat(languages.find(l => l.code === language)?.locale || 'en-US', {
                     style: 'currency',
                     currency: languages.find(l => l.code === language)?.currency || 'USD',
                   }).format(0).replace(/\d/g, '').replace(/[.,]/g, '').trim();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name || !goal) return;

    setLoading(true);
    const path = seller?.id ? `sellers/${seller.id}` : 'sellers';
    try {
      const sellerData = {
        name,
        email,
        phone,
        goal: parseFloat(goal),
        observations,
        photoURL,
        updatedAt: serverTimestamp(),
      };

      if (seller?.id) {
        await updateDoc(doc(db, 'sellers', seller.id), sellerData);
      } else {
        await addDoc(collection(db, 'sellers'), {
          ...sellerData,
          userId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, seller?.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <X size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 text-center">{seller ? t('editSeller') : t('newSeller')}</h1>
        <button 
          onClick={handleSubmit}
          disabled={loading || !name || !goal}
          className="text-primary flex size-10 items-center justify-center disabled:opacity-50"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-40 rounded-full bg-[var(--card-bg)] border-4 border-[var(--border-color)] overflow-hidden flex items-center justify-center">
              {photoURL ? (
                <img src={photoURL} className="w-full h-full object-cover" alt={t('preview')} />
              ) : (
                <User size={64} className="text-slate-600" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 size-10 bg-primary rounded-full border-4 border-[var(--bg-color)] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="m3-label-small tracking-widest text-slate-500">{t('changePhoto')}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="m3-label-small tracking-widest text-slate-500 px-2">{t('sellerName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fullName')}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 px-4 m3-body-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[var(--text-color)]"
            />
          </div>

          <div className="space-y-2">
            <label className="m3-label-small tracking-widest text-slate-500 px-2">{t('contactPhone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 px-4 m3-body-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[var(--text-color)]"
            />
          </div>

          <div className="space-y-2">
            <label className="m3-label-small tracking-widest text-slate-500 px-2">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 px-4 m3-body-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[var(--text-color)]"
            />
          </div>

          <div className="space-y-2">
            <label className="m3-label-small tracking-widest text-slate-500 px-2">{t('monthlySalesGoal')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary m3-label-large">{currencySymbol}</span>
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('goalPlaceholder')}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-10 pr-4 m3-body-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="m3-label-small tracking-widest text-slate-500 px-2">{t('observations')}</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder={t('observationsPlaceholder')}
              rows={4}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 m3-body-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
};
