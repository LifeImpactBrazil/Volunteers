import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import SupaProvider from './components/SupaProvider';
import '../styles/globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // cria client só para obter a sessão no servidor
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html>
      <body>
        {/* passa apenas a sessão (serializável) */}
        <SupaProvider initialSession={session}>{children}</SupaProvider>
      </body>
    </html>
  );
}
