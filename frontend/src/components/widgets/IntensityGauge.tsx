// src/components/widgets/IntensityGauge.tsx
import { Thermometer } from 'lucide-react';

interface Props {
  intensity: number;
  avgIntensity30s: number;
  statusText: string;
  color: string;
}

export default function IntensityGauge({ intensity, avgIntensity30s, statusText, color }: Props) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'from-green-400 to-green-600';
      case 'yellow': return 'from-yellow-400 to-yellow-600';
      case 'orange': return 'from-orange-400 to-orange-600';
      case 'red': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusBgColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const percentage = Math.min((intensity / 10) * 100, 100);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Intensidade do Tremor</h3>
          <p className="text-sm text-gray-600">Escala 0-10</p>
        </div>
        <Thermometer className="w-8 h-8 text-purple-600" />
      </div>

      {/* Thermometer Visual */}
      <div className="mb-6">
        <div className="relative h-64 w-24 mx-auto bg-gray-200 rounded-full overflow-hidden">
          {/* Fill */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getColorClasses(color)} transition-all duration-1000 ease-out`}
            style={{ height: `${percentage}%` }}
          />
          
          {/* Scale marks */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
            {[10, 8, 6, 4, 2, 0].map((mark) => (
              <div key={mark} className="flex items-center justify-between text-xs text-gray-600">
                <span className="w-2 h-px bg-gray-400" />
                <span className="font-medium">{mark}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Values */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
          <span className="text-sm text-gray-600">Intensidade Atual</span>
          <span className="text-2xl font-bold text-gray-800">{intensity.toFixed(1)}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
          <span className="text-sm text-gray-600">Média (30s)</span>
          <span className="text-xl font-semibold text-gray-700">{avgIntensity30s.toFixed(1)}</span>
        </div>

        <div className={`p-3 rounded-xl text-center font-medium border ${getStatusBgColor(color)}`}>
          {statusText}
        </div>
      </div>
    </div>
  );
}