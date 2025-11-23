// src/components/charts/FFTChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import type { FFTSpectrum } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  fft: FFTSpectrum | null;
}

export default function FFTChart({ fft }: Props) {
  if (!fft || fft.status !== 'ok' || fft.frequencies.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Dados insuficientes para FFT</p>
          <p className="text-sm">Aguardando mais leituras...</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = fft.frequencies.map((freq, idx) => ({
    frequency: freq.toFixed(1),
    magnitude: fft.magnitudes[idx],
    freqValue: freq
  }));

  return (
    <div>
      {/* Status Indicator */}
      {fft.dominant_frequency !== null && (
        <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
          fft.is_parkinsonian 
            ? 'bg-purple-100 border border-purple-300' 
            : 'bg-gray-100 border border-gray-300'
        }`}>
          {fft.is_parkinsonian ? (
            <>
              <AlertCircle className="w-6 h-6 text-purple-600" />
              <div>
                <div className="font-bold text-purple-800">
                  Tremor Parkinsoniano Detectado
                </div>
                <div className="text-sm text-purple-700">
                  Frequência dominante: {fft.dominant_frequency} Hz (4-6 Hz esperado)
                </div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-bold text-gray-800">
                  Frequência: {fft.dominant_frequency} Hz
                </div>
                <div className="text-sm text-gray-600">
                  Fora da faixa parkinsoniana típica
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="frequency" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Frequência (Hz)', position: 'insideBottom', offset: -5, style: { fontSize: 14 } }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Magnitude (%)', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Magnitude']}
            />
            
            {/* Faixa Parkinsoniana (4-6 Hz) */}
            <ReferenceLine x="4.0" stroke="#9333ea" strokeDasharray="3 3" strokeWidth={2}>
              <Label value="4 Hz" position="top" fill="#9333ea" fontSize={12} />
            </ReferenceLine>
            <ReferenceLine x="6.0" stroke="#9333ea" strokeDasharray="3 3" strokeWidth={2}>
              <Label value="6 Hz" position="top" fill="#9333ea" fontSize={12} />
            </ReferenceLine>
            
            <Bar 
              dataKey="magnitude" 
              fill="url(#colorGradient)" 
              radius={[4, 4, 0, 0]}
            />
            
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}