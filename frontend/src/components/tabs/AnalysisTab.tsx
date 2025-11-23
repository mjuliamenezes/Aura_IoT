// src/components/tabs/AnalysisTab.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AmplitudeChart from '../charts/AmplitudeChart';
import WeeklyComparison from '../widgets/WeeklyComparison';
import HeatmapChart from '../charts/HeatmapChart';
import type { AmplitudeTimelinePoint, DailyStats } from '../../types';

export default function AnalysisTab() {
  const [timeline, setTimeline] = useState<AmplitudeTimelinePoint[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [comparative, setComparative] = useState<any>(null);
  const [hourlyHeatmap, setHourlyHeatmap] = useState<any>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const [timelineData, weeklyData, comparativeData, heatmapData] = await Promise.all([
        api.getAmplitudeTimeline(undefined, 10),
        api.getWeeklyStats(7),
        api.getComparative(7),
        api.getHourlyHeatmap()
      ]);

      setTimeline(timelineData);
      setWeeklyStats(weeklyData);
      setComparative(comparativeData);
      setHourlyHeatmap(heatmapData);
    } catch (error) {
      console.error('Erro ao buscar dados de análise:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Amplitude ao longo do dia */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Amplitude ao Longo do Dia
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Veja os horários de maior intensidade e padrões diários
        </p>
        <AmplitudeChart data={timeline} />
      </div>

      {/* Comparação Semanal */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Comparação Semanal
        </h2>
        <WeeklyComparison weeklyStats={weeklyStats} comparative={comparative} />
      </div>

      {/* Heatmap por Hora */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Heatmap de Intensidade por Hora
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Distribuição da intensidade ao longo das 24 horas
        </p>
        <HeatmapChart data={hourlyHeatmap} />
      </div>
    </div>
  );
}