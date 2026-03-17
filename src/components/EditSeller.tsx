import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Check, Camera, Trash2, User, Loader2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Seller } from '../types';

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
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(seller?.name || '');
  const [phone, setPhone] = useState(seller?.phone || '');
  const [goal, setGoal] = useState(seller?.goal?.toString() || '');
  const [observations, setObservations] = useState(seller?.observations || '');
  const [photoURL, setPhotoURL] = useState(seller?.photoURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = async () => {
    if (!seller?.id || !window.confirm('Are you sure you want to remove this seller?')) return;

    setLoading(true);
    const path = `sellers/${seller.id}`;
    try {
      await deleteDoc(doc(db, 'sellers', seller.id));
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-background-dark p-4 border-b border-white/5">
        <button onClick={onBack} className="text-white flex size-10 items-center justify-center hover:bg-white/5 rounded-full">
          <X size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center">{seller ? 'Edit Seller' : 'New Seller'}</h1>
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
            <div className="size-40 rounded-full bg-white/10 border-4 border-white/5 overflow-hidden flex items-center justify-center">
              {photoURL ? (
                <img src={photoURL} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <User size={64} className="text-slate-600" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 size-10 bg-primary rounded-full border-4 border-background-dark flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Change Photo</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">Seller Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">Contact/Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">Monthly Sales Goal ($)</label>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="5000"
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">Observations</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Add notes about performance, schedule, etc."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>
        </div>

        {seller && (
          <button 
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 text-rose-500 font-bold text-sm py-4 active:bg-rose-500/10 rounded-2xl transition-colors"
          >
            <Trash2 size={18} />
            Remove Seller
          </button>
        )}
      </main>
    </div>
  );
};
