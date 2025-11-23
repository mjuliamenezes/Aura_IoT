// src/components/charts/AmplitudeChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AmplitudeTimelinePoint } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  data: AmplitudeTimelinePoint[];
}

export default function AmplitudeChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        Nenhum dado disponível para hoje
      </div>
    );
  }

  // Formatar dados para o gráfico
  const chartData = data.map(point => ({
    ...point,
    time: format(parseISO(point.timestamp), 'HH:mm'),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{ value: 'Intensidade', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Area 
            type="monotone" 
            dataKey="avg_intensity" 
            stroke="#9333ea" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvg)"
            name="Intensidade Média"
          />
          <Area 
            type="monotone" 
            dataKey="max_intensity" 
            stroke="#ec4899" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMax)"
            name="Intensidade Máxima"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}