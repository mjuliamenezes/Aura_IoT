// src/components/charts/HeatmapChart.tsx
import { ResponsiveHeatMap } from '@nivo/heatmap';

interface Props {
  data: any;
}

export default function HeatmapChart({ data }: Props) {
  if (!data || !data.heatmap) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  // Transformar dados para o formato do Nivo
  const hours = Object.keys(data.heatmap)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .filter(hour => {
      // Filtrar apenas horas com dados
      const hourData = data.heatmap[hour];
      return hourData.avg_intensity !== null && hourData.samples > 0;
    });

  if (hours.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Sem dados de intensidade hoje</p>
          <p className="text-sm">Os dados aparecerão conforme o sensor coletar informações</p>
        </div>
      </div>
    );
  }

  const nivoData = hours.map((hour) => {
    const hourData = data.heatmap[hour];
    return {
      id: `${hour}h`,
      data: [
        {
          x: 'Intensidade',
          y: hourData.avg_intensity ?? 0
        }
      ]
    };
  });

  // Encontrar valor máximo para escala
  const maxIntensity = Math.max(
    ...hours.map(h => data.heatmap[h].avg_intensity ?? 0)
  );
  const scaleMax = Math.max(maxIntensity, 10); // Pelo menos 10 para escala consistente

  return (
    <div className="h-96">
      <ResponsiveHeatMap
        data={nivoData}
        margin={{ top: 60, right: 120, bottom: 60, left: 90 }}
        valueFormat=">-.2f"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Intensidade Média',
          legendPosition: 'middle',
          legendOffset: -40
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Hora do Dia',
          legendPosition: 'middle',
          legendOffset: -60
        }}
        colors={{
          type: 'sequential',
          scheme: 'purple_red',
          minValue: 0,
          maxValue: scaleMax
        }}
        emptyColor="#f3f4f6"
        borderColor="#ffffff"
        borderWidth={2}
        labelTextColor="#ffffff"
        enableLabels={true}
        label={(cell) => cell.value ? `${cell.value.toFixed(1)}` : '0.0'}
        tooltip={({ cell }) => {
          const hour = cell.serieId.toString().replace('h', '');
          const hourData = data.heatmap[hour];
          const cellValue = cell.value ?? 0;
          return (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="font-bold text-gray-800 mb-1">{cell.serieId}</div>
              <div className="text-sm text-gray-600">
                <div>Média: <span className="font-semibold">{cellValue.toFixed(2)}</span></div>
                <div>Máxima: <span className="font-semibold">{hourData.max_intensity?.toFixed(2) ?? 'N/A'}</span></div>
                <div>Amostras: <span className="font-semibold">{hourData.samples}</span></div>
              </div>
            </div>
          );
        }}
        legends={[
          {
            anchor: 'right',
            translateX: 100,
            translateY: 0,
            length: 300,
            thickness: 10,
            direction: 'column',
            tickPosition: 'after',
            tickSize: 5,
            tickSpacing: 4,
            tickOverlap: false,
            title: 'Intensidade →',
            titleAlign: 'start',
            titleOffset: 4
          }
        ]}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}