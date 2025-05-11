'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || // definido em produção
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();
  const redirect = useSearchParams().get('redirect') || '/semantic-search';

  const supabase = createClientComponentClient();

  const handleLogin = async () => {
    setMsg('Enviando link…');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE_URL}/login/callback?redirect=${redirect}`,
      },
    });
    setMsg(error ? error.message : 'Link enviado! Verifique seu e‑mail.');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Seu e‑mail"
        className="border p-2 rounded mb-2"
      />
      <button onClick={handleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded">
        Entrar
      </button>

      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
