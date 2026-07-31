import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      inputs: `[INST] Tu es un assistant utile et amical. Réponds de manière concise en français. ${message} [/INST]`,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      },
    });

    return NextResponse.json({ reply: response.generated_text });
  } catch (error) {
    console.error('Erreur Hugging Face:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    );
  }
}
