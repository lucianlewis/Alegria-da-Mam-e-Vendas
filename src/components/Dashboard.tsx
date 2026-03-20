import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, CheckCircle, PieChart, Calendar, ChevronDown } from 'lucide-react';
import { Sale, Goal, Seller } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, eachDayOfInterval, subDays, eachHourOfInterval, isSameHour, isSameDay, isSameWeek } from 'date-fns';

interface DashboardProps {
  sales: Sale[];
  goals: Goal[];
  sellers: Seller[];
}

type TimePeriod = 'day' | 'week' | 'month' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({ sales, goals, sellers }) => {
  const { t, formatCurrency } = useLanguage();
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (activePeriod) {
    case 'week':
      periodStart = startOfWeek(now);
      periodEnd = endOfWeek(now);
      break;
    case 'month':
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
      break;
    default: // day
      periodStart = startOfDay(now);
      periodEnd = endOfDay(now);
      break;
  }

  const filteredSales = sales.filter(sale => {
    const saleDate = sale.timestamp?.toDate() || new Date();
    return isWithinInterval(saleDate, { start: periodStart, end: periodEnd });
  });

  const totalSales = filteredSales.reduce((acc, sale) => acc + sale.amount, 0);
  
  // Calculate target based on period
  const monthlyTarget = sellers.reduce((acc, s) => acc + (s.goal || 0), 0);
  let target = monthlyTarget;
  if (activePeriod === 'day') target = monthlyTarget / 30;
  if (activePeriod === 'week') target = monthlyTarget / 4;

  const remaining = Math.max(0, target - totalSales);
  const growth = totalSales > 0 ? 12.5 : 0; // Mock growth if sales exist

  // Real data for the trend chart based on period
  const getTrendData = () => {
    if (activePeriod === 'day') {
      const hours = eachHourOfInterval({
        start: startOfDay(now),
        end: endOfDay(now)
      }).filter((_, i) => i % 2 === 0); // Every 2 hours

      return hours.map(hour => {
        const hourSales = filteredSales.filter(s => isSameHour(s.timestamp?.toDate() || new Date(), hour));
        const value = hourSales.reduce((acc, s) => acc + s.amount, 0);
        return { name: format(hour, 'HH:mm'), value };
      });
    }

    if (activePeriod === 'week') {
      const days = eachDayOfInterval({
        start: startOfWeek(now),
        end: endOfWeek(now)
      });

      const dayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
      return days.map(day => {
        const daySales = filteredSales.filter(s => isSameDay(s.timestamp?.toDate() || new Date(), day));
        const value = daySales.reduce((acc, s) => acc + s.amount, 0);
        return { name: dayNames[day.getDay()], value };
      });
    }

    if (activePeriod === 'month') {
      // Group by weeks
      const weeks = [
        { name: t('w1'), start: startOfMonth(now), end: subDays(startOfMonth(now), -7) },
        { name: t('w2'), start: subDays(startOfMonth(now), -7), end: subDays(startOfMonth(now), -14) },
        { name: t('w3'), start: subDays(startOfMonth(now), -14), end: subDays(startOfMonth(now), -21) },
        { name: t('w4'), start: subDays(startOfMonth(now), -21), end: endOfMonth(now) },
      ];

      return weeks.map(week => {
        const weekSales = filteredSales.filter(s => {
          const d = s.timestamp?.toDate() || new Date();
          return d >= week.start && d < week.end;
        });
        const value = weekSales.reduce((acc, s) => acc + s.amount, 0);
        return { name: week.name, value };
      });
    }

    return [];
  };

  const trendData = getTrendData();

  // Channel data
  const channelData = [
    { name: t('physicalStore'), value: filteredSales.filter(s => s.source === 'physical-store').reduce((acc, s) => acc + s.amount, 0), color: '#ff0080' },
    { name: t('whatsapp'), value: filteredSales.filter(s => s.source === 'whatsapp').reduce((acc, s) => acc + s.amount, 0), color: '#ce8dad' },
    { name: t('instagram'), value: filteredSales.filter(s => s.source === 'instagram').reduce((acc, s) => acc + s.amount, 0), color: '#4b2036' },
  ];

  const totalChannelValue = channelData.reduce((acc, c) => acc + c.value, 0);
  const pieData = totalChannelValue > 0 
    ? channelData.map(c => ({ ...c, percentage: Math.round((c.value / totalChannelValue) * 100) }))
    : [
        { name: t('physicalStore'), value: 1, percentage: 0, color: '#ff0080' },
        { name: t('whatsapp'), value: 1, percentage: 0, color: '#ce8dad' },
        { name: t('instagram'), value: 1, percentage: 0, color: '#4b2036' },
      ];

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <h2 className="text-xl font-bold tracking-tight">{t('dashboard')}</h2>
        <div className="size-10 rounded-full bg-[var(--card-bg)] flex items-center justify-center border border-[var(--border-color)]">
          <PieChart size={20} className="text-primary" />
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-[var(--card-bg)] p-1 rounded-2xl flex gap-1">
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
              : "bg-[var(--card-bg)] border-[var(--border-color)] text-slate-400"
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
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 grid grid-cols-1 gap-3">
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
        <div className="flex-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('currentSales')}</p>
          <p className="text-2xl font-black">{formatCurrency(totalSales)}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
            <TrendingUp size={14} />
            <span>+{growth}%</span>
          </div>
        </div>
        <div className="flex-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('remaining')}</p>
          <p className="text-2xl font-black">{formatCurrency(remaining)}</p>
          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
            <TrendingDown size={14} />
            <span>-5.2%</span>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] shadow-xl space-y-6">
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

      <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold">{t('salesChannels')}</h3>
            <p className="text-slate-500 text-xs">{t('performanceByPlatform')}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center py-4">
          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-slate-500 text-[10px] font-bold uppercase">{t('total')}</span>
              <span className="text-xl font-black">{formatCurrency(totalSales)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 w-full gap-4 mt-6">
            {pieData.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full" style={{ backgroundColor: channel.color }}></div>
                  <span className="text-slate-300 text-sm font-medium">{channel.name}</span>
                </div>
                <span className="font-bold">{channel.percentage}%</span>
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
          <div key={goal.id} className="bg-[var(--card-bg)] rounded-2xl p-4 flex items-center gap-4 border border-[var(--border-color)]">
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
