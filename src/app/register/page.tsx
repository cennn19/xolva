"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { register } from '../actions/authActions';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-purple-500" />

        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter italic">REGISTER XOLVA</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Mulai Perjalananmu!</p>
        </div>

        {/* PESAN ERROR */}
        {error === 'exists' && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold mb-4 text-center border border-red-100 animate-pulse">
            ⚠️ Email sudah terdaftar! Login aja bos.
          </div>
        )}
        {error === 'weak_pass' && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold mb-4 text-center border border-red-100 animate-pulse">
            ⚠️ Password minimal 6 karakter ya!
          </div>
        )}

        <form action={register} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Panggilan</label>
            <input 
              name="name"
              type="text" 
              placeholder="Si Ganteng" 
              required
              className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-purple-500 text-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <input 
              name="email"
              type="email" 
              placeholder="boss@xolva.com" 
              required
              className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-purple-500 text-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buat Password</label>
            <input 
              name="password"
              type="password" 
              placeholder="Minimal 6 karakter" 
              required
              className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-purple-500 text-slate-800 transition-all"
            />
          </div>

          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-purple-600 transition-all shadow-xl hover:shadow-purple-200 flex items-center justify-center gap-2 group">
             <UserPlus size={18} />
             DAFTAR AKUN
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold">Sudah punya akun?</p>
          <Link href="/login" className="text-sm font-black text-blue-600 hover:underline">
            LOGIN DISINI
          </Link>
        </div>
      </div>
    </main>
  );
}