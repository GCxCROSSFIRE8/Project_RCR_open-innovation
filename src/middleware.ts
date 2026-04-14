import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simple middleware. In a real production app, 
// you would use firebase-admin to verify a session cookie.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // We'll primarily rely on client-side AuthContext for the demo,
  // but we can add some server-side routing logic here if needed.
  
  // Example: If trying to access /dashboard directly, we could check for a cookie
  // For now, we'll let AuthContext handle the redirect to /auth to keep it simple.

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
