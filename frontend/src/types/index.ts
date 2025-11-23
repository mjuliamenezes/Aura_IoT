// src/types/index.ts

export interface SensorReading {
  id: number;
  timestamp: string;
  acc_x: number;
  acc_y: number;
  acc_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  temp: number;
  ts_ms: number;
}

export interface TremorStatus {
  status: 'normal' | 'mild' | 'moderate' | 'severe' | 'no_data';
  status_text: string;
  color: string;
  current_intensity: number;
  avg_intensity_30s: number;
  acc_magnitude: number;
  gyro_magnitude: number;
  freq_dominant: number | null;
  timestamp: string;
  is_parkinsonian: boolean;
}

export interface RealtimeDataPoint {
  timestamp: string;
  intensity: number;
  acc_magnitude: number;
  gyro_magnitude: number;
  freq_dominant: number | null;
}

export interface FFTSpectrum {
  status: string;
  frequencies: number[];
  magnitudes: number[];
  dominant_frequency: number | null;
  is_parkinsonian: boolean;
  window_size: number;
}

export interface Episode {
  id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_intensity: number;
  freq_dominant: number | null;
  description: string;
}

export interface DailyStats {
  date: string;
  avg_intensity: number | null;
  max_intensity: number | null;
  episodes_count: number;
  samples: number;
}

export interface CalendarDay {
  avg_intensity: number | null;
  max_intensity: number | null;
  status: 'good' | 'bad' | 'no_data';
  samples: number;
  episodes_count: number;
}

export interface AmplitudeTimelinePoint {
  timestamp: string;
  avg_intensity: number;
  max_intensity: number;
  avg_amplitude: number;
  samples: number;
}

export interface SensorHealth {
  status: 'online' | 'delayed' | 'offline';
  message: string;
  last_seen: string | null;
  age_seconds: number | null;
  readings_last_hour: number;
  temperature: number | null;
}