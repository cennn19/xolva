"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Coins, Plus, Trash2, ShoppingBag, ArrowLeft, PartyPopper } from 'lucide-react';
import { createReward, getRewards, deleteReward, redeemReward } from '../actions/shopActions';
import { getHabits } from '../actions/habitActions'; // Kita pinjam ini buat ambil data XP User

export default function ShopPage() {
  // === STATE ===
  const [rewards, setRewards] = useState<any[]>([]);
  const [user, setUser] = useState({ xp: 0, name: "Boss Xolva" });
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState(100);
  const [newEmoji, setNewEmoji] = useState("🍿");

  // === LOAD DATA ===
  const refreshData = async () => {
    // 1. Ambil Barang Dagangan
    const rewardData = await getRewards();
    setRewards(rewardData);

    // 2. Ambil Sisa Uang (XP) User
    // Kita pakai getHabits karena dia return data user juga
    const habitData = await getHabits() as any;
    if (habitData.user) {
      setUser({ xp: habitData.user.xp, name: habitData.user.name });
    }
  };

  useEffect(() => { refreshData(); }, []);

  // === LOGIKA TOMBOL ===
  const handleAddReward = async () => {
    if (!newName || isLoading) return;
    setIsLoading(true);

    await createReward(newName, newCost, newEmoji);
    
    setNewName("");
    setNewCost(100);
    setShowAddForm(false);
    await refreshData();
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus barang ini dari toko?")) {
      await deleteReward(id);
      refreshData();
    }
  };

  const handleBuy = async (id: string, name: string, cost: number) => {
    if (user.xp < cost) {
      alert("⚠️ DUIT (XP) GAK CUKUP BOS! KERJA LAGI SANA!");
      return;
    }

    if (confirm(`Yakin mau beli "${name}" seharga ${cost} XP?`)) {
      const result = await redeemReward(id) as any;
      if (result.success) {
        alert(result.message); // Muncul pesan sukses
        await refreshData();   // Update XP di layar
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64 font-sans text-slate-900">
      
      {/* HEADER TOKO */}
      <section className="bg-white p-6 lg:p-10 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Link href="/" className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition-all">
                  <ArrowLeft size={18} className="text-slate-600"/>
               </Link>
               <h1 className="font-black text-2xl tracking-tight uppercase flex items-center gap-2">
                 <ShoppingBag className="text-purple-600" /> REWARD SHOP
               </h1>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-10">TUKARKAN KERINGATMU DENGAN HADIAH</p>
          </div>

          {/* DOMPET XP */}
          <div className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-2xl font-black shadow-lg shadow-yellow-200 transform hover:scale-105 transition-all flex items-center gap-2 border-2 border-yellow-300">
             <Coins size={24} className="fill-yellow-100" />
             <span className="text-xl">{user.xp} XP</span>
          </div>
        </div>
      </section>

      {/* KONTEN TOKO */}
      <div className="p-6 lg:p-10 max-w-5xl mx-auto">
        
        {/* TOMBOL TAMBAH BARANG */}
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-8 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
        >
          {showAddForm ? "BATAL TAMBAH" : "+ TAMBAH BARANG DAGANGAN BARU"}
        </button>

        {/* FORM TAMBAH (MUNCUL KALAU DIKLIK) */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-purple-100 border border-purple-100 mb-8 animate-in slide-in-from-top-4">
             <h3 className="font-black text-lg mb-4 text-purple-900">📦 STOK BARANG BARU</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" placeholder="Ikon (Contoh: 🍿)" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-200 outline-none text-center" />
                <input type="text" placeholder="Nama Hadiah (Contoh: Nonton Film)" value={newName} onChange={(e) => setNewName(e.target.value)} className="md:col-span-2 p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-200 outline-none" />
                <input type="number" placeholder="Harga XP" value={newCost} onChange={(e) => setNewCost(parseInt(e.target.value))} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-200 outline-none" />
             </div>
             <button onClick={handleAddReward} disabled={isLoading} className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">
                {isLoading ? "MENYIMPAN..." : "PAJANG DI ETALASE"}
             </button>
          </div>
        )}

        {/* LIST BARANG (GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {rewards.length === 0 ? (
              <div className="col-span-full text-center py-20 opacity-30">
                 <ShoppingBag size={64} className="mx-auto mb-4"/>
                 <p className="font-black text-xl">TOKO MASIH KOSONG</p>
                 <p className="font-bold">Ayo tambah barang dulu Bos!</p>
              </div>
           ) : (
              rewards.map((item) => (
                 <div key={item.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 transition-all group relative overflow-hidden">
                    
                    {/* Hapus Button */}
                    <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 size={18} />
                    </button>

                    <div className="text-center mt-2">
                       <div className="text-5xl mb-4 transform group-hover:scale-110 transition-all duration-300">{item.emoji}</div>
                       <h3 className="font-black text-lg text-slate-800 leading-tight mb-1">{item.name}</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SELF REWARD</p>
                    </div>

                    <div className="mt-6">
                       <button 
                         onClick={() => handleBuy(item.id, item.name, item.cost)}
                         className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                            user.xp >= item.cost 
                            ? "bg-slate-900 text-white hover:bg-green-500 hover:shadow-green-200" 
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                         }`}
                       >
                          {user.xp >= item.cost ? "BELI SEKARANG" : "XP KURANG"}
                          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                             {item.cost} XP
                          </span>
                       </button>
                    </div>
                 </div>
              ))
           )}
        </div>

      </div>
      <Navbar />
    </main>
  );
}