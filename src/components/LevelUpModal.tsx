"use client";

import React from 'react';
import { Star } from 'lucide-react';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden border border-slate-100">
        
        {/* Efek Cahaya Halus (Pengganti Confetti) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Ikon Level Up */}
        <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-blue-200 mb-6 transform -rotate-3 hover:rotate-0 transition-all duration-300">
          <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse"></div>
          <Star className="text-white w-12 h-12 fill-current relative z-10" />
        </div>

        {/* Teks Konten */}
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Level Up!</h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          Pencapaian luar biasa! Perjuangan lu membuahkan hasil, sekarang naik ke <strong className="text-blue-600 font-black">Level {newLevel}</strong>.
        </p>

        {/* Tombol Lanjut */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
        >
          Lanjut Gas! 🚀
        </button>
      </div>
    </div>
  );
}