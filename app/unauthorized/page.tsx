// app/unauthorized/page.tsx
export default function Unauthorized() {
  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Acesso negado</h1>
      <p className="text-gray-700">
        Você não tem permissão para acessar esta página.
      </p>
      <p className="mt-4">
        Caso ache que isso seja um erro, entre em contato com o administrador.
      </p>
    </div>
  );
}
