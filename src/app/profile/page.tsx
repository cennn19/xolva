"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { updateProfile, getHabits } from '../actions/habitActions'; // Ambil data user dari sini
import { getRewards, createReward, deleteReward, redeemReward } from '../actions/shopActions'; // Fitur Toko
import { logout } from '../actions/authActions'; // Fitur Logout
import { User, Save, ShoppingBag, Coins, Trash2, Plus, LogOut, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  // === STATE DATA USER ===
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [isLoading, setIsLoading] = useState(false);
  
  // === STATE TOKO (SHOP) ===
  const [activeTab, setActiveTab] = useState<'profile' | 'shop'>('profile');
  const [rewards, setRewards] = useState<any[]>([]);
  const [showAddReward, setShowAddReward] = useState(false);
  
  // Form Toko (Input)
  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState(100);
  const [rewardEmoji, setRewardEmoji] = useState("🎁");

  // === 1. LOAD DATA ===
  const refreshData = async () => {
    // Ambil Data User (XP, Level, dll)
    const habitData = await getHabits() as any;
    if (habitData.user) {
      setUser(habitData.user);
      setName(habitData.user.name || '');
      setAvatar(habitData.user.avatar || '😎');
    }

    // Ambil Data Barang di Toko
    const rewardData = await getRewards();
    setRewards(rewardData);
  };

  useEffect(() => { refreshData(); }, []);

  // === 2. LOGIKA PROFILE ===
  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Asumsi fungsi updateProfile ada di habitActions. 
    // Kalau belum ada, nanti saya buatkan fungsinya.
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

  // === 3. LOGIKA TOKO ===
  const handleAddReward = async () => {
    if (!rewardName) return;
    await createReward(rewardName, rewardCost, rewardEmoji);
    
    // Reset Form
    setRewardName(""); 
    setRewardCost(100);
    setRewardEmoji("🎁");
    setShowAddReward(false);
    
    refreshData();
  };

  const handleBuyReward = async (id: string, cost: number, rName: string) => {
    if ((user?.xp || 0) < cost) {
      alert("❌ XP Gak Cukup Bos! Semangat Grinding lagi!");
      return;
    }
    
    if (confirm(`Tukar ${cost} XP buat "${rName}"?`)) {
      const res = await redeemReward(id) as any;
      if (res.success) {
        alert("✅ " + res.message);
        refreshData(); // Update XP di layar
      } else {
        alert("Gagal transaksi.");
      }
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (confirm("Hapus item ini dari toko?")) {
      await deleteReward(id);
      refreshData();
    }
  };

  const avatars = ["😎", "🐱", "🔥", "💀", "🤖", "🦄", "🐉", "👾", "👑", "🚀", "🦊", "🦁"];

  return (
    <main className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900">
      
      {/* HEADER PROFILE */}
      <section className="bg-white p-8 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-6">
           <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-blue-200 rotate-3">
             {avatar}
           </div>
           <div>
             <h1 className="font-black text-2xl uppercase tracking-tighter">{name || "BOSS XOLVA"}</h1>
             <div className="flex items-center gap-2 mt-2">
               <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm">
                 <Coins size={12} /> {user?.xp || 0} XP
               </span>
               <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold uppercase border border-slate-200">
                 LVL {user?.level || 1}
               </span>
             </div>
           </div>
        </div>

        {/* TAB MENU SWITCHER */}
        <div className="max-w-2xl mx-auto mt-8 flex p-1 bg-slate-100 rounded-xl">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`flex-1 py-2 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <User size={14} /> Edit Profile
           </button>
           <button 
             onClick={() => setActiveTab('shop')}
             className={`flex-1 py-2 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'shop' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <ShoppingBag size={14} /> Reward Shop
           </button>
        </div>
      </section>

      {/* KONTEN UTAMA */}
      <div className="p-6 max-w-2xl mx-auto">
        
        {/* === TAB 1: EDIT PROFILE === */}
        {activeTab === 'profile' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-slate-800">
                   <Sparkles className="text-blue-500 fill-blue-500" size={18} /> IDENTITY CARD
                </h3>
                
                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Panggilan</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-200 outline-none transition-all" />
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Avatar</label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                         {avatars.map((av) => (
                            <button 
                              key={av} 
                              onClick={() => setAvatar(av)}
                              className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${avatar === av ? 'bg-blue-600 shadow-lg scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                            >
                               {av}
                            </button>
                         ))}
                      </div>
                   </div>

                   <button onClick={handleSaveProfile} disabled={isLoading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                      {isLoading ? "SAVING..." : <><Save size={18} /> SIMPAN PERUBAHAN</>}
                   </button>
                </div>
              </div>

              {/* TOMBOL LOGOUT */}
              <button onClick={handleLogout} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                 <LogOut size={16} /> LOGOUT / KELUAR
              </button>
           </div>
        )}

        {/* === TAB 2: REWARD SHOP === */}
        {activeTab === 'shop' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Tombol Tambah Hadiah */}
              <button 
                onClick={() => setShowAddReward(!showAddReward)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                 <Plus size={16} /> TAMBAH LIST HADIAH
              </button>

              {/* Form Tambah (Muncul kalau diklik) */}
              {showAddReward && (
                 <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
                    <div className="grid grid-cols-4 gap-3 mb-3">
                       <input placeholder="🍿" value={rewardEmoji} onChange={e => setRewardEmoji(e.target.value)} className="p-4 rounded-2xl font-bold text-center outline-none focus:ring-2 focus:ring-purple-200" />
                       <input placeholder="Nama Hadiah" value={rewardName} onChange={e => setRewardName(e.target.value)} className="col-span-3 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                    </div>
                    
                    {/* INPUT ANGKA ANTI ERROR (NAN) */}
                    <input 
                       type="number" 
                       placeholder="Harga XP (Contoh: 500)" 
                       value={rewardCost || ""} 
                       onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setRewardCost(isNaN(val) ? 0 : val);
                       }}
                       className="w-full p-4 rounded-2xl font-bold outline-none mb-4 focus:ring-2 focus:ring-purple-200" 
                    />
                    
                    <button onClick={handleAddReward} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700">SIMPAN KE TOKO</button>
                 </div>
              )}

              {/* List Barang */}
              <div className="space-y-4">
                 {rewards.length === 0 ? (
                    <div className="text-center py-10 opacity-40 font-bold text-slate-400 flex flex-col items-center">
                       <ShoppingBag size={48} className="mb-2"/>
                       Belum ada barang di Toko
                    </div>
                 ) : (
                    rewards.map((item) => (
                       <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-purple-200 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {item.emoji}
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded mt-1 inline-block">{item.cost} XP</span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => handleBuyReward(item.id, item.cost, item.name)}
                               disabled={(user?.xp || 0) < item.cost}
                               className={`px-5 py-3 rounded-xl font-black text-xs transition-all ${
                                 (user?.xp || 0) >= item.cost 
                                 ? 'bg-slate-900 text-white hover:bg-green-500 hover:shadow-green-200' 
                                 : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                               }`}
                             >
                               {(user?.xp || 0) >= item.cost ? "BELI" : "MAHAL"}
                             </button>
                             <button onClick={() => handleDeleteReward(item.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        )}

      </div>
      <Navbar />
    </main>
  );
}