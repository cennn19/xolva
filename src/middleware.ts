import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cek apakah user punya "Kartu Akses" (Cookie)
  const session = request.cookies.get('xolva_session');
  const path = request.nextUrl.pathname;

  // === ATURAN 1: BELUM LOGIN ===
  // Kalau gak punya session, DAN bukan lagi di halaman Login ATAU Register
  if (!session && !path.startsWith('/login') && !path.startsWith('/register')) {
    // Tendang ke halaman Login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === ATURAN 2: SUDAH LOGIN ===
  // Kalau sudah punya session, TAPI mau masuk halaman Login ATAU Register (ngapain?)
  if (session && (path.startsWith('/login') || path.startsWith('/register'))) {
    // Lempar balik ke Dashboard (Home)
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Tentukan halaman mana yang dijaga Satpam
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};