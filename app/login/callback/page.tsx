'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const redirect = useSearchParams().get('redirect') || '/semantic-search';

  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();       // sets cookie
      router.replace(redirect);               // go to desired page
    })();
  }, [redirect, router, supabase]);

  return <p className="p-6">Validando link mágico…</p>;
}
