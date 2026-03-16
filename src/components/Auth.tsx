import React from 'react';
import { auth, signInWithGoogle } from '../firebase';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Sales<span className="text-primary">Pro</span>
          </h1>
          <p className="text-slate-400">Professional Sales Performance Dashboard</p>
        </div>

        <div className="bg-card-dark p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
          <p className="text-slate-300 text-sm">Sign in to access your dashboard and track your performance in real-time.</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>

        <p className="text-slate-500 text-xs">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};
