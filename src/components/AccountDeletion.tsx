import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trash2, FileDown, Lock, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { auth, db } from '../firebase';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface AccountDeletionProps {
  onBack: () => void;
  sales: any[];
  cashMovements: any[];
  onProfileEdit: () => void;
}

export const AccountDeletion: React.FC<AccountDeletionProps> = ({ onBack, sales, cashMovements, onProfileEdit }) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setHasPassword(user.providerData.some(p => p.providerId === 'password'));
    }
  }, [user]);

  const generateDataPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd HH:mm:ss');

    doc.setFontSize(20);
    doc.text(t('dataExportTitle'), 20, 20);
    
    doc.setFontSize(12);
    doc.text(`${t('user')}: ${user?.displayName || 'N/A'}`, 20, 35);
    doc.text(`${t('email')}: ${user?.email || 'N/A'}`, 20, 42);
    doc.text(`${t('exportDate')}: ${dateStr}`, 20, 49);

    doc.setFontSize(16);
    doc.text(t('salesHistory'), 20, 65);
    
    let y = 75;
    sales.forEach((sale, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${format(sale.createdAt.toDate(), 'dd/MM/yyyy HH:mm')} - R$ ${sale.total.toFixed(2)}`, 20, y);
      y += 7;
    });

    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(16);
    doc.text(t('cashMovements'), 20, y);
    y += 10;

    cashMovements.forEach((mov, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${format(mov.createdAt.toDate(), 'dd/MM/yyyy HH:mm')} - ${mov.type} - R$ ${mov.amount.toFixed(2)}`, 20, y);
      y += 7;
    });

    doc.save(`data_export_${user?.uid}.pdf`);
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!hasPassword) {
      setError(t('passwordRequiredForDeletionError'));
      return;
    }
    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // 2. Delete all user data in Firestore
      const batch = writeBatch(db);
      
      // Delete sales
      const salesQuery = query(collection(db, 'sales'), where('userId', '==', user.uid));
      const salesSnap = await getDocs(salesQuery);
      salesSnap.forEach(doc => batch.delete(doc.ref));

      // Delete cash movements
      const movementsQuery = query(collection(db, 'cashMovements'), where('userId', '==', user.uid));
      const movementsSnap = await getDocs(movementsQuery);
      movementsSnap.forEach(doc => batch.delete(doc.ref));

      // Delete user profile
      batch.delete(doc(db, 'users', user.uid));

      await batch.commit();

      // 3. Delete user account in Firebase Auth
      await deleteUser(user);
      
      // Redirect or reload (Firebase Auth will trigger state change)
      window.location.reload();
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || t('errorDeletingAccount'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2">{t('deleteAccount')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl space-y-4">
          <div className="size-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
            <AlertTriangle size={24} />
          </div>
          <h2 className="m3-headline-medium text-rose-500">{t('warningTitle')}</h2>
          <p className="m3-body-medium text-slate-400 leading-relaxed">
            {t('deleteWarningText')}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="m3-title-large">{t('step1ExportData')}</h3>
          <p className="m3-body-medium text-slate-500">
            {t('exportDataText')}
          </p>
          <button 
            onClick={generateDataPDF}
            className="w-full flex items-center justify-center gap-3 p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl m3-label-large hover:bg-white/5 transition-colors"
          >
            <FileDown size={20} className="text-primary" />
            {t('downloadAllDataPDF')}
          </button>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
          <h3 className="m3-title-large">{t('step2ConfirmDeletion')}</h3>
          
          {!hasPassword ? (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldCheck size={20} />
                <span className="m3-label-large">{t('passwordRequired')}</span>
              </div>
              <p className="m3-body-small text-slate-400">
                {t('mustCreatePasswordText')}
              </p>
              <button 
                onClick={onProfileEdit}
                className="w-full py-2 bg-amber-500 text-black font-bold rounded-xl m3-label-medium active:scale-95 transition-all"
              >
                {t('goToProfileToCreatePassword')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="m3-body-medium text-slate-500">
                {t('enterPasswordToConfirm')}
              </p>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password')}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-12 pr-4 m3-body-medium focus:border-rose-500 outline-none"
                />
              </div>
              
              {error && (
                <p className="text-rose-500 m3-body-small px-2">{error}</p>
              )}

              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                {deleting ? t('deleting') : t('confirmPermanentDeletion')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
