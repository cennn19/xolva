"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "./authActions";
import { revalidatePath } from "next/cache";

// 1. AMBIL SEMUA POSTINGAN (FEED)
export async function getSocialFeed() {
  const user = await getAuthUser();
  
  const posts = await prisma.habitLog.findMany({
    orderBy: { createdAt: 'desc' }, // Yang baru di atas
    take: 20, // Ambil 20 post terakhir dulu
    include: {
      user: { select: { name: true, avatar: true, tier: true } }, // Ambil data user
      likes: true, // Ambil siapa yang like
      _count: { select: { comments: true } } // Hitung jumlah komen
    }
  });

  // Kita olah datanya biar enak dipakai di Frontend
  return posts.map(post => ({
    ...post,
    isLiked: post.likes.some(like => like.userId === user?.id), // Cek apa kita udah like?
    likeCount: post.likes.length,
    commentCount: post._count.comments
  }));
}

// 2. TOMBOL LIKE / UNLIKE
export async function toggleLike(habitLogId: string) {
  const user = await getAuthUser();
  if (!user) return;

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_habitLogId: { userId: user.id, habitLogId }
    }
  });

  if (existingLike) {
    // Kalau udah like -> Hapus (Unlike)
    await prisma.like.delete({ where: { id: existingLike.id } });
  } else {
    // Kalau belum -> Tambah Like
    await prisma.like.create({
      data: { userId: user.id, habitLogId }
    });
  }
  
  revalidatePath('/social'); // Refresh halaman biar angkanya berubah
}

// 3. KIRIM KOMENTAR
export async function postComment(habitLogId: string, text: string) {
  const user = await getAuthUser();
  if (!user || !text) return;

  await prisma.comment.create({
    data: {
      text,
      userId: user.id,
      habitLogId
    }
  });

  revalidatePath('/social');
}