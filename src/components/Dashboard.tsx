import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, CheckCircle, PieChart, Calendar, ChevronDown } from 'lucide-react';
import { Sale, Goal } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface DashboardProps {
  sales: Sale[];
  goals: Goal[];
}

type TimePeriod = 'day' | 'week' | 'month' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({ sales, goals }) => {
  const { t, formatCurrency } = useLanguage();
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  const totalSales = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const target = 5000; // Example target
  const remaining = Math.max(0, target - totalSales);
  const growth = 12.5; // Mock growth

  // Mock data for the trend chart based on period
  const getTrendData = () => {
    switch (activePeriod) {
      case 'week':
        return [
          { name: t('mon'), value: 2100 },
          { name: t('tue'), value: 1800 },
          { name: t('wed'), value: 2400 },
          { name: t('thu'), value: 2000 },
          { name: t('fri'), value: 2800 },
          { name: t('sat'), value: 3200 },
          { name: t('sun'), value: 2900 },
        ];
      case 'month':
        return [
          { name: t('w1'), value: 8500 },
          { name: t('w2'), value: 9200 },
          { name: t('w3'), value: 7800 },
          { name: t('w4'), value: 10500 },
        ];
      default: // day
        return [
          { name: '08:00', value: 400 },
          { name: '10:00', value: 800 },
          { name: '12:00', value: 1200 },
          { name: '14:00', value: 900 },
          { name: '16:00', value: 1500 },
          { name: '18:00', value: 2100 },
          { name: '20:00', value: 1800 },
        ];
    }
  };

  const trendData = getTrendData();

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <h2 className="text-xl font-bold tracking-tight">{t('dashboard')}</h2>
        <div className="size-10 rounded-full bg-card-dark flex items-center justify-center border border-white/5">
          <PieChart size={20} className="text-primary" />
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white/5 p-1 rounded-2xl flex gap-1">
        {(['day', 'week', 'month'] as const).map((period) => (
          <button
            key={period}
            onClick={() => {
              setActivePeriod(period);
              setShowCustomPicker(false);
            }}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
              activePeriod === period && !showCustomPicker
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:text-white"
            )}
          >
            {t(period)}
          </button>
        ))}
      </div>

      {/* Custom Option */}
      <div className="space-y-3">
        <button 
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all",
            showCustomPicker 
              ? "bg-primary/10 border-primary text-primary" 
              : "bg-white/5 border-white/10 text-slate-400"
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span className="text-sm font-bold">{t('custom')}</span>
          </div>
          <ChevronDown size={18} className={cn("transition-transform", showCustomPicker && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showCustomPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">{t('selectDate')}</p>
                  <input 
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-sm font-medium outline-none focus:border-primary"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('currentSales')}</p>
          <p className="text-2xl font-black">{formatCurrency(totalSales)}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
            <TrendingUp size={14} />
            <span>+{growth}%</span>
          </div>
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('remaining')}</p>
          <p className="text-2xl font-black">{formatCurrency(remaining)}</p>
          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
            <TrendingDown size={14} />
            <span>-5.2%</span>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-card-dark rounded-3xl p-6 border border-white/5 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold">{t('salesTrend')}</h3>
          <p className="text-slate-500 text-xs">{t('revenueByDay')}</p>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff0080" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff0080" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#ff0080', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#ff0080" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card-dark rounded-3xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold">{t('salesChannels')}</h3>
            <p className="text-slate-500 text-xs">{t('performanceByPlatform')}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center py-4">
          <div className="relative size-48 rounded-full flex items-center justify-center shadow-2xl" 
               style={{ background: 'conic-gradient(#ff0080 0% 45%, #ce8dad 45% 75%, #4b2036 75% 100%)' }}>
            <div className="size-32 rounded-full bg-card-dark flex flex-col items-center justify-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase">{t('total')}</span>
              <span className="text-2xl font-black">{formatCurrency(totalSales)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 w-full gap-4 mt-10">
            {[
              { label: t('physicalStore'), value: 45, color: 'bg-primary' },
              { label: t('whatsapp'), value: 30, color: 'bg-[#ce8dad]' },
              { label: t('instagram'), value: 25, color: 'bg-[#4b2036]' },
            ].map((channel) => (
              <div key={channel.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("size-3 rounded-full", channel.color)}></div>
                  <span className="text-slate-300 text-sm font-medium">{channel.label}</span>
                </div>
                <span className="font-bold">{channel.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{t('recentGoalProgress')}</h3>
          <button className="text-primary text-[10px] font-bold uppercase">{t('viewAll')}</button>
        </div>
        
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
            <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{goal.title}</p>
              <p className="text-slate-500 text-[10px]">{Math.round((goal.current / goal.target) * 100)}% {t('ofTargetReached')} ({formatCurrency(goal.target)})</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 text-[10px] font-bold px-2 py-1 bg-emerald-400/10 rounded-full uppercase">{t(goal.status === 'on-track' ? 'onTrack' : goal.status === 'behind' ? 'behind' : 'completed')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
