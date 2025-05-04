import Link from 'next/link';

export default function Page() {
  return (
    <div
      className="flex flex-col items-center justify-start pt-24 h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <img src="/logo.png" alt="Logo" className="w-32 mb-4" />
      <h1 className="text-4xl text-white font-bold">Junte-se a nós</h1>
      <Link href="/register">
        <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded">Cadastrar</button>
      </Link>
    </div>
  );
}
