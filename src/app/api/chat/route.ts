import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) {
      console.error('❌ Token maniant dans les variables d environnement');
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
    }

    // URL directe du modèle
    const HF_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';

    console.log('📡 Envoi de la requête à Hugging Face...');

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<s>[INST] Tu es Klim, un assistant intelligent et utile. Réponds de manière concise et amicale en français. ${message} [/INST]`,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur API HF:', response.status, errorData);
      
      if (response.status === 503) {
        return NextResponse.json({ 
          error: 'Le modèle est en cours de chargement (cold start). Veuillez réessayer dans 15 secondes.' 
        }, { status: 503 });
      }
      
      throw new Error(`Erreur HF: ${response.status}`);
    }

    const data = await response.json();
    
    // Hugging Face renvoie souvent un tableau [{ generated_text: "..." }]
    let reply = '';
    if (Array.isArray(data) && data.length > 0) {
      reply = data[0].generated_text || '';
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else {
      reply = 'Réponse vide reçue de l IA.';
    }

    // Nettoyage si le modèle répète le prompt
    if (reply.includes('[/INST]')) {
      reply = reply.split('[/INST]').pop()?.trim() || reply;
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('💥 Erreur critique:', error);
    return NextResponse.json(
      { error: 'Échec de la connexion à l IA. Vérifiez les logs.' },
      { status: 500 }
    );
  }
}
