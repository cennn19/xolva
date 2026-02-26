"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Plus, Zap, CheckCircle2, Award, Trash2, Flame, Target, BookOpen, Star, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createHabit, deleteHabit, getHabits, completeHabit, resetAccount, addProgress } from './actions/habitActions';
import LevelUpModal from '@/components/LevelUpModal';

// === HELPER: LOGIKA LEVELING RPG EKSPONENSIAL ===
const calculateLevelInfo = (totalXp: number) => {
  let level = 1;
  let xpForNextLevel = 100;
  let xpAccumulated = 0;

  while (totalXp >= xpAccumulated + xpForNextLevel) {
    xpAccumulated += xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * 1.5);
  }

  const currentLevelProgress = totalXp - xpAccumulated;
  const progressPercent = (currentLevelProgress / xpForNextLevel) * 100;

  return { level, currentLevelProgress, xpForNextLevel, progressPercent };
};

// === HELPER: STYLING BADGE DINAMIS ===
const getBadgeStyles = (category: string) => {
  switch (category.toUpperCase()) {
    case 'HARIAN': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'MINGGUAN': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    case 'BULANAN': return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'PROJECT': return 'bg-slate-900 text-white border-slate-900';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export default function HomePage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak: 0, avatar: "😎", name: "Cen" });
 
  const [activeTab, setActiveTab] = useState('Harian');
  const [habitName, setHabitName] = useState('');
  const [selectedExp, setSelectedExp] = useState(3);
  const [targetValue, setTargetValue] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("");
 
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState(1);

  const habitConfigs: Record<string, { min: number, max: number, slots: number, color: string }> = {
    'Harian': { min: 3, max: 6, slots: 10, color: 'text-blue-500' },
    'Mingguan': { min: 15, max: 25, slots: 8, color: 'text-blue-600' },
    'Bulanan': { min: 40, max: 60, slots: 6, color: 'text-blue-700' },
    'Project': { min: 300, max: 600, slots: 1, color: 'text-slate-800' },
  };

  const currentConfig = habitConfigs[activeTab];

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
          name: result.user.name || "Cen"
        });
      }
    }
  };

  useEffect(() => { refreshData(); }, []);

  // --- CEK LEVEL UP (Optimistic UI) ---
  const checkLevelUp = (earnedXp: number) => {
    const currentLevel = calculateLevelInfo(userStats.xp).level;
    const newTotalXp = userStats.xp + earnedXp;
    const nextLevel = calculateLevelInfo(newTotalXp).level;

    setUserStats((prev) => ({ ...prev, xp: newTotalXp, streak: prev.streak + 1 }));

    if (nextLevel > currentLevel) {
      setNewLevelReached(nextLevel);
      setShowLevelUp(true);
    }
  };

  // --- LOGIKA COMPLETE (Target = 1) ---
  const handleComplete = async (id: string, exp: number) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    checkLevelUp(exp);
    const result = await completeHabit(id);
    if (!result?.success) await refreshData();
  };

  // --- LOGIKA QUICK +1 (Mingguan/Bulanan Target > 1) ---
  const handleQuickProgress = async (id: string) => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Optimistic update bar-nya di UI
    setHabits((prev) => prev.map(h => h.id === id ? { ...h, currentValue: h.currentValue + 1 } : h));

    const result = await addProgress(id) as any; // Panggil tanpa note
   
    if (result?.success) {
      if (result.status === 'completed' && result.earnedXp) {
        checkLevelUp(result.earnedXp);
        alert(`MISI SELESAI! +${result.earnedXp} XP 🎉`);
      }
      await refreshData();
    } else {
      await refreshData(); // Kalau gagal, balikin data asli
    }
    setIsLoading(false);
  };

  // --- LOGIKA MODAL JURNAL (Khusus Project) ---
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
        checkLevelUp(result.earnedXp);
        alert(`PROJECT SELESAI! +${result.earnedXp} XP 🎉`);
      }
      await refreshData();
      setShowProgressModal(false);
    }
    setIsLoading(false);
  };

  const handleAddHabit = async () => {
    if (!habitName || isLoading) return;
    setIsLoading(true);
    const finalExp = Math.min(Math.max(selectedExp, currentConfig.min), currentConfig.max);
    const finalTarget = activeTab === 'Harian' ? 1 : targetValue;
    const finalDeadline = activeTab === 'Project' && deadline ? new Date(deadline) : null;

    const result = await createHabit({
      name: habitName,
      category: activeTab.toUpperCase(),
      expReward: finalExp,
      targetValue: finalTarget,
      deadline: finalDeadline
    });

    if (result.success) {
      await refreshData();
      setHabitName('');
      setTargetValue(activeTab === 'Project' ? 10 : (activeTab === 'Mingguan' ? 3 : (activeTab === 'Bulanan' ? 10 : 1)));
      setDeadline('');
    }
    setIsLoading(false);
  };

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedExp(habitConfigs[tab].min);
    if (tab === 'Project') setTargetValue(10);
    else if (tab === 'Mingguan') setTargetValue(3);
    else if (tab === 'Bulanan') setTargetValue(10);
    else setTargetValue(1);
  };

  const levelInfo = calculateLevelInfo(userStats.xp);
  const displayLevel = levelInfo.level;
  const currentLevelProgress = levelInfo.currentLevelProgress;
  const progressPercent = levelInfo.progressPercent;
  const xpPerLevel = levelInfo.xpForNextLevel;

  // UX FILTERING: List yang muncul di layar disaring sesuai Tab yang lagi diklik
  const filteredHabits = habits.filter(h => h.category.toUpperCase() === activeTab.toUpperCase());

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {showLevelUp && <LevelUpModal newLevel={newLevelReached} onClose={() => setShowLevelUp(false)} />}

      {/* MODAL SETOR BUKTI KHUSUS PROJECT */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-slate-900 p-2 rounded-lg text-white"><BookOpen size={20}/></div>
                <h3 className="font-bold text-lg text-slate-800">Setor Jurnal Project</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5 ml-11">Tulis milestone atau progres kerjamu hari ini.</p>
            <textarea
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none font-medium text-slate-700 min-h-[120px] resize-none transition-all"
              placeholder="Contoh: Udah beres nyambungin database ke Supabase..."
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowProgressModal(false)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button onClick={submitProgress} disabled={!progressNote} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm">Simpan Progres</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
       
        {/* HEADER & XP CARD */}
        <div className="flex justify-between items-center mt-2 pt-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="relative">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                    {userStats.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">Hi, {userStats.name} 👋</h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-1">
                <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg border border-orange-100">
                    <Flame size={12} className="fill-current"/> <span className="font-bold">{userStats.streak}</span>
                </div>
                <span>Day Streak</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200/40 relative overflow-hidden border border-blue-500/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 font-medium flex items-center gap-2 mb-2"><LayoutDashboard size={16}/> Total XP Balance</p>
                <h1 className="text-5xl font-black tracking-tighter flex items-baseline gap-2">
                  {userStats.xp.toLocaleString('id-ID')} <span className="text-lg font-bold text-blue-200">XP</span>
                </h1>
              </div>
            </div>
            <div className="mt-8 bg-black/20 rounded-xl p-4 backdrop-blur-md border border-white/10">
              <div className="flex justify-between text-xs font-bold text-blue-100 mb-2 uppercase tracking-wider">
                <span>Progress to Lvl {displayLevel + 1}</span>
                <span>{currentLevelProgress} / {xpPerLevel} XP</span>
              </div>
              <div className="h-3 bg-black/30 rounded-md overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-200 to-white rounded-md transition-all duration-1000 ease-out relative" style={{ width: `${progressPercent}%` }}>
                  <div className="absolute right-0 top-0 h-full w-1 bg-white animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS (Berfungsi Ganda Jadi Filter) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {Object.keys(habitConfigs).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ease-in-out",
                activeTab === tab ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* FORM INPUT MISI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Target className="text-blue-500"/> Tambah {activeTab}</h3>
         
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)}
                placeholder="Nama rutinitas atau tugas..."
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl focus:outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400/80"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                {activeTab === 'Project' ? <BookOpen size={20}/> : <Zap size={20}/>}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="number" min={currentConfig.min} max={currentConfig.max} value={selectedExp}
                  onChange={(e) => setSelectedExp(parseInt(e.target.value) || 0)}
                  className="w-full p-4 pl-12 bg-blue-50/50 text-blue-700 rounded-xl font-bold border border-blue-100 focus:outline-none focus:border-blue-300 focus:bg-blue-50 transition-all"
                />
                <Star size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 fill-blue-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400">XP</span>
              </div>
             
              {activeTab !== 'Harian' && (
                <div className="flex-1 relative animate-in fade-in">
                  <input
                    type="number" min={2} value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value) || 2)}
                    className="w-full p-4 pr-12 bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 focus:outline-none focus:border-blue-300"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Target</span>
                </div>
              )}
             
              <button
                onClick={handleAddHabit} disabled={isLoading || !habitName}
                className="w-14 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>

            {activeTab === 'Project' && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                 <input
                   type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                   className="w-full p-4 pr-32 bg-orange-50/50 text-orange-700 rounded-xl font-bold border border-orange-100 focus:outline-none focus:border-orange-300 transition-all"
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-400 uppercase tracking-wider pl-2 bg-orange-50/50">Tenggat Waktu</span>
              </div>
            )}
          </div>
        </div>

        {/* LIST MISI (Sudah terfilter otomatis berdasarkan UX Tab) */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              Daftar {activeTab} <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">{filteredHabits.length}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {filteredHabits.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                  <CheckCircle2 size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-lg">Semua {activeTab} beres!</p>
                <p className="text-slate-400 text-sm mt-1">Istirahat dulu atau tambah misi baru?</p>
              </div>
            ) : (
              filteredHabits.map((h) => (
                <div key={h.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 group transition-all hover:border-blue-200 hover:shadow-md relative overflow-hidden">
                 
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", h.category.toUpperCase() === 'PROJECT' ? "bg-slate-900 border-slate-800 text-white" : "bg-blue-50/50 border-blue-100 text-blue-600")}>
                        {h.category.toUpperCase() === 'PROJECT' ? <BookOpen size={22} /> : <Target size={22} />}
                      </div>
                     
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-slate-800 text-base leading-tight">{h.name}</h4>
                          <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border", getBadgeStyles(h.category))}>
                            {h.category}
                          </span>
                        </div>
                       
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Zap size={12} className="fill-current"/> +{h.expReward} XP
                          </span>
                         
                          {h.deadline && (
                            <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 uppercase">
                                ⏳ {new Date(h.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
  {/* Tombol Centang Cuma Buat Misi Biasa (Target 1) */}
  {h.targetValue <= 1 && h.category.toUpperCase() !== 'PROJECT' && (
    <button
      onClick={() => handleComplete(h.id, h.expReward)}
      className="w-11 h-11 shrink-0 rounded-xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-90 shadow-sm"
    >
      <CheckCircle2 size={24} strokeWidth={2.5} />
    </button>
  )}
 
  {/* Tombol Hapus: Udah anti-gaib di HP & jaraknya udah dilebarin */}
  <button
    onClick={() => handleDelete(h.id)}
    className="w-8 h-8 shrink-0 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg md:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
  >
    <Trash2 size={16} />
  </button>
</div>
                  </div>

                  {/* AREA PROGRESS KHUSUS TARGET > 1 ATAU PROJECT */}
                  {(h.targetValue > 1 || h.category.toUpperCase() === 'PROJECT') && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                          <span>Progres</span>
                          <span className="text-slate-800 font-black">{h.currentValue} / {h.targetValue}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 rounded-full relative",
                              h.category.toUpperCase() === "PROJECT" ? "bg-slate-900" : "bg-blue-600"
                            )}
                            style={{ width: `${Math.min((h.currentValue / h.targetValue) * 100, 100)}%` }}
                          >
                            <div className="absolute right-0 top-0 h-full w-1 bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                     
                      {/* LOGIKA TOMBOL PINTAR */}
                      {h.category.toUpperCase() === 'PROJECT' ? (
                        // Tombol Modal Jurnal buat Project
                        <button
                          onClick={() => openProgressModal(h.id)}
                          className="text-[11px] font-black text-white bg-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-slate-300 uppercase shrink-0"
                        >
                          <BookOpen size={14} strokeWidth={3}/> Setor
                        </button>
                      ) : (
                        // Tombol +1 Instan buat Mingguan/Bulanan
                        <button
                          onClick={() => handleQuickProgress(h.id)}
                          disabled={isLoading}
                          className="text-[11px] font-black text-white bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-blue-200 uppercase shrink-0"
                        >
                          <Zap size={14} strokeWidth={3}/> +1 Progres
                        </button>
                      )}
                    </div>
                  )}

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