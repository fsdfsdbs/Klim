const HF_URL = 'https://router.huggingface.co/v1/chat/completions';

const response = await fetch(HF_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
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
  throw new Error(`Erreur HF: ${response.status}`);
}

const data = await response.json();
const reply = data.choices?.[0]?.message?.content || 'Réponse vide reçue de l\'IA.';

return NextResponse.json({ reply });
