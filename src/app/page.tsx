import Chatbot from '@/components/Chatbot';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Bienvenue sur Klim
        </h1>
        <p className="text-gray-600">
          Votre assistant intelligent propulsé par l'IA
        </p>
      </div>
      <Chatbot />
    </main>
  );
}
