"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { updateProfile, getHabits } from '../actions/habitActions';
import { logout } from '../actions/authActions';
import { User, Save, LogOut, Crown, Trophy, ShoppingBag, Flame, ChevronRight } from 'lucide-react';

// === HELPER: Nentuin Pangkat Berdasarkan Level ===
const getTitle = (level: number) => {
  if (level < 5) return "Novice Explorer";
  if (level < 15) return "Habit Apprentice";
  if (level < 30) return "Discipline Knight";
  if (level < 50) return "Master of Consistency";
  return "Grandmaster of Xolva";
};

// === HELPER: Nentuin Warna Bingkai Avatar ===
const getAvatarFrame = (level: number) => {
  if (level < 15) return "ring-slate-200 shadow-slate-200/50";
  if (level < 30) return "ring-blue-400 shadow-blue-400/50";
  if (level < 50) return "ring-purple-500 shadow-purple-500/50";
  return "ring-yellow-400 shadow-yellow-400/50 ring-offset-2 ring-offset-blue-600";
};

export default function ProfilePage() {
  // === STATE DATA USER ===
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [isLoading, setIsLoading] = useState(false);

  // === LOAD DATA ===
  const refreshData = async () => {
    const habitData = await getHabits() as any;
    if (habitData.user) {
      setUser(habitData.user);
      setName(habitData.user.name || '');
      setAvatar(habitData.user.avatar || '😎');
    }
  };

  useEffect(() => { refreshData(); }, []);

  // === LOGIKA TOMBOL ===
  const handleSaveProfile = async () => {
    setIsLoading(true);
    await updateProfile(name, avatar); 
    setIsLoading(false);
    alert("Profile Updated! 😎");
    refreshData();
  };

  const handleLogout = async () => {
    if (confirm("Yakin mau logout Bos?")) {
      await logout();
    }
  };

  const avatars = ["😎", "🐱", "🔥", "💀", "🤖", "🦄", "🐉", "👾", "👑", "🚀", "🦊", "🦁"];
  const displayLevel = user?.level || 1;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900">
      
      {/* HEADER PROFILE */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 pt-12 rounded-b-[3rem] relative overflow-hidden shadow-xl shadow-blue-200/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div className="max-w-2xl mx-auto relative z-10 flex flex-col items-center text-center">
           
           <div className={`w-28 h-28 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-xl ring-4 ${getAvatarFrame(displayLevel)} transition-all duration-500`}>
             {avatar}
           </div>
           
           <h1 className="font-black text-3xl uppercase tracking-tighter text-white mt-6 flex items-center gap-2">
             {name || "BOSS XOLVA"}
           </h1>
           
           <div className="flex items-center gap-2 mt-2 bg-black/20 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-inner">
              <Crown size={14} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest">{getTitle(displayLevel)}</span>
           </div>

           <div className="flex items-center justify-center gap-3 mt-8 w-full">
              <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 max-w-[140px] shadow-sm">
                 <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Level</p>
                 <p className="text-3xl font-black text-white">{displayLevel}</p>
              </div>
              <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 max-w-[140px] shadow-sm">
                 <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">XP Total</p>
                 <p className="text-3xl font-black text-white">{user?.xp || 0}</p>
              </div>
              <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 max-w-[140px] shadow-sm">
                 <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Streak</p>
                 <div className="flex items-center justify-center gap-1">
                    <Flame className="text-orange-400 fill-orange-400" size={24}/>
                    <p className="text-3xl font-black text-white">{user?.currentStreak || 0}</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* KONTEN UTAMA */}
      <div className="p-6 max-w-2xl mx-auto space-y-6 -mt-4 relative z-20">
        
       {/* === PORTAL MENU TOKO (SHOP) - INVERT HOVER === */}
        <Link href="/shop" className="block animate-in slide-in-from-bottom-2 group">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-200">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:bg-white/20 group-hover:text-white group-hover:shadow-none">
                <ShoppingBag size={28} />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-800 tracking-tight transition-colors group-hover:text-white">REWARD SHOP</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 transition-colors group-hover:text-blue-100">Tukar {user?.xp || 0} XP dengan Hadiah</p>
              </div>
            </div>
            <div className="bg-slate-100 text-slate-400 w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm transition-all group-hover:bg-white group-hover:text-blue-600">
               <ChevronRight size={24} />
            </div>
          </div>
        </Link>

        {/* === SECTION: LEMARI TROFI === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg flex items-center gap-2 text-slate-800">
                <Trophy className="text-yellow-500 fill-yellow-500" size={20} /> TROPHY ROOM
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">COMING SOON</span>
           </div>
           
           <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col items-center text-center opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-xl">🔥</div>
                 <p className="text-[10px] font-black text-slate-800 leading-tight">30-DAY SURVIVOR</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-xl">📚</div>
                 <p className="text-[10px] font-black text-slate-800 leading-tight">PROJECT FINISHER</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center text-center opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-xl">🦉</div>
                 <p className="text-[10px] font-black text-slate-800 leading-tight">NIGHT OWL</p>
              </div>
           </div>
        </div>

        {/* === SECTION: EDIT PROFILE === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-slate-800">
            <User className="text-blue-500 fill-blue-500" size={18} /> EDIT IDENTITY
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Karakter</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-2 border-transparent focus:border-blue-200 focus:bg-white outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                <span>Pilih Avatar</span>
                <span className="text-blue-500">Selected: {avatar}</span>
              </label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {avatars.map((av) => (
                  <button 
                    key={av} 
                    onClick={() => setAvatar(av)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${avatar === av ? 'bg-blue-600 shadow-lg shadow-blue-200 scale-110' : 'bg-slate-50 hover:bg-slate-100 grayscale hover:grayscale-0'}`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2">
              {isLoading ? "SAVING..." : <><Save size={18} /> SIMPAN PERUBAHAN</>}
            </button>
          </div>
        </div>

        {/* TOMBOL LOGOUT */}
        <button onClick={handleLogout} className="w-full py-4 mt-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-black text-xs hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2">
            <LogOut size={16} /> LOGOUT DARI XOLVA
        </button>

      </div>
      <Navbar />
    </main>
  );
}