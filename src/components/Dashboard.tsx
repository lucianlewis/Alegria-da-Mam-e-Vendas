import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, CheckCircle, PieChart } from 'lucide-react';
import { Sale, Goal } from '../types';

interface DashboardProps {
  sales: Sale[];
  goals: Goal[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, goals }) => {
  const totalSales = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const target = 5000; // Example target
  const remaining = Math.max(0, target - totalSales);
  const growth = 12.5; // Mock growth

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
        <div className="size-10 rounded-full bg-card-dark flex items-center justify-center border border-white/5">
          <PieChart size={20} className="text-primary" />
        </div>
      </header>

      <div className="flex gap-4">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Current Sales</p>
          <p className="text-2xl font-black">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
            <TrendingUp size={14} />
            <span>+{growth}%</span>
          </div>
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Remaining</p>
          <p className="text-2xl font-black">${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
            <TrendingDown size={14} />
            <span>-5.2%</span>
          </div>
        </div>
      </div>

      <div className="bg-card-dark rounded-3xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold">Sales Channels</h3>
            <p className="text-slate-500 text-xs">Performance by platform</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center py-4">
          <div className="relative size-48 rounded-full flex items-center justify-center shadow-2xl" 
               style={{ background: 'conic-gradient(#ff0080 0% 45%, #ce8dad 45% 75%, #4b2036 75% 100%)' }}>
            <div className="size-32 rounded-full bg-card-dark flex flex-col items-center justify-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Total</span>
              <span className="text-2xl font-black">${(totalSales / 1000).toFixed(1)}k</span>
            </div>
          </div>

          <div className="grid grid-cols-1 w-full gap-4 mt-10">
            {[
              { label: 'Physical Store', value: 45, color: 'bg-primary' },
              { label: 'WhatsApp', value: 30, color: 'bg-[#ce8dad]' },
              { label: 'Instagram', value: 25, color: 'bg-[#4b2036]' },
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Goal Progress</h3>
          <button className="text-primary text-[10px] font-bold uppercase">View All</button>
        </div>
        
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
            <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{goal.title}</p>
              <p className="text-slate-500 text-[10px]">{Math.round((goal.current / goal.target) * 100)}% of target reached (${goal.target.toLocaleString()})</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 text-[10px] font-bold px-2 py-1 bg-emerald-400/10 rounded-full uppercase">On Track</span>
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
