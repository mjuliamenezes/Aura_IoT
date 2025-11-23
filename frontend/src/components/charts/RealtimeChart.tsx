// src/components/charts/RealtimeChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { RealtimeDataPoint } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  data: RealtimeDataPoint[];
}

export default function RealtimeChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        Aguardando dados...
      </div>
    );
  }

  // Formatar dados para o gráfico
  const chartData = data.map(point => ({
    ...point,
    time: format(parseISO(point.timestamp), 'HH:mm:ss'),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="intensity" 
            stroke="#9333ea" 
            strokeWidth={2.5}
            dot={false}
            name="Intensidade"
            animationDuration={300}
          />
          <Line 
            type="monotone" 
            dataKey="acc_magnitude" 
            stroke="#06b6d4" 
            strokeWidth={1.5}
            dot={false}
            name="Aceleração"
            strokeDasharray="5 5"
            opacity={0.6}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}