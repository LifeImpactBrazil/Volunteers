'use client';

import { useState } from 'react';

interface Volunteer {
  cpf: string;
  full_name: string;
  email: string;
  phone: string;
  unidade: string;
  religion: string;
  marital_status: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  cep: string;
  hours_per_week: number;
  days: string[];
  specialties: string[];
  workshops: string[];
  workshop_other: string | null;
  about: string;
  created_at: string;
  similarity: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/volunteers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 100 })
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Volunteer[] = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results.length) return;
    const headers = [
      'cpf','full_name','email','phone','unidade','religion','marital_status',
      'street','number','complement','district','city','state','cep',
      'hours_per_week','days','specialties','workshops','workshop_other',
      'about','created_at','similarity'
    ];
    const csvRows = [
      headers.join(','),
      ...results.map(v =>
        headers.map(h => {
          const val = (v as any)[h];
          if (Array.isArray(val)) return `"${val.join(';')}"`;
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volunteers_search.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Busca Semântica de Voluntários</h1>

      <textarea
        className="w-full border rounded p-2 mb-4"
        rows={3}
        placeholder="Descreva o perfil desejado"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
        <button
          onClick={handleExportCSV}
          disabled={!results.length}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <ul className="space-y-6">
        {results.map(v => (
          <li key={v.cpf} className="border p-4 rounded-lg">
            <p><strong>{v.full_name}</strong> ({v.cpf})</p>
            <p>Email: {v.email} · Telefone: {v.phone}</p>
            <p>Unidade: {v.unidade}</p>
            <p>Fé / Religião: {v.religion} · Estado civil: {v.marital_status}</p>
            <p>
              Endereço: {v.street}, {v.number}
              {v.complement ? `, ${v.complement}` : ''}, {v.district}, {v.city}-{v.state}, {v.cep}
            </p>
            <p>Horas/semana: {v.hours_per_week}</p>
            <p>Dias: {v.days.join(', ')}</p>
            <p>Especialidades: {v.specialties.join(', ')}</p>
            {v.workshops.length > 0 && (
              <p>
                Oficinas: {v.workshops.join(', ')}
                {v.workshop_other ? ` (${v.workshop_other})` : ''}
              </p>
            )}
            <p>Sobre: {v.about}</p>
            <p className="text-sm text-gray-500">
              Cadastrado em: {new Date(v.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Similaridade: {v.similarity != null ? v.similarity.toFixed(3) : 'N/A'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
