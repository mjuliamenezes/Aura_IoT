// src/components/tabs/CalendarTab.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import CalendarView from '../widgets/CalendarView';
import type { CalendarDay } from '../../types';

export default function CalendarTab() {
  const [calendar, setCalendar] = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      const data = await api.getCalendar();
      setCalendar(data);
    } catch (error) {
      console.error('Erro ao buscar calendário:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Calendário de Monitoramento
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Visualize seus dias bons e ruins ao longo do mês
        </p>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-200 rounded-lg border-2 border-green-400" />
            <span className="text-sm text-gray-700 font-medium">Dia Bom (&lt; 6.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-200 rounded-lg border-2 border-red-400" />
            <span className="text-sm text-gray-700 font-medium">Dia Ruim (≥ 6.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg border-2 border-gray-300" />
            <span className="text-sm text-gray-700 font-medium">Sem dados</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarView calendar={calendar} />
    </div>
  );
}