// src/services/api.ts
import type {
  TremorStatus,
  RealtimeDataPoint,
  FFTSpectrum,
  Episode,
  DailyStats,
  CalendarDay,
  AmplitudeTimelinePoint,
  SensorHealth
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  // Realtime
  async getTremorStatus(): Promise<TremorStatus> {
    const res = await fetch(`${API_BASE_URL}/realtime/status`);
    if (!res.ok) throw new Error('Failed to fetch tremor status');
    return res.json();
  }

  async getRealtimeSeries(durationSeconds: number = 60): Promise<RealtimeDataPoint[]> {
    const res = await fetch(`${API_BASE_URL}/realtime/series?duration_seconds=${durationSeconds}`);
    if (!res.ok) throw new Error('Failed to fetch realtime series');
    const data = await res.json();
    return data.data;
  }

  async getFFTSpectrum(windowSize: number = 100): Promise<FFTSpectrum> {
    const res = await fetch(`${API_BASE_URL}/realtime/fft?window_size=${windowSize}`);
    if (!res.ok) throw new Error('Failed to fetch FFT spectrum');
    return res.json();
  }

  async getSensorHealth(): Promise<SensorHealth> {
    const res = await fetch(`${API_BASE_URL}/realtime/sensor-health`);
    if (!res.ok) throw new Error('Failed to fetch sensor health');
    return res.json();
  }

  // Episodes
  async detectEpisodes(lookbackMinutes: number = 60): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/episodes/detect?lookback_minutes=${lookbackMinutes}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to detect episodes');
    return res.json();
  }

  async getDailyEpisodes(forDate?: string): Promise<Episode[]> {
    const url = forDate 
      ? `${API_BASE_URL}/episodes/daily?for_date=${forDate}`
      : `${API_BASE_URL}/episodes/daily`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch daily episodes');
    const data = await res.json();
    return data.episodes;
  }

  // Stats
  async getDailyStats(forDate?: string): Promise<DailyStats> {
    const url = forDate 
      ? `${API_BASE_URL}/stats/daily?for_date=${forDate}`
      : `${API_BASE_URL}/stats/daily`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch daily stats');
    return res.json();
  }

  async getWeeklyStats(days: number = 7): Promise<DailyStats[]> {
    const res = await fetch(`${API_BASE_URL}/stats/weekly?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch weekly stats');
    return res.json();
  }

  async getCalendar(startDate?: string, endDate?: string): Promise<Record<string, CalendarDay>> {
    let url = `${API_BASE_URL}/stats/calendar`;
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch calendar');
    return res.json();
  }

  async getComparative(days: number = 7): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/stats/compare?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch comparative stats');
    return res.json();
  }

  // Heatmap
  async getAmplitudeTimeline(forDate?: string, bucketMinutes: number = 10): Promise<AmplitudeTimelinePoint[]> {
    let url = `${API_BASE_URL}/heatmap/timeline?bucket_minutes=${bucketMinutes}`;
    if (forDate) url += `&for_date=${forDate}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch amplitude timeline');
    const data = await res.json();
    return data.timeline;
  }

  async getHourlyHeatmap(forDate?: string): Promise<any> {
    const url = forDate 
      ? `${API_BASE_URL}/heatmap/hourly?for_date=${forDate}`
      : `${API_BASE_URL}/heatmap/hourly`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch hourly heatmap');
    return res.json();
  }

  async getMinuteHeatmap(forDate?: string): Promise<any> {
    const url = forDate 
      ? `${API_BASE_URL}/heatmap/minute?for_date=${forDate}`
      : `${API_BASE_URL}/heatmap/minute`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch minute heatmap');
    return res.json();
  }
}

export const api = new ApiService();