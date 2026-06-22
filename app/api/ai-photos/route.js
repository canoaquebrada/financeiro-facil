import { NextResponse } from 'next/server';
import { requireLogin } from '../../../lib/api';

export const runtime = 'nodejs';

export async function POST(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  try {
    const { image, prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Envie um prompt.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key do OpenRouter não configurada.' }, { status: 500 });
    }

    const content = image
      ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }]
      : prompt;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Erro ao gerar imagem.' },
        { status: response.status }
      );
    }

    const message = data.choices?.[0]?.message;

    if (message?.images?.[0]?.image_url?.url) {
      return NextResponse.json({ image: message.images[0].image_url.url });
    }

    if (message?.content) {
      const match = message.content.match(/https?:\/\/[^\s]+(?:png|jpg|jpeg|gif|webp)/i);
      if (match) {
        return NextResponse.json({ image: match[0] });
      }
    }

    return NextResponse.json({ error: 'Nenhuma imagem retornada pelo modelo.' }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
