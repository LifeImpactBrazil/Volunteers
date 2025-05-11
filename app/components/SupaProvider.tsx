'use client';

import { useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

export default function SupaProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: any;
}) {
  // cria o client apenas no browser
  const supabaseClient = useRef(createClientComponentClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient.current}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
