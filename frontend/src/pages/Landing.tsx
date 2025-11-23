// src/pages/Landing.tsx
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Calendar, Heart } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Aura
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
            Monitoramento Inteligente
            <br />
            de Tremores Parkinsonianos
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Acompanhe em tempo real, analise padrões e tome decisões informadas 
            sobre o tratamento com nossa plataforma avançada de monitoramento.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Acessar Dashboard
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard
            icon={<Activity className="w-8 h-8" />}
            title="Tempo Real"
            description="Monitore tremores instantaneamente com gráficos atualizados ao vivo"
            gradient="from-purple-500 to-purple-600"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Análise FFT"
            description="Identifique tremores parkinsonianos (4-6 Hz) com precisão"
            gradient="from-pink-500 to-pink-600"
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Calendário"
            description="Visualize dias bons e ruins em um calendário intuitivo"
            gradient="from-rose-500 to-rose-600"
          />
          <FeatureCard
            icon={<Heart className="w-8 h-8" />}
            title="Episódios"
            description="Detecte e registre picos de intensidade automaticamente"
            gradient="from-orange-500 to-orange-600"
          />
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <StatCard number="24/7" label="Monitoramento" />
          <StatCard number="10+" label="Métricas" />
          <StatCard number="Real-time" label="Atualização" />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>© 2025 Aura — Sistema de Monitoramento de Tremores Parkinsonianos</p>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string; 
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-gray-600 text-sm">{label}</div>
    </div>
  );
}