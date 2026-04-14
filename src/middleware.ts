import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // NextAuth sets authjs.session-token on http, __Secure-authjs.session-token on https
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ??
    req.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*'],
}
