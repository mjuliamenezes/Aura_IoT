// src/components/tabs/EpisodesTab.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import EpisodesPanel from '../widgets/EpisodesPanel';
import type { Episode } from '../../types';
import { RefreshCw } from 'lucide-react';

export default function EpisodesTab() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      const data = await api.getDailyEpisodes();
      setEpisodes(data);
    } catch (error) {
      console.error('Erro ao buscar episódios:', error);
    }
  };

  const handleDetect = async () => {
    setDetecting(true);
    try {
      await api.detectEpisodes(120); // Últimas 2 horas
      await fetchEpisodes(); // Atualizar lista
    } catch (error) {
      console.error('Erro ao detectar episódios:', error);
      alert('Erro ao detectar episódios. Verifique o console.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de detecção */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Episódios de Hoje</h2>
            <p className="text-sm text-gray-600">
              Picos de intensidade acima de 6.0
            </p>
          </div>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
            Detectar Episódios
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-sm text-purple-700 mb-1">Total de Episódios</div>
            <div className="text-3xl font-bold text-purple-800">{episodes.length}</div>
          </div>
          
          <div className="bg-pink-100 rounded-xl p-4 border border-pink-200">
            <div className="text-sm text-pink-700 mb-1">Duração Total</div>
            <div className="text-3xl font-bold text-pink-800">
              {episodes.reduce((sum, ep) => sum + ep.duration_minutes, 0).toFixed(1)}
              <span className="text-lg ml-1">min</span>
            </div>
          </div>
          
          <div className="bg-rose-100 rounded-xl p-4 border border-rose-200">
            <div className="text-sm text-rose-700 mb-1">Intensidade Máxima</div>
            <div className="text-3xl font-bold text-rose-800">
              {episodes.length > 0 
                ? Math.max(...episodes.map(ep => ep.max_intensity)).toFixed(1)
                : '0.0'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Episódios */}
      <EpisodesPanel episodes={episodes} />
    </div>
  );
}