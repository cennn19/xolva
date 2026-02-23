"use client";

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { Users, Hammer, Sparkles } from 'lucide-react';

export default function SocialPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900 flex flex-col">
      
      {/* HEADER KHUSUS SOCIAL */}
      <section className="bg-white p-6 lg:p-10 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tight uppercase">COMMUNITY</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              XOLVA GUILD HALL
            </p>
          </div>
        </div>
      </section>

      {/* KONTEN COMING SOON */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Ikon Konstruksi */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 rounded-full"></div>
          <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center relative z-10 rotate-3">
            <Hammer size={56} className="text-blue-600" />
          </div>
          <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg text-xs font-black rotate-12 shadow-md flex items-center gap-1 z-20">
            <Sparkles size={12} /> WIP
          </div>
        </div>

        {/* Teks Pesan */}
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4 uppercase">
          COMING SOON <br /> <span className="text-blue-600">Lagi Dibangun!</span>
        </h2>
            <span>TUNGUUIN YAAAA</span>
          
      </div>

      <Navbar />
    </main>
  );
}