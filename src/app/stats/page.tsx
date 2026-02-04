"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import WeeklyChart from '@/components/WeeklyChart';
import { getWeeklyStats, getHabits } from '../actions/habitActions'; 
import { Flame, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StatsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  // Kita perlu state userStats biar header-nya tetap keren
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak: 0 });
  const xpPerLevel = 100;

  useEffect(() => {
    const loadData = async () => {
      // 1. Ambil Data Grafik Mingguan
      const stats = await getWeeklyStats();
      setChartData(stats);

      // 2. Ambil Data User (Buat Header & Summary Cards)
      // Kita "numpang" fungsi getHabits buat ambil data user terbaru
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
          
          {/* Badge Streak Kecil */}
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
             <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
             <span className="text-xs text-orange-600 font-black">{userStats.streak} DAYS</span>
          </div>
        </div>
      </section>

      {/* BODY CONTENT */}
      <div className="p-6 lg:p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
        
        {/* Ringkasan Angka (Summary Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</p>
            <p className="text-4xl font-black text-blue-600 mt-2">{userStats.xp}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Level</p>
            <p className="text-4xl font-black text-purple-600 mt-2">{displayLevel}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longest Streak</p>
             <div className="flex items-center gap-2 mt-2">
                <Flame className="text-orange-500 fill-orange-500" size={32} />
                <p className="text-4xl font-black text-orange-600">{userStats.streak}</p>
             </div>
          </div>
        </div>

        {/* Komponen Grafik Batang */}
        <WeeklyChart data={chartData} />

      </div>
      <Navbar />
    </main>
  );
}