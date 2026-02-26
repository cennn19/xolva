"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./authActions";

// 1. BUAT MISI BARU (Sekarang nerima deadline)
export async function createHabit(data: { name: string; category: string; expReward: number; targetValue?: number; deadline?: Date | null }) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, message: "Belum Login" };

    // === 🛡️ LOGIKA ANTI-CHEAT MULAI DI SINI ===
    
    // 1. Validasi Nama: Cegah misi kosong spasi doang
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: "Nama misi tidak valid" };
    }

    // 2. Siapkan batas wajar sesuai aturan game Xolva
    let minExp = 0;
    let maxExp = 0;
    const categoryUpper = data.category.toUpperCase();

    if (categoryUpper === 'HARIAN') { minExp = 3; maxExp = 6; }
    else if (categoryUpper === 'MINGGUAN') { minExp = 15; maxExp = 25; }
    else if (categoryUpper === 'BULANAN') { minExp = 40; maxExp = 60; }
    else if (categoryUpper === 'PROJECT') { minExp = 300; maxExp = 600; }
    else {
      return { success: false, message: "Kategori curang/tidak dikenali" };
    }

    // 3. CLAMPING: Paksa nilai expReward agar tidak tembus batas
    // Misal: dia suntik 9999 di Harian, Math.min(9999, 6) = 6. 
    // Jadi dia cuma dapet 6 XP walau nyoba curang.
    const safeExpReward = Math.min(Math.max(data.expReward, minExp), maxExp);

    // === 🛡️ LOGIKA ANTI-CHEAT SELESAI ===

    await prisma.habit.create({
      data: {
        name: data.name.trim(), // Buang spasi berlebih
        category: categoryUpper, // Pastikan selalu UPPERCASE di database
        expReward: safeExpReward, // 👈 Pake angka yang udah aman
        userId: user.id,
        targetValue: data.targetValue && data.targetValue > 0 ? data.targetValue : 1, // Cegah target negatif/0
        currentValue: 0,
        lastCompleted: null,
        deadline: data.deadline || null
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal membuat misi:", error);
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

// 3. AMBIL DATA & RESET (OPTIMASI N+1 QUERY)
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const idsToReset: string[] = []; // 👈 Tampung ID yang mau di-reset
    const finalData: any[] = [];

    allHabits.forEach((habit) => {
      if (habit.category === "Project" || habit.category === "PROJECT") {
        if (habit.currentValue < habit.targetValue) finalData.push(habit);
        return;
      }

      let lastUpdate = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
      if (lastUpdate) lastUpdate.setHours(0, 0, 0, 0);

      let needsReset = false;

      if (lastUpdate) {
        if (habit.category.toUpperCase() === "HARIAN" && lastUpdate.getTime() < today.getTime()) needsReset = true;
        else if (habit.category.toUpperCase() === "MINGGUAN" && lastUpdate.getTime() < startOfWeek.getTime()) needsReset = true;
        else if (habit.category.toUpperCase() === "BULANAN" && lastUpdate.getTime() < startOfMonth.getTime()) needsReset = true;
      }

      if (needsReset) {
        idsToReset.push(habit.id); // 👈 Kumpulkan ID-nya saja
        habit.currentValue = 0;
        habit.lastCompleted = null;
      }

      if (habit.currentValue < habit.targetValue) {
        finalData.push(habit);
      }
    });

    // 👈 EKSEKUSI DATABASE SEKALI JALAN (Lebih cepat & ringan buat Vercel)
    if (idsToReset.length > 0) {
      await prisma.habit.updateMany({
        where: { id: { in: idsToReset } },
        data: { currentValue: 0, lastCompleted: null }
      });
    }

    return { success: true, data: finalData, user: user };
  } catch (error) {
    console.error("Error getHabits:", error);
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
export async function addProgress(habitId: string, note?: string) {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return { success: false };

    // Cegah nambah kalau udah mentok
    if (habit.currentValue >= habit.targetValue) return { success: false };

    // Siapkan data update. Kalau ada note (buat Project), sekalian bikin log.
    const updateData: any = {
      currentValue: { increment: 1 }
    };

    if (note && note.trim() !== "") {
      updateData.logs = { create: { note } };
    }

    const updated = await prisma.habit.update({
      where: { id: habitId },
      data: updateData
    });

    // Jika target tercapai, panggil completeHabit buat cairin XP
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