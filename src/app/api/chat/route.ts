import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

if (!process.env.HUGGINGFACE_API_TOKEN) {
  console.error("❌ Token manquant");
}

// On force l'URL avec le protocole https explicite
const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN, {
  endpoint: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3'
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message requis' }, { status: 400 });

    console.log(`🤖 Envoi vers HF...`);

    // On appelle directement sans passer par la méthode générique si besoin, 
    // mais ici on garde textGeneration en ciblant le modèle dans le endpoint ci-dessus
    // OU on utilise la méthode standard car le endpoint est global
    
    // Correction: Si on met l'endpoint complet dans le constructeur, on ne précise plus le modèle dans la requête
    // Mais le SDK attend parfois le modèle. La méthode la plus robuste est d'utiliser l'URL directe via fetch si le SDK échoue.
    
    // Tentative avec le SDK configuré explicitement
    const response = await hf.textGeneration({
      // On ne met pas 'model' ici car il est dans l'endpoint du constructeur, 
      // MAIS le SDK exige souvent le paramètre model même avec endpoint.
      // Pour éviter la confusion, utilisons l'approche standard mais avec un timeout manuel si possible,
      // ou simplement réessayons avec le modèle spécifié car l'erreur est DNS.
      
      // Réinitialisons le client sans endpoint fixe pour tester la résolution DNS native de Node sur Vercel
      // En fait, l'erreur ENOTFOUND suggère que Vercel ne trouve pas le host.
      // Astuce: Utiliser une requête fetch native contourne parfois les problèmes du SDK.
    });
    
    // --- NOUVELLE APPROCHE ROBUSTE : Utiliser fetch directement ---
    // Cela contourne les problèmes de résolution DNS du SDK HF
    const hfUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';
    
    const res = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<s>[INST] Tu es Klim, un assistant utile. Réponds brièvement en français. ${message} [/INST]`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        }
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`HF Error ${res.status}: ${JSON.stringify(errData)}`);
    }

    const data = await res.json();
    let reply = data[0]?.generated_text || "Pas de réponse générée.";
    
    // Nettoyage
    if (reply.includes('[/INST]')) reply = reply.split('[/INST]').pop()!.trim();

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('❌ Erreur détaillée:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur de connexion à l\'IA' },
      { status: 500 }
    );
  }
}
