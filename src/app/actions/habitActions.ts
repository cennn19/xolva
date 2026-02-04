"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./authActions"; // <--- IMPORT INI

// 1. BUAT MISI BARU
export async function createHabit(data: { name: string; category: string; expReward: number; targetValue?: number }) {
  try {
    // 👇 GANTI BAGIAN INI (JANGAN findFirst LAGI)
    const user = await getAuthUser(); 
    if (!user) return { success: false, message: "Belum Login" };
    // 👆 SAMPAI SINI

    await prisma.habit.create({
      data: {
        name: data.name,
        category: data.category,
        expReward: data.expReward, 
        userId: user.id,
        targetValue: data.targetValue || 1, 
        currentValue: 0,
        lastCompleted: null
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
export async function getHabits() {
  try {
    // 👇 GANTI BAGIAN INI JUGA
    const user = await getAuthUser();
    if (!user) return { success: false, data: [], user: null };
    // 👆

    const allHabits = await prisma.habit.findMany({ 
      where: { userId: user.id }, // Ambil punya user ini aja
      orderBy: { createdAt: 'desc' },
      include: { logs: true } 
    });

    // ... (Sisa logic filter tanggal biarkan sama) ...
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredHabits = allHabits.filter(habit => {
      if (habit.category === "Project" || habit.category === "PROJECT") return true;
      if (!habit.lastCompleted) return true; 
      const lastComp = new Date(habit.lastCompleted);
      lastComp.setHours(0, 0, 0, 0);
      return lastComp.getTime() < today.getTime();
    });

    return { success: true, data: filteredHabits, user: user };
  } catch (error) {
    return { success: false, data: [], user: null };
  }
}

// 4. SELESAIKAN MISI
export async function completeHabit(habitId: string) {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return { success: false };

    const user = await prisma.user.findFirst();
    
    if (user) {
      // Logic Streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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

      await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: habit.expReward },
          currentStreak: newStreak,
          lastActive: new Date(),
        }
      });

      // Simpan History
      await prisma.habitHistory.create({
        data: {
          habitName: habit.name,
          category: habit.category,
          xpEarned: habit.expReward,
          userId: user.id,
        }
      });
    }

    await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath("/");
    return { success: true, earnedXp: habit.expReward };
  } catch (error) {
    return { success: false };
  }
}

// 5. UPDATE PROFILE
export async function updateProfile(name: string, avatar: string) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return { success: false };

    await prisma.user.update({
      where: { id: user.id },
      data: { name, avatar } // Kalau Langkah 1 sukses, ini gak akan merah
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 6. NAMBAH PROGRESS
export async function addProgress(habitId: string, note: string) {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return { success: false };

    const updated = await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentValue: { increment: 1 },
        logs: { create: { note } }
      }
    });

    if (updated.currentValue >= updated.targetValue) {
      const res = await completeHabit(habitId);
      // Pake optional chaining biar aman di page.tsx
      return { success: true, status: 'completed', earnedXp: res?.earnedXp };
    }

    revalidatePath("/");
    return { success: true, status: 'progress' };
  } catch (error) {
    return { success: false };
  }
}

// 7. RESET AKUN
export async function resetAccount() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return { success: false };

    await prisma.$transaction([
      prisma.habit.deleteMany({ where: { userId: user.id } }),
      prisma.habitHistory.deleteMany({ where: { userId: user.id } }),
      prisma.habitLog.deleteMany({}),
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
    const user = await prisma.user.findFirst();
    if (!user) return [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    return await prisma.habitHistory.findMany({
      where: {
        userId: user.id,
        completedAt: { gte: sevenDaysAgo },
      },
      orderBy: { completedAt: 'asc' },
    });
  } catch (error) {
    return [];
  }
}