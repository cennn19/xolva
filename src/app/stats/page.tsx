"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import WeeklyChart from '@/components/WeeklyChart';
// Import getFullHistory yang baru kita buat
import { getWeeklyStats, getHabits, getFullHistory } from '../actions/habitActions'; 
import { Flame, ArrowLeft, History, Zap, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function StatsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]); // State baru buat history
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak: 0 });
  const xpPerLevel = 100;

  useEffect(() => {
    const loadData = async () => {
      const stats = await getWeeklyStats();
      setChartData(stats);

      // Ambil History
      const hist = await getFullHistory();
      if (hist.success) setHistoryData(hist.data);

      const result = await getHabits() as any;
      if (result.success && result.user) {
        setUserStats({
          xp: result.user.xp || 0,
          level: result.user.level || 1,
          streak: result.user.currentStreak || 0
        });
      }
    };
    loadData();
  }, []);

  const displayLevel = Math.floor(userStats.xp / xpPerLevel) + 1;

  return (
    <main className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900">
      
      {/* HEADER KHUSUS STATS */}
      <section className="bg-white p-6 lg:p-10 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl tracking-tight uppercase flex items-center gap-4">
              <Link href="/" className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                <ArrowLeft size={20} />
              </Link>
              STATISTICS
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 ml-14">
              PERFORMA MINGGU INI
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
             <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
             <span className="text-xs text-orange-600 font-black">{userStats.streak} DAYS</span>
          </div>
        </div>
      </section>

      <div className="p-6 lg:p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* ... Card Lu Tetep Sama ... */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</p>
            <p className="text-4xl font-black text-blue-600 mt-2">{userStats.xp}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Level</p>
            <p className="text-4xl font-black text-purple-600 mt-2">{displayLevel}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak</p>
             <div className="flex items-center gap-2 mt-2">
                <Flame className="text-orange-500 fill-orange-500" size={32} />
                <p className="text-4xl font-black text-orange-600">{userStats.streak}</p>
             </div>
          </div>
        </div>

        {/* Grafik Mingguan */}
        <div className="mb-10">
            <WeeklyChart data={chartData} />
        </div>

        {/* SECTION RIWAYAT BARU */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <History size={20} className="text-blue-500" /> Recent History
                </h3>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">LAST 50</span>
            </div>

            <div className="grid gap-3">
                {historyData.length === 0 ? (
                    <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                        <p className="text-slate-400 font-bold">Belum ada riwayat misi.</p>
                    </div>
                ) : (
                    historyData.map((h) => (
                        <div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{h.habitName}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                            {h.category}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(h.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100">
                                <Zap size={12} className="fill-current" />
                                <span className="font-black text-xs">+{h.xpEarned} XP</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
      <Navbar />
    </main>
  );
}