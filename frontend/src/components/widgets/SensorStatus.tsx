// src/components/widgets/SensorStatus.tsx
import { Activity, Wifi, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { SensorHealth } from '../../types';

interface Props {
  health: SensorHealth | null;
  accMagnitude: number;
  gyroMagnitude: number;
  freqDominant: number | null;
  isParkinsonian: boolean;
}

export default function SensorStatus({ health, accMagnitude, gyroMagnitude, freqDominant, isParkinsonian }: Props) {
  const getStatusIcon = () => {
    if (!health) return <Clock className="w-5 h-5" />;
    
    switch (health.status) {
      case 'online': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'delayed': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'offline': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Wifi className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    if (!health) return 'bg-gray-100 text-gray-700 border-gray-200';
    
    switch (health.status) {
      case 'online': return 'bg-green-100 text-green-700 border-green-200';
      case 'delayed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'offline': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Status do Sensor</h3>
          <p className="text-sm text-gray-600">Últimas leituras</p>
        </div>
        <Activity className="w-8 h-8 text-purple-600" />
      </div>

      {/* Sensor Health */}
      <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 border ${getStatusColor()}`}>
        {getStatusIcon()}
        <div className="flex-1">
          <div className="font-medium">{health?.message ?? 'Conectando...'}</div>
          {health?.readings_last_hour !== undefined && (
            <div className="text-xs opacity-75">
              {health.readings_last_hour} leituras na última hora
            </div>
          )}
        </div>
      </div>

      {/* Sensor Values */}
      <div className="space-y-3">
        <MetricCard
          label="Aceleração Total"
          value={accMagnitude.toFixed(4)}
          unit="m/s²"
          icon="📊"
        />
        
        <MetricCard
          label="Rotação Total"
          value={gyroMagnitude.toFixed(4)}
          unit="rad/s"
          icon="🔄"
        />
        
        <MetricCard
          label="Frequência Dominante"
          value={freqDominant ? freqDominant.toFixed(2) : 'N/A'}
          unit="Hz"
          icon="📈"
          highlight={isParkinsonian}
          highlightText="Tremor Parkinsoniano (4-6 Hz)"
        />

        {health?.temperature && (
          <MetricCard
            label="Temperatura"
            value={health.temperature.toFixed(1)}
            unit="°C"
            icon="🌡️"
          />
        )}
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  unit, 
  icon, 
  highlight = false,
  highlightText 
}: { 
  label: string; 
  value: string; 
  unit: string; 
  icon: string;
  highlight?: boolean;
  highlightText?: string;
}) {
  return (
    <div className={`p-3 rounded-xl ${highlight ? 'bg-purple-100 border border-purple-300' : 'bg-white/50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-800">
            {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </div>
          {highlight && highlightText && (
            <div className="text-xs text-purple-600 font-medium">{highlightText}</div>
          )}
        </div>
      </div>
    </div>
  );
}