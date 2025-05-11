/* ------------------------------------------------------------------
   Middleware: protege apenas as rotas de busca
   - Requer login Supabase + e‑mail presente em SEARCH_ADMINS
   ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';

/** Rotas que exigem autenticação + e‑mail autorizado */
const PROTECTED = [
  '/search',
  '/semantic-search',
  '/api/volunteers/search',
  '/api/semantic-search',
];

/** Lista de admins vem da env var (vírgulas) */
const ADMIN_EMAILS = (process.env.SEARCH_ADMINS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function middleware(req: NextRequest) {
  /* Rota não protegida? segue fluxo normal */
  const isProtected = PROTECTED.some(path =>
    req.nextUrl.pathname.startsWith(path),
  );
  if (!isProtected) return NextResponse.next();

  /* Cria client Supabase na camada middleware */
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  /* Se não logado → /login */
  if (!session) {
    const login = req.nextUrl.clone();
    login.pathname = '/login';
    login.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  /* Se logado, checa se e‑mail está autorizado */
  const email = (session.user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    const unauth = req.nextUrl.clone();
    unauth.pathname = '/unauthorized';
    unauth.search = ''; // remove querystring
    return NextResponse.redirect(unauth);
  }

  /* ok */
  return res;
}

/* Diz ao Next que o middleware só corre nas rotas abaixo */
export const config = {
  matcher: [
    '/search/:path*',
    '/semantic-search/:path*',
    '/api/volunteers/search',
    '/api/semantic-search',
  ],
};
