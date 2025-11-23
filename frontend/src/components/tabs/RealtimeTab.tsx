// src/components/tabs/RealtimeTab.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import IntensityGauge from '../widgets/IntensityGauge';
import SensorStatus from '../widgets/SensorStatus';
import RealtimeChart from '../charts/RealtimeChart';
import FFTChart from '../charts/FFTChart';
import type { TremorStatus, RealtimeDataPoint, FFTSpectrum, SensorHealth } from '../../types';

export default function RealtimeTab() {
  const [status, setStatus] = useState<TremorStatus | null>(null);
  const [series, setSeries] = useState<RealtimeDataPoint[]>([]);
  const [fft, setFft] = useState<FFTSpectrum | null>(null);
  const [health, setHealth] = useState<SensorHealth | null>(null);

  useEffect(() => {
    // Fetch inicial
    fetchRealtimeData();

    // Atualizar a cada 2 segundos
    const interval = setInterval(fetchRealtimeData, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchRealtimeData = async () => {
    try {
      const [statusData, seriesData, fftData, healthData] = await Promise.all([
        api.getTremorStatus(),
        api.getRealtimeSeries(60),
        api.getFFTSpectrum(100),
        api.getSensorHealth()
      ]);

      setStatus(statusData);
      setSeries(seriesData);
      setFft(fftData);
      setHealth(healthData);
    } catch (error) {
      console.error('Erro ao buscar dados em tempo real:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <IntensityGauge 
          intensity={status?.current_intensity ?? 0}
          avgIntensity30s={status?.avg_intensity_30s ?? 0}
          statusText={status?.status_text ?? 'Carregando...'}
          color={status?.color ?? 'gray'}
        />
        <SensorStatus 
          health={health}
          accMagnitude={status?.acc_magnitude ?? 0}
          gyroMagnitude={status?.gyro_magnitude ?? 0}
          freqDominant={status?.freq_dominant ?? null}
          isParkinsonian={status?.is_parkinsonian ?? false}
        />
      </div>

      {/* Gráfico em Tempo Real */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Gráfico em Tempo Real (60s)
        </h2>
        <RealtimeChart data={series} />
      </div>

      {/* Espectro FFT */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Espectro de Frequências (FFT)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Tremor parkinsoniano clássico: 4-6 Hz
        </p>
        <FFTChart fft={fft} />
      </div>
    </div>
  );
}