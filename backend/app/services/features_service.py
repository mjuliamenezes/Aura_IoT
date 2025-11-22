# app/services/features_service.py
import numpy as np
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from app.models import SensorFeature, SensorReading

# Config
WINDOW_SIZE = 25
MIN_FFT_SIZE = 10
intensity_scale_factor = 2.5

# buffers em memória para janelas deslizantes
acc_buffer: List[float] = []
gyro_buffer: List[float] = []


def vector_magnitude(x: float, y: float, z: float) -> float:
    """Calcula magnitude vetorial."""
    return float(np.sqrt(x**2 + y**2 + z**2))


def compute_amplitude(series: List[float]) -> float:
    """Calcula amplitude (max - min)."""
    if len(series) < 2:
        return 0.0
    return float(np.max(series) - np.min(series))


def compute_dominant_frequency(series: List[float], sampling_rate=25) -> float | None:
    """Calcula frequência dominante via FFT."""
    if len(series) < MIN_FFT_SIZE:
        return None
    signal = np.array(series)
    fft_values = np.abs(np.fft.rfft(signal))
    freqs = np.fft.rfftfreq(len(signal), d=1.0 / sampling_rate)
    if len(fft_values) < 2:
        return None
    idx = int(np.argmax(fft_values[1:]) + 1)
    return float(freqs[idx])


def compute_intensity(acc_amp: float, gyro_amp: float) -> float:
    """Calcula intensidade normalizada de 0 a 10."""
    raw = (acc_amp + gyro_amp) * intensity_scale_factor
    scaled = min(max(raw, 0), 10)
    return float(scaled)


def process_new_reading(db: Session, reading: SensorReading):
    """Gera features completas de tremor e salva no banco."""

    # 🔒 Validar campos obrigatórios
    fields = [reading.acc_x, reading.acc_y, reading.acc_z,
              reading.gyro_x, reading.gyro_y, reading.gyro_z]

    if any(v is None for v in fields):
        print(f"[FEATURES]  Ignorando leitura inválida (valores None). ID: {reading.id}")
        return

    try:
        # Calcular magnitudes
        acc_mag = vector_magnitude(reading.acc_x, reading.acc_y, reading.acc_z)
        gyro_mag = vector_magnitude(reading.gyro_x, reading.gyro_y, reading.gyro_z)

        # Atualizar buffers (janela deslizante)
        acc_buffer.append(acc_mag)
        gyro_buffer.append(gyro_mag)
        
        if len(acc_buffer) > WINDOW_SIZE:
            acc_buffer.pop(0)
            gyro_buffer.pop(0)

        # Calcular estatísticas sobre a janela
        acc_arr = np.array(acc_buffer)
        gyro_arr = np.array(gyro_buffer)

        acc_mean = float(np.mean(acc_arr))
        acc_std = float(np.std(acc_arr))
        acc_amp = compute_amplitude(acc_buffer)

        gyro_mean = float(np.mean(gyro_arr))
        gyro_std = float(np.std(gyro_arr))
        gyro_amp = compute_amplitude(gyro_buffer)

        # Calcular intensidade e frequência
        intensity = compute_intensity(acc_amp, gyro_amp)
        freq_dom = compute_dominant_frequency(acc_buffer)
        
        # Tremor score simplificado
        tremor_score = gyro_mag

        # Criar e salvar feature completa
        feature = SensorFeature(
            reading_id=reading.id,
            timestamp=reading.timestamp,
            
            # Magnitudes
            acc_magnitude=acc_mag,
            gyro_magnitude=gyro_mag,
            
            # Estatísticas
            acc_mean=acc_mean,
            acc_std=acc_std,
            acc_amplitude=acc_amp,
            
            gyro_mean=gyro_mean,
            gyro_std=gyro_std,
            gyro_amplitude=gyro_amp,
            
            # Métricas derivadas
            intensity=intensity,
            freq_dominant=freq_dom,
            tremor_score=tremor_score,
        )

        db.add(feature)
        db.commit()
        db.refresh(feature)

        print(f"[FEATURES] ✅ Feature completa salva! ID={feature.id} | "
              f"intensity={intensity:.2f} | tremor={tremor_score:.4f}")

    except Exception as e:
        print(f"[FEATURES]  Erro ao gerar features: {e}")
        db.rollback()