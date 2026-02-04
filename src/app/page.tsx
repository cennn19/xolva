"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Plus, RotateCcw, Zap, CheckCircle2, Award, Trash2, AlertTriangle, Flame, BarChart3, Target, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
// Pastikan path import ini benar. Kalau error, cek folder actions.
import { createHabit, deleteHabit, getHabits, completeHabit, resetAccount, addProgress } from './actions/habitActions';
import LevelUpModal from '@/components/LevelUpModal'; 

export default function HomePage() {
  // === STATE DATA ===
  const [habits, setHabits] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak: 0, avatar: "😎", name: "Boss Xolva" });
  
  // === STATE FORM INPUT ===
  const [activeTab, setActiveTab] = useState('Harian');
  const [habitName, setHabitName] = useState('');
  const [selectedExp, setSelectedExp] = useState(3);
  const [targetValue, setTargetValue] = useState(1); 
  const [isLoading, setIsLoading] = useState(false);

  // === STATE PROGRESS MODAL ===
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("");
  
  // === STATE LEVEL UP ===
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState(1);

  // --- CONFIG ---
  const habitConfigs: Record<string, { min: number, max: number, slots: number, color: string }> = {
    'Harian': { min: 3, max: 6, slots: 10, color: 'text-blue-600' },
    'Mingguan': { min: 15, max: 25, slots: 8, color: 'text-purple-600' },
    'Bulanan': { min: 40, max: 60, slots: 6, color: 'text-orange-600' },
    'Project': { min: 300, max: 600, slots: 1, color: 'text-red-600' },
  };

  const currentConfig = habitConfigs[activeTab];
  const xpPerLevel = 100;

  // --- LOAD DATA ---
  const refreshData = async () => {
    const result = await getHabits() as any;
    if (result.success) {
      setHabits(result.data); 
      if (result.user) {
        setUserStats({ 
          xp: result.user.xp || 0, 
          level: result.user.level || 1,
          streak: result.user.currentStreak || 0,
          avatar: result.user.avatar || "😎",
          name: result.user.name || "Boss Xolva"
        });
      }
    }
  };

  useEffect(() => { refreshData(); }, []);

  // --- LOGIKA COMPLETE MISI ---
  const handleComplete = async (id: string, exp: number) => {
    const currentLevel = Math.floor(userStats.xp / xpPerLevel) + 1;
    const newTotalXp = userStats.xp + exp;
    const nextLevel = Math.floor(newTotalXp / xpPerLevel) + 1;

    setHabits((prev) => prev.filter((h) => h.id !== id));
    setUserStats((prev) => ({ ...prev, xp: newTotalXp, streak: prev.streak + 1 }));

    if (nextLevel > currentLevel) {
      setNewLevelReached(nextLevel);
      setShowLevelUp(true); 
    }

    const result = await completeHabit(id);
    if (result?.success) await refreshData(); 
    else refreshData(); 
  };

  // --- LOGIKA PROGRESS PROJECT ---
  const openProgressModal = (id: string) => {
    setSelectedHabitId(id);
    setProgressNote("");
    setShowProgressModal(true);
  };

  const submitProgress = async () => {
    if (!selectedHabitId || !progressNote) return;
    setIsLoading(true);

    const result = await addProgress(selectedHabitId, progressNote) as any;
    
    if (result?.success) {
      if (result.status === 'completed' && result.earnedXp) {
         const currentLevel = Math.floor(userStats.xp / xpPerLevel) + 1;
         const newTotalXp = userStats.xp + result.earnedXp;
         const nextLevel = Math.floor(newTotalXp / xpPerLevel) + 1;
         
         if (nextLevel > currentLevel) {
            setNewLevelReached(nextLevel);
            setShowLevelUp(true);
         }
         alert(`PROJECT SELESAI! +${result.earnedXp} XP 🎉`);
      } else {
         alert("Progress tercatat! Lanjutkan perjuangan Bos! 🔥");
      }
      await refreshData();
      setShowProgressModal(false);
    }
    setIsLoading(false);
  };

  // --- LOGIKA NAMBAH MISI ---
  const handleAddHabit = async () => {
    if (!habitName || isLoading) return;
    setIsLoading(true);
    const finalExp = Math.min(Math.max(selectedExp, currentConfig.min), currentConfig.max);
    const finalTarget = activeTab === 'Project' ? targetValue : 1;

    const result = await createHabit({
      name: habitName,
      category: activeTab.toUpperCase(),
      expReward: finalExp,
      targetValue: finalTarget
    });

    if (result.success) {
      await refreshData();
      setHabitName('');
      setTargetValue(1); 
    }
    setIsLoading(false);
  };

  // --- LOGIKA HAPUS & RESET ---
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus misi ini?")) return;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await deleteHabit(id);
  };

  const handleReset = async () => {
    if (confirm("⚠️ RESET DATA?\nSemua akan dihapus permanen.")) {
      setIsLoading(true);
      const result = await resetAccount();
      if (result.success) window.location.reload();
      else setIsLoading(false);
    }
  };

  // --- UI HELPERS ---
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedExp(habitConfigs[tab].min);
    if (tab === 'Project') setTargetValue(10);
    else setTargetValue(1);
  };

  const currentLevelProgress = userStats.xp % xpPerLevel;
  const progressPercent = (currentLevelProgress / xpPerLevel) * 100;
  const displayLevel = Math.floor(userStats.xp / xpPerLevel) + 1;

  return (
    <main className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900">
      {showLevelUp && <LevelUpModal newLevel={newLevelReached} onClose={() => setShowLevelUp(false)} />}

      {/* MODAL SETOR BUKTI */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2">📝 SETOR LAPORAN</h3>
            <p className="text-sm text-slate-500 mb-4">Tulis apa yang Bos kerjakan hari ini.</p>
            <textarea 
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-bold text-slate-700 min-h-[100px]"
              placeholder="Contoh: Selesai bab 1..."
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowProgressModal(false)} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600">BATAL</button>
              <button onClick={submitProgress} disabled={!progressNote} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 disabled:opacity-50">KIRIM</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <section className="bg-white p-6 lg:p-10 border-b border-slate-100 relative">
        <button onClick={handleReset} className="absolute top-6 right-6 lg:top-10 lg:right-10 flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all z-10">
          <AlertTriangle size={14} /> Reset
        </button>

        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Link href="/profile" className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200 hover:scale-105 hover:rotate-3 transition-all cursor-pointer">
                {userStats.avatar}
             </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-black text-xl tracking-tight uppercase">{userStats.name}</h1>
                <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                   <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
                   <span className="text-[10px] text-orange-600 font-black">{userStats.streak} DAY STREAK</span>
                </div>
              </div>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-tighter">LVL {displayLevel} • {userStats.xp} XP TOTAL</p>
            </div>
          </div>
          <div className="hidden md:block w-64">
            <div className="flex justify-between text-[10px] font-black mb-1 uppercase text-slate-400 tracking-widest">
              <span>Next Level</span>
              <span>{currentLevelProgress} / {xpPerLevel} XP</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner mt-1">
              <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8 flex gap-4">
           <Link href="/stats" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-all text-sm w-full md:w-auto justify-center group">
              <BarChart3 size={18} className="group-hover:text-purple-600" /> 
              Lihat Statistik & Grafik
           </Link>
        </div>
      </section>

      {/* CONTENT */}
      <div className="p-6 lg:p-10 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* INPUT */}
        <div className="xl:col-span-5">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="font-black text-xl mb-8 flex items-center gap-2 text-slate-800 italic">ADD NEW MISSION</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aktivitas</label>
                <input type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="Contoh: Skripsi Bab 1" className="w-full mt-2 p-4 bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe</label>
                  <select value={activeTab} onChange={(e) => handleTabChange(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-bold focus:outline-none appearance-none border-2 border-transparent focus:border-blue-100">
                    {Object.keys(habitConfigs).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">XP Reward</label>
                  <input type="number" min={currentConfig.min} max={currentConfig.max} value={selectedExp} onChange={(e) => setSelectedExp(parseInt(e.target.value) || 0)} className="w-full mt-2 p-4 bg-blue-50 text-blue-600 rounded-2xl font-black focus:outline-none border-2 border-transparent focus:border-blue-200"/>
                </div>
              </div>
              
              {activeTab === 'Project' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Target size={12} /> Target Penyelesaian
                   </label>
                   <div className="flex items-center gap-4 mt-2">
                      <input 
                        type="number" 
                        min={2} 
                        value={targetValue} 
                        onChange={(e) => setTargetValue(parseInt(e.target.value) || 2)} 
                        className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black focus:outline-none border-2 border-transparent focus:border-red-200"
                      />
                      <span className="font-bold text-slate-400 text-sm">Sesi/Hari</span>
                   </div>
                </div>
              )}

              <button onClick={handleAddHabit} disabled={isLoading} className={cn("w-full p-5 rounded-2xl font-black transition-all shadow-lg active:scale-95", isLoading ? "bg-slate-300" : "bg-slate-900 text-white hover:bg-blue-600")}>
                {isLoading ? "SAVING..." : "CONFIRM MISSION"}
              </button>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="xl:col-span-7">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-xl flex items-center gap-3"><Zap className="text-yellow-400 fill-yellow-400" size={24} /> ACTIVE MISSIONS</h2>
              <button onClick={() => refreshData()} className="p-2 text-slate-300 hover:text-blue-600"><RotateCcw size={20}/></button>
            </div>
            
            <div className="space-y-4">
              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20"><Award size={64} /><p className="font-black italic mt-4">NO ACTIVE MISSIONS</p></div>
              ) : (
                habits.map((h) => (
                  <div key={h.id} className="flex flex-col p-6 bg-slate-50 rounded-[1.5rem] border-2 border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                    <div className="flex items-start justify-between w-full">
                       <div className="flex items-start gap-4">
                          {h.targetValue > 1 ? (
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500"><BookOpen size={24} /></div>
                          ) : (
                            <button onClick={() => handleComplete(h.id, h.expReward)} className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 hover:text-white hover:bg-green-500 border-2 border-slate-100 hover:border-green-500 transition-all"><CheckCircle2 size={28} /></button>
                          )}
                          <div>
                             <p className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{h.name}</p>
                             <p className={cn("text-[10px] font-black uppercase mt-1", habitConfigs[h.category]?.color || "text-blue-600")}>{h.category} • +{h.expReward} XP REWARD</p>
                          </div>
                       </div>
                       <button onClick={() => handleDelete(h.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                    {h.targetValue > 1 && (
                       <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-xs font-bold text-slate-400 uppercase">Progress Laporan</span>
                             <span className="text-sm font-black text-red-500">{h.currentValue} / {h.targetValue} SESI</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(h.currentValue / h.targetValue) * 100}%` }} />
                             </div>
                             <button onClick={() => openProgressModal(h.id)} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-all shadow-lg active:scale-90"><Plus size={16} /></button>
                          </div>
                       </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </main>
  );
}