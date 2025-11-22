# app/services/heatmap_service.py
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import SensorFeature


def get_hourly_heatmap(db: Session, for_date: date) -> Dict[str, Any]:
    """
    Retorna heatmap de intensidade por hora do dia.
    Formato: { "0": avg_intensity, "1": avg_intensity, ..., "23": avg_intensity }
    """
    start_dt = datetime(for_date.year, for_date.month, for_date.day)
    end_dt = start_dt + timedelta(days=1)
    
    # Agrupar por hora
    hour_label = func.strftime("%H", SensorFeature.timestamp).label("hour")
    
    results = (
        db.query(
            hour_label,
            func.avg(SensorFeature.intensity).label("avg_intensity"),
            func.max(SensorFeature.intensity).label("max_intensity"),
            func.count(SensorFeature.id).label("samples")
        )
        .filter(
            SensorFeature.timestamp >= start_dt,
            SensorFeature.timestamp < end_dt
        )
        .group_by(hour_label)
        .all()
    )
    
    # Preencher todas as 24 horas
    heatmap = {}
    for hour in range(24):
        heatmap[str(hour)] = {
            "avg_intensity": None,
            "max_intensity": None,
            "samples": 0
        }
    
    for row in results:
        hour = row.hour
        heatmap[hour] = {
            "avg_intensity": round(row.avg_intensity, 2) if row.avg_intensity else None,
            "max_intensity": round(row.max_intensity, 2) if row.max_intensity else None,
            "samples": row.samples
        }
    
    return {
        "date": for_date.isoformat(),
        "heatmap": heatmap
    }


def get_minute_heatmap(db: Session, for_date: date) -> List[List[float]]:
    """
    Retorna matriz 24x60 com intensidade média para cada minuto do dia.
    Útil para heatmaps detalhados.
    Retorna: [[min0, min1, ..., min59], ...] para cada hora
    """
    start_dt = datetime(for_date.year, for_date.month, for_date.day)
    end_dt = start_dt + timedelta(days=1)
    
    # Buscar todas as features do dia
    features = (
        db.query(SensorFeature)
        .filter(
            SensorFeature.timestamp >= start_dt,
            SensorFeature.timestamp < end_dt
        )
        .all()
    )
    
    # Criar matriz 24x60 zerada
    matrix = [[None for _ in range(60)] for _ in range(24)]
    
    # Agrupar por hora e minuto
    buckets = {}
    for f in features:
        if f.intensity is None:
            continue
        hour = f.timestamp.hour
        minute = f.timestamp.minute
        key = (hour, minute)
        if key not in buckets:
            buckets[key] = []
        buckets[key].append(f.intensity)
    
    # Calcular médias
    for (hour, minute), intensities in buckets.items():
        matrix[hour][minute] = round(sum(intensities) / len(intensities), 2)
    
    return matrix


def get_amplitude_timeline(db: Session, for_date: date, bucket_minutes: int = 10) -> List[Dict[str, Any]]:
    """
    Retorna timeline de amplitude ao longo do dia, agrupado em buckets de N minutos.
    Útil para gráfico de área mostrando padrão diário.
    """
    start_dt = datetime(for_date.year, for_date.month, for_date.day)
    end_dt = start_dt + timedelta(days=1)
    
    features = (
        db.query(SensorFeature)
        .filter(
            SensorFeature.timestamp >= start_dt,
            SensorFeature.timestamp < end_dt
        )
        .order_by(SensorFeature.timestamp)
        .all()
    )
    
    if not features:
        return []
    
    # Agrupar em buckets
    timeline = []
    current_bucket = {
        "start_time": None,
        "intensities": [],
        "amplitudes": []
    }
    
    for f in features:
        if current_bucket["start_time"] is None:
            current_bucket["start_time"] = f.timestamp
        
        time_diff = (f.timestamp - current_bucket["start_time"]).total_seconds() / 60
        
        if time_diff >= bucket_minutes:
            # Finalizar bucket atual
            if current_bucket["intensities"]:
                timeline.append({
                    "timestamp": current_bucket["start_time"].isoformat(),
                    "avg_intensity": round(sum(current_bucket["intensities"]) / len(current_bucket["intensities"]), 2),
                    "max_intensity": round(max(current_bucket["intensities"]), 2),
                    "avg_amplitude": round(sum(current_bucket["amplitudes"]) / len(current_bucket["amplitudes"]), 2) if current_bucket["amplitudes"] else 0,
                    "samples": len(current_bucket["intensities"])
                })
            
            # Iniciar novo bucket
            current_bucket = {
                "start_time": f.timestamp,
                "intensities": [],
                "amplitudes": []
            }
        
        # Adicionar dados ao bucket atual
        if f.intensity is not None:
            current_bucket["intensities"].append(f.intensity)
        if f.acc_amplitude is not None:
            current_bucket["amplitudes"].append(f.acc_amplitude)
    
    # Adicionar último bucket
    if current_bucket["intensities"]:
        timeline.append({
            "timestamp": current_bucket["start_time"].isoformat(),
            "avg_intensity": round(sum(current_bucket["intensities"]) / len(current_bucket["intensities"]), 2),
            "max_intensity": round(max(current_bucket["intensities"]), 2),
            "avg_amplitude": round(sum(current_bucket["amplitudes"]) / len(current_bucket["amplitudes"]), 2) if current_bucket["amplitudes"] else 0,
            "samples": len(current_bucket["intensities"])
        })
    
    return timeline