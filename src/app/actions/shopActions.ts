"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. TAMBAH BARANG DAGANGAN
export async function createReward(name: string, cost: number, emoji: string) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return { success: false };

    await prisma.reward.create({
      data: {
        name,
        cost,
        emoji,
        userId: user.id
      }
    });

    revalidatePath("/shop"); // Kita bakal bikin page ini nanti
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 2. LIHAT DAFTAR BARANG
export async function getRewards() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return [];

    return await prisma.reward.findMany({
      where: { userId: user.id },
      orderBy: { cost: 'asc' } // Urutkan dari yang termurah
    });
  } catch (error) {
    return [];
  }
}

// 3. BELI HADIAH (REDEEM XP)
export async function redeemReward(rewardId: string) {
  try {
    const user = await prisma.user.findFirst();
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

    if (!user || !reward) return { success: false, message: "Data tidak ditemukan" };

    // Cek Duit Cukup Gak?
    if (user.xp < reward.cost) {
      return { success: false, message: "XP Tidak Cukup! Kerja lagi sana! 😡" };
    }

    // Transaksi: Kurangi XP User
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { decrement: reward.cost } }
    });

    revalidatePath("/");     // Update dashboard
    revalidatePath("/shop"); // Update toko
    
    return { success: true, message: `Berhasil menukar "${reward.name}"! Nikmati ya! 🥳` };
  } catch (error) {
    return { success: false, message: "Gagal transaksi" };
  }
}

// 4. HAPUS BARANG (Kalau bosan)
export async function deleteReward(id: string) {
  try {
    await prisma.reward.delete({ where: { id } });
    revalidatePath("/shop");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}