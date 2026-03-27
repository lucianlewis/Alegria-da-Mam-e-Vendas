import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Loader2, CheckCircle, User, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../firebase';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, linkWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileEditProps {
  onBack: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPassword = user?.providerData.some(p => p.providerId === 'password');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        setMessage({ type: 'error', text: t('fileTooLarge') || 'File too large (max 1MB)' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // 1. Update Profile (DisplayName, PhotoURL)
      if (user && (displayName !== user.displayName || photoURL !== user.photoURL)) {
        await updateProfile(user, { displayName, photoURL });
        await updateDoc(doc(db, 'users', user.uid), {
          displayName,
          photoURL,
          updatedAt: new Date()
        });
      }

      // 2. Update Email (requires re-auth usually)
      if (user && email !== user.email) {
        try {
          await updateEmail(user, email);
          await updateDoc(doc(db, 'users', user.uid), { email });
        } catch (e: any) {
          if (e.code === 'auth/requires-recent-login') {
            setMessage({ type: 'error', text: t('reauthRequired') });
            setLoading(false);
            return;
          }
          throw e;
        }
      }

      // 3. Update/Register Password
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: t('passwordsDoNotMatch') });
          setLoading(false);
          return;
        }

        if (hasPassword) {
          // Change password
          if (!currentPassword) {
            setMessage({ type: 'error', text: t('currentPasswordRequired') });
            setLoading(false);
            return;
          }
          const credential = EmailAuthProvider.credential(user!.email!, currentPassword);
          await reauthenticateWithCredential(user!, credential);
          await updatePassword(user!, newPassword);
        } else {
          // Link password provider
          const credential = EmailAuthProvider.credential(user!.email!, newPassword);
          await linkWithCredential(user!, credential);
        }
        
        // Mark in Firestore that user has a password (required for deletion)
        await updateDoc(doc(db, 'users', user!.uid), {
          hasPassword: true
        });
      }

      setMessage({ type: 'success', text: t('profileUpdated') });
      setTimeout(onBack, 1500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || t('errorUpdatingProfile') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2">{t('editProfile')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="size-32 rounded-full bg-white/10 border-4 border-primary/20 overflow-hidden shadow-2xl">
              <img 
                src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                className="w-full h-full object-cover" 
                alt="Profile" 
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 size-10 bg-primary rounded-full border-4 border-[var(--bg-color)] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
          >
            {t('changePhoto')}
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="m3-label-small tracking-widest text-primary uppercase px-2">{t('personalInfo')}</h3>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('fullName')}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-12 pr-4 m3-body-medium focus:border-primary outline-none"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email')}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-12 pr-4 m3-body-medium focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="m3-label-small tracking-widest text-primary uppercase">{t('security')}</h3>
              {!hasPassword && (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  <Shield size={12} /> {t('passwordRequiredForDeletion')}
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {hasPassword && !showPasswordFields ? (
                <button 
                  onClick={() => setShowPasswordFields(true)}
                  className="text-primary m3-label-large px-2 hover:underline transition-all"
                >
                  {t('changePassword') || 'Alterar senha'}
                </button>
              ) : (
                <AnimatePresence>
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {hasPassword && (
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={t('currentPassword')}
                          className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-12 pr-4 m3-body-medium focus:border-primary outline-none"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={hasPassword ? t('newPassword') : t('createPassword')}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-12 pr-4 m3-body-medium focus:border-primary outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmPassword')}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl h-14 pl-12 pr-4 m3-body-medium focus:border-primary outline-none"
                      />
                    </div>
                    {hasPassword && (
                      <button 
                        onClick={() => setShowPasswordFields(false)}
                        className="text-slate-500 m3-label-small px-2 hover:text-primary transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-2xl text-center m3-body-medium",
              message.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}
          >
            {message.text}
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-[var(--bg-color)]/80 backdrop-blur-md border-t border-[var(--border-color)]">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {loading ? t('saving') : t('saveChanges')}
        </button>
      </footer>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
