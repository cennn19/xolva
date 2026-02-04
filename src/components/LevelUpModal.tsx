"use client";

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Trophy, Star } from 'lucide-react';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  
  // Efek Confetti Pas Modal Muncul
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2563eb', '#9333ea', '#fbbf24'] // Warna Xolva (Biru, Ungu, Emas)
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2563eb', '#9333ea', '#fbbf24']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-blue-100 relative transform animate-in zoom-in-95 duration-300 scale-100">
        
        {/* Tombol Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon Trophy */}
        <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-yellow-50 animate-bounce">
          <Trophy size={48} className="text-yellow-500 fill-yellow-500" />
        </div>

        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Level Up!
        </h2>
        
        <p className="text-slate-500 font-medium mb-8">
          Selamat Bos! Kamu sekarang naik ke <br/>
          <span className="text-blue-600 font-black text-2xl">LEVEL {newLevel}</span>
        </p>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
             <Star key={s} size={24} className="text-yellow-400 fill-yellow-400 animate-pulse" />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          CLAIM REWARD
        </button>
      </div>
    </div>
  );
}