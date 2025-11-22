# app/services/realtime_service.py
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import SensorFeature, SensorReading
import numpy as np


def get_latest_tremor_status(db: Session) -> Dict[str, Any]:
    """
    Retorna status atual do tremor com métricas para o dashboard.
    """
    # Buscar última feature processada
    latest_feature = (
        db.query(SensorFeature)
        .order_by(SensorFeature.timestamp.desc())
        .first()
    )
    
    if not latest_feature:
        return {
            "status": "no_data",
            "message": "Nenhum dado disponível",
            "current_intensity": 0,
            "avg_intensity_30s": 0,
            "acc_magnitude": 0,
            "gyro_magnitude": 0,
            "freq_dominant": None,
            "timestamp": None,
            "is_parkinsonian": False
        }
    
    # Calcular intensidade média dos últimos 30 segundos
    cutoff = datetime.now() - timedelta(seconds=30)
    recent_features = (
        db.query(SensorFeature)
        .filter(SensorFeature.timestamp >= cutoff)
        .all()
    )
    
    recent_intensities = [f.intensity for f in recent_features if f.intensity is not None]
    avg_intensity_30s = float(np.mean(recent_intensities)) if recent_intensities else 0.0
    
    # Determinar status qualitativo
    if avg_intensity_30s < 2:
        status = "normal"
        status_text = "Tremor mínimo"
        color = "green"
    elif avg_intensity_30s < 5:
        status = "mild"
        status_text = "Tremor leve"
        color = "yellow"
    elif avg_intensity_30s < 7:
        status = "moderate"
        status_text = "Tremor moderado"
        color = "orange"
    else:
        status = "severe"
        status_text = "Tremor intenso"
        color = "red"
    
    return {
        "status": status,
        "status_text": status_text,
        "color": color,
        "current_intensity": round(latest_feature.intensity, 2) if latest_feature.intensity else 0,
        "avg_intensity_30s": round(avg_intensity_30s, 2),
        "acc_magnitude": round(latest_feature.acc_magnitude, 4) if latest_feature.acc_magnitude else 0,
        "gyro_magnitude": round(latest_feature.gyro_magnitude, 4) if latest_feature.gyro_magnitude else 0,
        "freq_dominant": round(latest_feature.freq_dominant, 2) if latest_feature.freq_dominant else None,
        "timestamp": latest_feature.timestamp.isoformat(),
        "is_parkinsonian": (4 <= (latest_feature.freq_dominant or 0) <= 6) if latest_feature.freq_dominant else False
    }


def get_realtime_series(db: Session, duration_seconds: int = 60) -> List[Dict[str, Any]]:
    """
    Retorna série temporal para gráfico em tempo real.
    """
    cutoff = datetime.now() - timedelta(seconds=duration_seconds)
    
    features = (
        db.query(SensorFeature)
        .filter(SensorFeature.timestamp >= cutoff)
        .order_by(SensorFeature.timestamp)
        .all()
    )
    
    return [
        {
            "timestamp": f.timestamp.isoformat(),
            "intensity": round(f.intensity, 2) if f.intensity else 0,
            "acc_magnitude": round(f.acc_magnitude, 4) if f.acc_magnitude else 0,
            "gyro_magnitude": round(f.gyro_magnitude, 4) if f.gyro_magnitude else 0,
            "freq_dominant": round(f.freq_dominant, 2) if f.freq_dominant else None
        }
        for f in features
    ]


def get_fft_spectrum(db: Session, window_size: int = 100) -> Dict[str, Any]:
    """
    Retorna espectro FFT dos últimos dados para visualização.
    """
    latest_features = (
        db.query(SensorFeature)
        .order_by(SensorFeature.timestamp.desc())
        .limit(window_size)
        .all()
    )
    
    if len(latest_features) < 10:
        return {
            "status": "insufficient_data",
            "frequencies": [],
            "magnitudes": [],
            "dominant_frequency": None,
            "is_parkinsonian": False,
            "window_size": len(latest_features)
        }
    
    # Reverter ordem (mais antigo primeiro)
    latest_features.reverse()
    
    # Extrair série temporal de intensidade
    signal = [f.intensity for f in latest_features if f.intensity is not None]
    
    if len(signal) < 10:
        return {
            "status": "insufficient_data",
            "frequencies": [],
            "magnitudes": [],
            "dominant_frequency": None,
            "is_parkinsonian": False,
            "window_size": len(signal)
        }
    
    # Calcular FFT
    signal_arr = np.array(signal)
    fft_values = np.abs(np.fft.rfft(signal_arr))
    freqs = np.fft.rfftfreq(len(signal_arr), d=0.04)  # ~25Hz
    
    # Pegar apenas frequências até 15Hz
    mask = freqs <= 15
    freqs_filtered = freqs[mask]
    fft_filtered = fft_values[mask]
    
    # Normalizar magnitudes
    if len(fft_filtered) > 0 and np.max(fft_filtered) > 0:
        fft_normalized = (fft_filtered / np.max(fft_filtered)) * 100
    else:
        fft_normalized = fft_filtered
    
    # Encontrar frequência dominante
    if len(fft_filtered) > 1:
        dominant_idx = int(np.argmax(fft_filtered[1:])) + 1
        dominant_freq = float(freqs_filtered[dominant_idx])
        is_parkinsonian = 4 <= dominant_freq <= 6
    else:
        dominant_freq = None
        is_parkinsonian = False
    
    return {
        "status": "ok",
        "frequencies": freqs_filtered.tolist(),
        "magnitudes": fft_normalized.tolist(),
        "dominant_frequency": round(dominant_freq, 2) if dominant_freq else None,
        "is_parkinsonian": is_parkinsonian,
        "window_size": len(signal)
    }


def get_sensor_health(db: Session) -> Dict[str, Any]:
    """
    Retorna status de saúde do sensor.
    """
    # Verificar última leitura
    latest_reading = (
        db.query(SensorReading)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    
    if not latest_reading:
        return {
            "status": "offline",
            "message": "Nenhum dado recebido",
            "last_seen": None,
            "age_seconds": None,
            "readings_last_hour": 0,
            "temperature": None
        }
    
    # Verificar idade do último dado
    age_seconds = (datetime.now() - latest_reading.timestamp).total_seconds()
    
    if age_seconds < 5:
        status = "online"
        message = "Sensor operando normalmente"
    elif age_seconds < 30:
        status = "delayed"
        message = f"Última leitura há {int(age_seconds)}s"
    else:
        status = "offline"
        message = f"Sem dados há {int(age_seconds)}s"
    
    # Contar leituras na última hora
    hour_ago = datetime.now() - timedelta(hours=1)
    readings_count = (
        db.query(func.count(SensorReading.id))
        .filter(SensorReading.timestamp >= hour_ago)
        .scalar()
    )
    
    return {
        "status": status,
        "message": message,
        "last_seen": latest_reading.timestamp.isoformat(),
        "age_seconds": int(age_seconds),
        "readings_last_hour": readings_count or 0,
        "temperature": round(latest_reading.temp, 1) if latest_reading.temp else None
    }