// src/components/widgets/WeeklyComparison.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyStats } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  weeklyStats: DailyStats[];
  comparative: any;
}

export default function WeeklyComparison({ weeklyStats, comparative }: Props) {
  if (!weeklyStats || weeklyStats.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhum dado disponível
      </div>
    );
  }

  // Formatar dados para o gráfico
  const chartData = weeklyStats.map(day => ({
    ...day,
    dayLabel: format(parseISO(day.date), 'EEE', { locale: ptBR }),
  }));

  // Trend indicator
  const getTrendIcon = () => {
    if (!comparative) return <Minus className="w-5 h-5" />;
    
    const change = comparative.change_percent;
    if (change < -5) return <TrendingDown className="w-5 h-5 text-green-600" />;
    if (change > 5) return <TrendingUp className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (!comparative) return 'bg-gray-100 text-gray-700 border-gray-200';
    
    const trend = comparative.trend;
    if (trend === 'improving') return 'bg-green-100 text-green-700 border-green-200';
    if (trend === 'worsening') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div>
      {/* Comparison Card */}
      {comparative && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Período Atual</div>
            <div className="text-2xl font-bold text-gray-800">
              {comparative.current_period.avg_intensity.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              {comparative.current_period.days_with_data} dias com dados
            </div>
          </div>

          <div className="bg-white/50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Período Anterior</div>
            <div className="text-2xl font-bold text-gray-800">
              {comparative.previous_period.avg_intensity.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              {comparative.previous_period.days_with_data} dias com dados
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${getTrendColor()}`}>
            <div className="text-sm mb-1">Variação</div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <div className="text-2xl font-bold">
                {Math.abs(comparative.change_percent).toFixed(1)}%
              </div>
            </div>
            <div className="text-xs capitalize mt-1">
              {comparative.trend === 'improving' && '🎉 Melhora'}
              {comparative.trend === 'worsening' && '⚠️ Piora'}
              {comparative.trend === 'stable' && '➡️ Estável'}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="dayLabel" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Intensidade Média', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any) => {
                const num = Number(value);
                return isNaN(num) || num === null ? 'N/A' : num.toFixed(2);
              }}
            />
            <Legend />
            <Bar 
              dataKey="avg_intensity" 
              fill="#9333ea" 
              radius={[8, 8, 0, 0]}
              name="Intensidade Média"
            />
            <Bar 
              dataKey="max_intensity" 
              fill="#ec4899" 
              radius={[8, 8, 0, 0]}
              name="Intensidade Máxima"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}