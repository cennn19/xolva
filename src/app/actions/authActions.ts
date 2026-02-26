"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// === KUNCI RAHASIA JWT ===
// Pastikan kamu menambahkan baris ini di file .env kamu:
// JWT_SECRET="bebas-isi-apa-saja-yang-panjang-dan-rahasia"
const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-rahasia-xolva-mas-cen-2026"
);

// === FUNGSI BANTUAN: BIKIN JWT (Menyegel Sesi) ===
async function setSession(email: string) {
  // Bikin token JWT yang isinya email, kadaluarsa dalam 7 hari
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secretKey);

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Hari
  const cookieStore = await cookies();
  
  // Simpan TOKEN-nya ke cookie, bukan email mentahnya
  cookieStore.set("xolva_session", token, { expires, httpOnly: true });
}

// === 1. LOGIN (Cek Email & Password Hash) ===
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const user = await prisma.user.findUnique({ where: { email } });

  // Cek 1: User ada gak?
  if (!user) {
    redirect("/login?error=not_found");
  }

  // Cek 2: Bandingkan password inputan dengan hash di database
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    redirect("/login?error=wrong_pass"); 
  }

  await setSession(email);
  redirect("/");
}

// === 2. REGISTER (Simpan Hash Password) ===
export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    redirect("/register?error=weak_pass");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    redirect("/register?error=exists");
  }

  // Hash password sebelum masuk database (salt 10)
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name: name || "Member Xolva",
      password: hashedPassword, // Simpan password yang sudah di-hash
      avatar: "😎",
      xp: 0,
      tier: "FREE"
    }
  });

  await setSession(email);
  redirect("/");
}

// === 3. LOGOUT ===
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("xolva_session");
  redirect("/login");
}

// === 4. CEK USER LOGIN (Membuka Segel JWT) ===
export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("xolva_session")?.value;
  
  if (!token) return null;

  try {
    // Verifikasi tokennya. Kalau token diedit di browser, proses ini bakal gagal.
    const { payload } = await jwtVerify(token, secretKey);
    const sessionEmail = payload.email as string;

    return await prisma.user.findUnique({
      where: { email: sessionEmail }
    });
  } catch (error) {
    // Kalau token rusak, palsu, atau kadaluarsa, kembalikan null
    console.error("Sesi tidak valid atau sudah kadaluarsa:", error);
    return null;
  }
}