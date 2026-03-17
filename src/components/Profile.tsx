import React from 'react';
import { motion } from 'motion/react';
import { User, LogOut, Shield, Globe, Lock, FileText, Trash2, ChevronRight, Moon } from 'lucide-react';
import { auth, logout } from '../firebase';

interface ProfileProps {
  onNavigateSellers: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigateSellers }) => {
  const user = auth.currentUser;

  const sections = [
    {
      title: 'Management',
      items: [
        { icon: Globe, label: 'Stores', sub: 'Manage retail locations (12)' },
        { icon: Shield, label: 'Sellers', sub: 'Staff & team permissions (48)', onClick: onNavigateSellers },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Dark Mode', toggle: true },
        { icon: Globe, label: 'Language', value: 'English' },
        { icon: Lock, label: 'Privacy Settings' },
        { icon: FileText, label: 'Terms of Service' },
      ]
    }
  ];

  return (
    <div className="p-4 space-y-8">
      <header className="flex items-center justify-center py-2 relative">
        <h2 className="text-lg font-bold">Admin Profile</h2>
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="size-32 rounded-full bg-white/10 border-4 border-primary/20 overflow-hidden shadow-2xl">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              className="w-full h-full object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="absolute bottom-0 right-0 size-8 bg-primary rounded-full border-4 border-background-dark flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-2xl font-black tracking-tight">{user?.displayName || 'User'}</h3>
          <p className="text-primary font-bold text-sm">@{user?.email?.split('@')[0]}</p>
          <p className="text-slate-500 text-xs">{user?.email}</p>
        </div>

        <button className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
          Edit Profile
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2">{section.title}</h4>
          <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
            {section.items.map((item, idx) => (
              <div 
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  "flex items-center justify-between p-4 active:bg-white/5 transition-colors",
                  idx !== section.items.length - 1 && "border-b border-white/5",
                  item.onClick && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    {item.sub && <p className="text-[10px] text-slate-500">{item.sub}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-xs text-slate-500">{item.value}</span>}
                  {item.toggle ? (
                    <div className="w-10 h-6 bg-primary rounded-full relative p-1">
                      <div className="size-4 bg-white rounded-full ml-auto" />
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-slate-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
        <button className="w-full flex items-center gap-4 p-4 text-rose-500 active:bg-rose-500/10 transition-colors border-b border-white/5">
          <Trash2 size={20} />
          <span className="text-sm font-bold">Delete Account</span>
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 p-4 text-rose-500 active:bg-rose-500/10 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-bold">Log out</span>
        </button>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
