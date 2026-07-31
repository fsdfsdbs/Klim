import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) {
      console.error('❌ Token manquant dans les variables d\'environnement');
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
    }

    const HF_URL = 'https://router.huggingface.co/v1/chat/completions';

    console.log('📡 Envoi de la requête à Hugging Face...');
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'Tu es Klim, un assistant intelligent et utile. Réponds de manière concise et amicale en français.',
          },
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

      if (response.status === 503) {
        return NextResponse.json(
          { error: 'Le modèle est en cours de chargement (cold start). Veuillez réessayer dans 15 secondes.' },
          { status: 503 }
        );
      }

      throw new Error(`Erreur HF: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Réponse vide reçue de l\'IA.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('💥 Erreur critique:', error);
    return NextResponse.json(
      { error: 'Échec de la connexion à l\'IA. Vérifiez les logs.' },
      { status: 500 }
    );
  }
}
