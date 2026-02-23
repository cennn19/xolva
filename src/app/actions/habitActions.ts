"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./authActions";

// 1. BUAT MISI BARU (Sekarang nerima deadline)
export async function createHabit(data: { name: string; category: string; expReward: number; targetValue?: number; deadline?: Date | null }) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, message: "Belum Login" };

    await prisma.habit.create({
      data: {
        name: data.name,
        category: data.category,
        expReward: data.expReward,
        userId: user.id,
        targetValue: data.targetValue || 1,
        currentValue: 0,
        lastCompleted: null,
        deadline: data.deadline || null // 👈 Simpen ke database
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 2. HAPUS MISI
export async function deleteHabit(habitId: string) {
  try {
    await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 3. AMBIL DATA
// 3. AMBIL DATA (Udah Pinter Bedain Harian, Mingguan, Bulanan)
export async function getHabits() {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, data: [], user: null };

    const allHabits = await prisma.habit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { logs: true }
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Jam 00:00 hari ini
    
    // Cari hari Senin minggu ini
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    // Cari tanggal 1 bulan ini
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Filter & Reset logic
    const filteredHabits = await Promise.all(allHabits.map(async (habit) => {
      // 1. PROJECT: Cuma hilang kalau target udah penuh (Gak pernah reset)
      if (habit.category === "Project" || habit.category === "PROJECT") {
          return habit.currentValue >= habit.targetValue ? null : habit;
      }

      // Ambil tanggal terakhir misi ini di-update / diselesaikan
      // (Bisa pakai lastCompleted, tapi buat amannya pakai kapan terakhir dimodifikasi)
      let lastUpdate = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
      if (lastUpdate) lastUpdate.setHours(0, 0, 0, 0);

      let needsReset = false;

      // 2. TENTUKAN APAKAH MISI INI KEDALUWARSA & BUTUH DI-RESET PROGRESSNYA
      if (lastUpdate) {
          if (habit.category === "HARIAN" || habit.category === "Harian") {
              if (lastUpdate.getTime() < today.getTime()) needsReset = true;
          } else if (habit.category === "MINGGUAN" || habit.category === "Mingguan") {
              if (lastUpdate.getTime() < startOfWeek.getTime()) needsReset = true;
          } else if (habit.category === "BULANAN" || habit.category === "Bulanan") {
              if (lastUpdate.getTime() < startOfMonth.getTime()) needsReset = true;
          }
      }

      // 3. EKSEKUSI RESET (Biar besok/minggu depan balik ke 0/3)
      if (needsReset) {
          await prisma.habit.update({
             where: { id: habit.id },
             data: { currentValue: 0, lastCompleted: null }
          });
          habit.currentValue = 0;
          habit.lastCompleted = null;
      }

      // 4. SEMBUNYIKAN KALAU UDAH BERES DI PERIODE INI
      if (habit.currentValue >= habit.targetValue) return null;

      // Munculin di layar karena belum beres
      return habit;
    }));

    // Bersihin array dari yang nilainya 'null' (yang disembunyiin)
    const finalData = filteredHabits.filter(h => h !== null);

    return { success: true, data: finalData, user: user };
  } catch (error) {
    return { success: false, data: [], user: null };
  }
}
// 4. SELESAIKAN MISI (Udah Fix: Gak Dihapus, Cuma Di-Update)
// === PERBAIKAN DI habitActions.ts ===

export async function completeHabit(habitId: string) {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return { success: false };

    const user = await getAuthUser();
    if (!user) return { success: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Logika Streak tetep sama
    let newStreak = user.currentStreak;
    if (user.lastActive) {
      const lastActive = new Date(user.lastActive);
      lastActive.setHours(0, 0, 0, 0);
      const diffDays = (today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24);
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: habit.expReward }, currentStreak: newStreak, lastActive: new Date() }
      }),
      prisma.habitHistory.create({
        data: { habitName: habit.name, category: habit.category, xpEarned: habit.expReward, userId: user.id }
      }),
      prisma.habit.update({
        where: { id: habitId },
        data: { 
          lastCompleted: new Date(),
          // PERBAIKAN: Paksa currentValue jadi targetValue apa pun kategorinya
          // Biar filter (habit.currentValue >= habit.targetValue) di getHabits selalu True
          currentValue: habit.targetValue 
        }
      })
    ]);
    
    revalidatePath("/");
    return { success: true, earnedXp: habit.expReward };
  } catch (error) {
    console.error("Error completing habit:", error);
    return { success: false };
  }
}

// 5. UPDATE PROFILE
export async function updateProfile(name: string, avatar: string) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false };

    await prisma.user.update({
      where: { id: user.id },
      data: { name, avatar }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 6. NAMBAH PROGRESS PROJECT
export async function addProgress(habitId: string, note: string) {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return { success: false };

    // Cegah nambah kalau udah mentok
    if (habit.currentValue >= habit.targetValue) return { success: false };

    const updated = await prisma.habit.update({
      where: { id: habitId },
      data: { 
        currentValue: { increment: 1 }, 
        logs: { create: { note } } 
      }
    });

    // Jika target tercapai, panggil completeHabit buat cairin XP & masuk History
    if (updated.currentValue >= updated.targetValue) {
      const res = await completeHabit(habitId);
      return { success: true, status: 'completed', earnedXp: res?.earnedXp };
    }

    revalidatePath("/");
    return { success: true, status: 'progress' };
  } catch (error) {
    console.error("Error addProgress:", error);
    return { success: false };
  }
}

// 7. RESET AKUN
export async function resetAccount() {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false };

    await prisma.$transaction([
      prisma.habit.deleteMany({ where: { userId: user.id } }),
      prisma.habitHistory.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { xp: 0, level: 1, currentStreak: 0, lastActive: null },
      }),
    ]);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 8. STATS MINGGUAN
export async function getWeeklyStats() {
  try {
    const user = await getAuthUser();
    if (!user) return [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    return await prisma.habitHistory.findMany({
      where: { userId: user.id, completedAt: { gte: sevenDaysAgo } },
      orderBy: { completedAt: 'asc' },
    });
  } catch (error) {
    return [];
  }
}

// 9. AMBIL RIWAYAT MISI (History)
export async function getFullHistory() {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, data: [] };

    const history = await prisma.habitHistory.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' }, // Yang paling baru di atas
      take: 50 // Ambil 50 data terakhir biar nggak keberatan
    });

    return { success: true, data: history };
  } catch (error) {
    return { success: false, data: [] };
  }
}