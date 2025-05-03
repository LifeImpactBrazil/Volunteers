// app/api/embeddings/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  const { text } = await req.json();
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return NextResponse.json(res.data[0].embedding);
}
