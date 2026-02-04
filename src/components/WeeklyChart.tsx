"use client";

import React from 'react';

interface ChartProps {
  data: any[]; // Data history dari database
}

export default function WeeklyChart({ data }: ChartProps) {
  // 1. Siapkan 7 hari terakhir (Biar grafik selalu gerak sesuai tanggal)
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']; // Bahasa Indo biar akrab
  const today = new Date();
  
  // Bikin array 7 hari ke belakang
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i)); // Mundur: Hari ini - 6, Hari ini - 5, dst
    return d;
  });

  // 2. Hitung Total XP per hari
  const chartData = last7Days.map((date) => {
    const dayStr = date.toISOString().split('T')[0]; // Format: 2024-02-02
    
    // Filter data yang tanggalnya cocok
    const totalXP = data
      .filter((log) => {
        const logDate = new Date(log.completedAt).toISOString().split('T')[0];
        return logDate === dayStr;
      })
      .reduce((sum, log) => sum + log.xpEarned, 0);

    return {
      dayName: days[date.getDay()], // Ambil nama hari (Sen, Sel...)
      xp: totalXP,
      date: date.getDate(), // Tanggal angka (1-31)
    };
  });

  // Cari nilai tertinggi buat skala grafik (biar batang paling tinggi pas mentok atas)
  const maxXP = Math.max(...chartData.map(d => d.xp), 50); // Minimal 50 biar grafik gak error kalau 0 semua

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mt-8">
      <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
        📊 Statistik Minggu Ini
      </h3>
      
      {/* Area Grafik */}
      <div className="flex items-end justify-between gap-2 h-40">
        {chartData.map((item, idx) => {
          // Hitung tinggi batang dalam persen (XP / MaxXP)
          const heightPercent = (item.xp / maxXP) * 100;
          const isToday = item.dayName === days[today.getDay()] && item.date === today.getDate();
          
          return (
            <div key={idx} className="flex flex-col items-center gap-2 w-full group cursor-pointer relative">
              
              {/* Tooltip XP (Muncul pas di-hover) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded mb-1 absolute -top-8 z-10 whitespace-nowrap">
                {item.xp} XP
              </div>
              
              {/* Batang Grafik */}
              <div className="w-full bg-slate-50 rounded-t-lg relative h-full flex items-end overflow-hidden">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-1000 ease-out ${
                    item.xp > 0 
                      ? (isToday ? 'bg-orange-500' : 'bg-blue-600') // Hari ini warnanya Orange!
                      : 'bg-transparent'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Label Hari */}
              <div className="text-center">
                <p className={`text-[9px] font-black uppercase ${isToday ? 'text-orange-600' : 'text-slate-400'}`}>
                  {item.dayName}
                </p>
                <p className="text-[9px] font-bold text-slate-600">{item.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}