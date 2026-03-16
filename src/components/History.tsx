import React from 'react';
import { motion } from 'motion/react';
import { Share2, Download, Printer, ChevronDown } from 'lucide-react';
import { Sale } from '../types';
import { format } from 'date-fns';

interface HistoryProps {
  sales: Sale[];
}

export const History: React.FC<HistoryProps> = ({ sales }) => {
  // Group sales by day (mocking for UI)
  const days = [
    { date: new Date(), total: 4250, goal: 105, status: 'Completed' },
    { date: new Date(Date.now() - 86400000), total: 3120.45, goal: 92, status: 'Completed' },
    { date: new Date(Date.now() - 172800000), total: 5890, goal: 118, status: 'Completed' },
  ];

  return (
    <div className="p-4 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between py-2">
          <h2 className="text-xl font-bold tracking-tight">History</h2>
        </div>
        
        <div className="relative">
          <select className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm font-bold appearance-none outline-none focus:border-primary">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
        </div>
      </header>

      <div className="space-y-4">
        {days.map((day, idx) => (
          <div key={idx} className="bg-slate-500/10 rounded-3xl p-5 border border-white/5 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-lg font-black tracking-tight">{format(day.date, 'MMM dd, yyyy')}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {format(day.date, 'EEEE')} • {format(day.date, 'HH:mm')}
                </p>
              </div>
              <span className="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                {day.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Sales</p>
                <p className="text-xl font-black">${day.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Goal Result</p>
                <p className="text-xl font-black">{day.goal}%</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-white py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Share2 size={14} /> Share
              </button>
              <button className="flex-1 bg-white/5 text-primary py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all">
                <Download size={14} /> Save
              </button>
              <button className="size-11 bg-white/5 text-primary rounded-xl flex items-center justify-center border border-white/10 active:scale-95 transition-all">
                <Printer size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
