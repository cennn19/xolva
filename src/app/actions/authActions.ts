"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// === FUNGSI BANTUAN ===
async function setSession(email: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Hari
  const cookieStore = await cookies();
  cookieStore.set("xolva_session", email, { expires, httpOnly: true });
}

// 1. LOGIN (Cek Email & Password)
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const user = await prisma.user.findUnique({ where: { email } });

  // Cek 1: User ada gak?
  if (!user) {
    redirect("/login?error=not_found");
  }

  // Cek 2: Password benar gak?
  if (user.password !== password) {
    redirect("/login?error=wrong_pass"); // Password Salah
  }

  await setSession(email);
  redirect("/");
}

// 2. REGISTER (Simpan Email & Password)
export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    redirect("/register?error=weak_pass"); // Password kependekan
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    redirect("/register?error=exists");
  }

  await prisma.user.create({
    data: {
      email,
      name: name || "Member Xolva",
      password, // <--- Simpan Password
      avatar: "😎",
      xp: 0,
      tier: "FREE"
    }
  });

  await setSession(email);
  redirect("/");
}

// 3. LOGOUT
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("xolva_session");
  redirect("/login");
}

// 4. CEK USER LOGIN
export async function getAuthUser() {
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get("xolva_session")?.value;
  
  if (!sessionEmail) return null;

  return await prisma.user.findUnique({ 
    where: { email: sessionEmail },
    include: { rewards: true }
  });
}