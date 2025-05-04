import Link from 'next/link';

export default function Page() {
  return (
    <div
      className="relative h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Logo + Título fixo mais acima */}
      <div className="flex flex-col items-center pt-20">
        <img src="/logo.png" alt="Logo" className="w-32 mb-4" />
        <h1 className="text-4xl text-white font-bold">Junte-se a nós</h1>
      </div>

      {/* Botão centralizado na tela */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Link href="/register" className="pointer-events-auto">
          <button className="px-6 py-3 bg-green-600 text-white rounded shadow-lg">
            Cadastrar
          </button>
        </Link>
      </div>
    </div>
  );
}
