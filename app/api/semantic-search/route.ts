// app/api/semantic-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import OpenAI       from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Body {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  const { query, dateFrom, dateTo, limit } = (await request.json()) as Body;

  if (!query?.trim()) {
    return NextResponse.json(
      { error: 'O termo de pesquisa é obrigatório.' },
      { status: 400 }
    );
  }

  try {
    // 1) Generate embedding for the query
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    const embedding = embRes.data[0].embedding;

    // 2) Call our hybrid-search RPC
    const { data: matches, error: rpcError } = await supabase.rpc(
      'search_volunteers',
      {
        q_text:      query,
        q_embedding: embedding,
        date_from:   dateFrom ?? '1900-01-01',
        date_to:     dateTo   ?? '9999-12-31',
        k:           limit     ?? 20
      }
    );
    if (rpcError) {
      console.error('RPC error:', rpcError);
      return NextResponse.json(
        { error: rpcError.message },
        { status: 500 }
      );
    }

    // 3) Fetch full volunteer records for returned CPFs
    const cpfs = (matches as any[]).map(m => m.cpf);
    const { data: volunteers, error: joinError } = await supabase
      .from('volunteers')
      .select('*')
      .in('cpf', cpfs);
    if (joinError) {
      console.error('Join error:', joinError);
      return NextResponse.json(
        { error: joinError.message },
        { status: 500 }
      );
    }

    // 4) Merge similarity score into each record as `hybrid_score`
    const results = (matches as any[]).map(m => {
      const v = (volunteers as any[]).find(v => v.cpf === m.cpf)!;
      return { ...v, hybrid_score: m.hybrid_score };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno ao executar a busca.' },
      { status: 500 }
    );
  }
}
