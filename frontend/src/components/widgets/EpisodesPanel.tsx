// src/components/widgets/EpisodesPanel.tsx
import type { Episode } from '../../types';
import { format, parseISO } from 'date-fns';
import { Clock, Zap, Activity } from 'lucide-react';

interface Props {
  episodes: Episode[];
}

export default function EpisodesPanel({ episodes }: Props) {
  if (episodes.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center">
        <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Nenhum episódio detectado hoje
        </h3>
        <p className="text-gray-600">
          Clique em "Detectar Episódios" para analisar os dados
        </p>
      </div>
    );
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity < 6) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    if (intensity < 8) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <div
          key={episode.id}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getIntensityColor(episode.max_intensity)}`}>
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">
                  Episódio #{episode.id}
                </h3>
                <p className="text-sm text-gray-600">
                  {episode.description}
                </p>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-xl font-bold border ${getIntensityColor(episode.max_intensity)}`}>
              {episode.max_intensity.toFixed(1)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <div>
                <div className="text-xs text-gray-500">Início</div>
                <div className="font-medium">
                  {format(parseISO(episode.start_time), 'HH:mm:ss')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <div>
                <div className="text-xs text-gray-500">Fim</div>
                <div className="font-medium">
                  {format(parseISO(episode.end_time), 'HH:mm:ss')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="w-4 h-4" />
              <div>
                <div className="text-xs text-gray-500">Duração</div>
                <div className="font-medium">
                  {episode.duration_minutes.toFixed(1)} min
                </div>
              </div>
            </div>
          </div>

          {episode.freq_dominant && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Frequência dominante:</span>{' '}
                {episode.freq_dominant.toFixed(2)} Hz
                {episode.freq_dominant >= 4 && episode.freq_dominant <= 6 && (
                  <span className="ml-2 text-purple-600 font-medium">
                    (Faixa Parkinsoniana)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}