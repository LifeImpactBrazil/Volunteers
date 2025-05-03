// app/api/volunteers/search/route.ts
import { NextResponse } from 'next/server';
import { supabase }   from '../../../../lib/supabaseClient';
import OpenAI         from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extrai restrições e *todos* os dias citados
function parseConstraints(text: string) {
  const c: any = {};
  // horas
  const more = text.match(/(?:pelo menos|mais de)\s*(\d+)\s*horas?/i);
  const less = text.match(/(?:até|menos de)\s*(\d+)\s*horas?/i);
  if (more) c.min_hours = +more[1];
  if (less) c.max_hours = +less[1];
  // dias por semana (quantidade)
  const daysCount = text.match(/(\d+)\s*vez(?:es)?\s*por semana/i);
  if (daysCount) c.min_days = +daysCount[1];
  // dias específicos (todas as ocorrências)
  const allDays = Array.from(text.matchAll(/\b(segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/gi))
    .map(m => m[1].toLowerCase());
  if (allDays.length) c.day_filters = Array.from(new Set(allDays));
  return c;
}

export async function POST(req: Request) {
  const { query, limit } = await req.json() as { query: string; limit?: number };

  // 1) gerar embedding
  const embRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });
  const embedding = embRes.data[0].embedding;

  // 2) extrai constraints + day_filters[]
  const {
    min_hours   = null,
    max_hours   = null,
    min_days    = null,
    day_filters = null
  } = parseConstraints(query);

  // 3) chama RPC com array de dias
  const { data, error } = await supabase.rpc('match_volunteers', {
    query_embedding: embedding,
    limit_count:     limit     ?? 10,
    min_hours,
    max_hours,
    min_days,
    day_filters
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
