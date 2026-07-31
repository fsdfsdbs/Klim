import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = 'Tu es Klim, un assistant intelligent et utile. Réponds de manière concise et amicale en français.';

async function callHuggingFace(message: string, model: string) {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error('Token Hugging Face manquant');

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      max_tokens: 250,
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Erreur API HF:', response.status, errorData);
    throw new Error(`Erreur HF: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Réponse vide reçue de l\'IA.';
}

async function callGemini(message: string, model: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Clé Gemini manquante');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
        topP: 0.95,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Erreur API Gemini:', response.status, errorData);
    throw new Error(`Erreur Gemini: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text || 'Réponse vide reçue de l\'IA.'
  );
}

export async function POST(req: NextRequest) {
  try {
    const { message, provider, model } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    console.log(`📡 Envoi de la requête à ${provider} (${model})...`);

    let reply: string;
    if (provider === 'gemini') {
      reply = await callGemini(message, model || 'gemini-2.5-flash');
    } else {
      reply = await callHuggingFace(message, model || 'Qwen/Qwen2.5-7B-Instruct');
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('💥 Erreur critique:', error);
    return NextResponse.json(
      { error: 'Échec de la connexion à l\'IA. Vérifiez les logs.' },
      { status: 500 }
    );
  }
}
