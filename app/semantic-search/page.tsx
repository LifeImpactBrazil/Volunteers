// app/semantic-search/page.tsx
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
  age: number | null;
  hours_per_week: number;
  days: string[];
  specialties: string[];
  workshops: string[];
  workshop_other: string | null;
  about: string;
  created_at: string;
  hybrid_score: number;
}

export default function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('2022-01-01');
  const [dateTo, setDateTo]     = useState('2040-12-31');
  const [limit, setLimit]       = useState(100);
  const [results, setResults]   = useState<Volunteer[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  /* ---------- handlers ---------- */
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dateFrom, dateTo, limit })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data: Volunteer[] = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results.length) return;
    const headers = [
      'cpf','full_name','email','phone','unidade','religion','marital_status',
      'street','number','complement','district','city','state','cep',
      'age','hours_per_week','days','specialties','workshops','workshop_other',
      'about','created_at','hybrid_score'
    ];
    const rows = [
      headers.join(','),
      ...results.map(v =>
        headers.map(h => {
          const val = (v as any)[h];
          if (Array.isArray(val)) return `"${val.join(';')}"`;
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `volunteers_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- UI ---------- */
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Busca Semântica de Voluntários</h1>

      {/* Query textarea */}
      <textarea
        className="w-full border rounded p-2 mb-4 h-24 resize-y"
        rows={3}
        placeholder="Descreva o perfil desejado (pode usar várias linhas)"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium">Data de</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Data até</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Limite de resultados</label>
          <input
            type="number"
            min={1}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      {/* Buttons */}
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

      {/* Results */}
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
            {v.age != null && <p>Idade: {v.age}</p>}
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
              Similaridade: {v.hybrid_score.toFixed(3)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
