// src/components/widgets/CalendarView.tsx
import type { CalendarDay } from '../../types';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  calendar: Record<string, CalendarDay>;
}

export default function CalendarView({ calendar }: Props) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayColor = (date: string) => {
    const dayData = calendar[date];
    
    if (!dayData || dayData.status === 'no_data') {
      return 'bg-gray-100 border-gray-300 text-gray-400';
    }
    
    if (dayData.status === 'good') {
      return 'bg-green-200 border-green-400 text-green-800 hover:bg-green-300';
    }
    
    return 'bg-red-200 border-red-400 text-red-800 hover:bg-red-300';
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Preencher dias vazios no início do mês
  const firstDayOfWeek = getDay(monthStart);
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
      <div className="mb-4 text-center">
        <h3 className="text-2xl font-bold text-gray-800">
          {format(today, 'MMMM yyyy', { locale: ptBR })}
        </h3>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month start */}
        {emptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}

        {/* Actual days */}
        {daysInMonth.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayData = calendar[dateStr];
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

          return (
            <div
              key={dateStr}
              className="group relative"
            >
              <div
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${getDayColor(dateStr)} ${
                  isToday ? 'ring-4 ring-purple-400 ring-offset-2' : ''
                }`}
              >
                <div className="text-lg font-bold">
                  {format(date, 'd')}
                </div>
                {dayData && dayData.status !== 'no_data' && (
                  <div className="text-xs font-medium">
                    {dayData.avg_intensity?.toFixed(1) ?? '—'}
                  </div>
                )}
              </div>

              {/* Tooltip */}
              {dayData && dayData.status !== 'no_data' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-bold mb-1">
                    {format(date, "d 'de' MMMM", { locale: ptBR })}
                  </div>
                  <div>Média: {dayData.avg_intensity?.toFixed(1) ?? 'N/A'}</div>
                  <div>Máxima: {dayData.max_intensity?.toFixed(1) ?? 'N/A'}</div>
                  <div>Episódios: {dayData.episodes_count}</div>
                  <div className="text-gray-300 text-[10px] mt-1">
                    {dayData.samples} amostras
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-100 rounded-xl border border-green-300">
          <div className="text-2xl font-bold text-green-800">
            {Object.values(calendar).filter(d => d.status === 'good').length}
          </div>
          <div className="text-sm text-green-700">Dias Bons</div>
        </div>
        
        <div className="text-center p-3 bg-red-100 rounded-xl border border-red-300">
          <div className="text-2xl font-bold text-red-800">
            {Object.values(calendar).filter(d => d.status === 'bad').length}
          </div>
          <div className="text-sm text-red-700">Dias Ruins</div>
        </div>
        
        <div className="text-center p-3 bg-gray-100 rounded-xl border border-gray-300">
          <div className="text-2xl font-bold text-gray-800">
            {Object.values(calendar).filter(d => d.status === 'no_data').length}
          </div>
          <div className="text-sm text-gray-700">Sem Dados</div>
        </div>
      </div>
    </div>
  );
}