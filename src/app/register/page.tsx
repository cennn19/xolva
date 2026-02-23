"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { register } from '../actions/authActions';
import { UserPlus, Zap } from 'lucide-react';

// === KOMPONEN ISI FORM (Dibungkus biar aman dari error Vercel) ===
function RegisterContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    // DIV FORM: Sama kayak login, putih bersih dengan shadow pop-out
    <div className="bg-white p-8 sm:p-12 rounded-[2rem] w-full max-w-md shadow-2xl shadow-blue-200/40 border border-blue-100 relative z-10 animate-in zoom-in-95 duration-500">
      
      {/* HEADER LOGO BIRU */}
      <div className="text-center mb-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center shadow-inner mb-4 transform rotate-6 hover:rotate-0 transition-all duration-300">
          <Zap size={32} className="text-blue-600 fill-blue-600" />
        </div>
        <h1 className="text-4xl font-black text-blue-600 tracking-tighter">XOLVA</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Mulai Perjalananmu!</p>
      </div>

      {/* PESAN ERROR */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 text-center border border-red-100 animate-in slide-in-from-top-2">
          {error === 'exists' ? "⚠️ Email sudah terdaftar! Login aja bos." : "⚠️ Password minimal 6 karakter ya!"}
        </div>
      )}

      {/* FORM INPUT SIMPEL */}
      <form action={register} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-3">Nama Panggilan</label>
          <input 
            name="name"
            type="text" 
            placeholder="Contoh: Boss Xolva" 
            required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-slate-800 transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-3">Email</label>
          <input 
            name="email"
            type="email" 
            placeholder="boss@xolva.com" 
            required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-slate-800 transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-3">Buat Password</label>
          <input 
            name="password"
            type="password" 
            placeholder="Minimal 6 karakter" 
            required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-slate-800 transition-all tracking-widest placeholder:text-slate-300"
          />
        </div>

        <button className="w-full py-4 mt-6 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2 active:scale-95">
            <UserPlus size={20} />
            <span className="tracking-wide">DAFTAR AKUN</span>
        </button>
      </form>

      {/* LINK LOGIN */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500 font-medium mb-2">Sudah punya akun?</p>
        <Link href="/login" className="text-sm font-black text-blue-600 hover:text-blue-800 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-0.5">
          LOGIN DI SINI
        </Link>
      </div>
    </div>
  );
}

// === WRAPPER UTAMA (WAJIB ADA SUSPENSE) ===
export default function RegisterPage() {
  return (
    // BACKGROUND HALAMAN: Biru keabu-abuan super soft, konsisten sama Login
    <main className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Sedikit tint biru tambahan */}
      <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-4 animate-pulse relative z-10">
          <div className="bg-white p-4 rounded-3xl shadow-sm">
             <Zap size={32} className="text-blue-500 fill-blue-500" />
          </div>
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </main>
  );
}