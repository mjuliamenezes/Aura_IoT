# app/services/episodes_service.py
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models import SensorFeature, Episode

# Configuração para detecção de episódios
EPISODE_THRESHOLD = 6.0
EPISODE_MIN_DURATION_SEC = 5
EPISODE_GAP_TOLERANCE_SEC = 3


def detect_and_save_episodes(db: Session, lookback_minutes: int = 5):
    """
    Detecta episódios de tremor intenso nos últimos N minutos e salva no banco.
    """
    # Usar datetime sem timezone para compatibilidade com SQLite
    cutoff = datetime.now() - timedelta(minutes=lookback_minutes)
    
    # Buscar features acima do threshold
    features = (
        db.query(SensorFeature)
        .filter(
            SensorFeature.timestamp >= cutoff,
            SensorFeature.intensity >= EPISODE_THRESHOLD
        )
        .order_by(SensorFeature.timestamp)
        .all()
    )
    
    if not features:
        print(f"[EPISODES] Nenhuma feature acima de {EPISODE_THRESHOLD} nos últimos {lookback_minutes} minutos")
        return []
    
    print(f"[EPISODES] Encontradas {len(features)} features acima do threshold")
    
    # Agrupar features em episódios
    episodes = []
    current_episode = {
        "start_time": features[0].timestamp,
        "end_time": features[0].timestamp,
        "max_intensity": features[0].intensity,
        "freq_dominant": features[0].freq_dominant,
        "feature_ids": [features[0].id]
    }
    
    for i in range(1, len(features)):
        prev_time = features[i-1].timestamp
        curr_time = features[i].timestamp
        time_gap = (curr_time - prev_time).total_seconds()
        
        if time_gap <= EPISODE_GAP_TOLERANCE_SEC:
            # Continua episódio
            current_episode["end_time"] = curr_time
            current_episode["max_intensity"] = max(
                current_episode["max_intensity"],
                features[i].intensity
            )
            current_episode["feature_ids"].append(features[i].id)
        else:
            # Finaliza episódio atual
            duration = (current_episode["end_time"] - current_episode["start_time"]).total_seconds()
            if duration >= EPISODE_MIN_DURATION_SEC:
                episodes.append(current_episode)
            
            # Inicia novo episódio
            current_episode = {
                "start_time": features[i].timestamp,
                "end_time": features[i].timestamp,
                "max_intensity": features[i].intensity,
                "freq_dominant": features[i].freq_dominant,
                "feature_ids": [features[i].id]
            }
    
    # Adicionar último episódio
    duration = (current_episode["end_time"] - current_episode["start_time"]).total_seconds()
    if duration >= EPISODE_MIN_DURATION_SEC:
        episodes.append(current_episode)
    
    print(f"[EPISODES] {len(episodes)} episódios detectados")
    
    # Salvar no banco
    saved_episodes = []
    for ep in episodes:
        # Verificar se já existe
        existing = db.query(Episode).filter(
            Episode.start_time == ep["start_time"],
            Episode.end_time == ep["end_time"]
        ).first()
        
        if not existing:
            duration_min = (ep["end_time"] - ep["start_time"]).total_seconds() / 60.0
            new_episode = Episode(
                start_time=ep["start_time"],
                end_time=ep["end_time"],
                duration=duration_min,
                max_intensity=ep["max_intensity"],
                freq_dominant=ep["freq_dominant"],
                description=f"Episódio com {len(ep['feature_ids'])} leituras"
            )
            db.add(new_episode)
            saved_episodes.append(new_episode)
    
    if saved_episodes:
        db.commit()
        print(f"[EPISODES] ✅ {len(saved_episodes)} novos episódios salvos")
    else:
        print(f"[EPISODES] Nenhum episódio novo para salvar")
    
    return saved_episodes


def get_episodes_by_date(db: Session, for_date: date) -> List[Dict[str, Any]]:
    """Retorna todos os episódios de um dia específico."""
    start_dt = datetime(for_date.year, for_date.month, for_date.day, 0, 0, 0)
    end_dt = start_dt + timedelta(days=1)
    
    episodes = (
        db.query(Episode)
        .filter(
            Episode.start_time >= start_dt,
            Episode.start_time < end_dt
        )
        .order_by(Episode.start_time)
        .all()
    )
    
    print(f"[EPISODES] Encontrados {len(episodes)} episódios para {for_date}")
    
    return [
        {
            "id": ep.id,
            "start_time": ep.start_time.isoformat(),
            "end_time": ep.end_time.isoformat(),
            "duration_minutes": round(ep.duration, 2) if ep.duration else 0,
            "max_intensity": round(ep.max_intensity, 2) if ep.max_intensity else 0,
            "freq_dominant": round(ep.freq_dominant, 2) if ep.freq_dominant else None,
            "description": ep.description
        }
        for ep in episodes
    ]


def get_episodes_summary(db: Session, start_date: date, end_date: date) -> Dict[str, Any]:
    """Retorna resumo de episódios em um período."""
    start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)
    
    episodes = (
        db.query(Episode)
        .filter(
            Episode.start_time >= start_dt,
            Episode.start_time <= end_dt
        )
        .all()
    )
    
    print(f"[EPISODES] Resumo: {len(episodes)} episódios entre {start_date} e {end_date}")
    
    if not episodes:
        return {
            "total_episodes": 0,
            "total_duration_minutes": 0,
            "avg_duration_minutes": 0,
            "max_intensity": 0,
            "avg_intensity": 0
        }
    
    total_duration = sum(ep.duration or 0 for ep in episodes)
    intensities = [ep.max_intensity for ep in episodes if ep.max_intensity]
    
    return {
        "total_episodes": len(episodes),
        "total_duration_minutes": round(total_duration, 2),
        "avg_duration_minutes": round(total_duration / len(episodes), 2),
        "max_intensity": round(max(intensities), 2) if intensities else 0,
        "avg_intensity": round(sum(intensities) / len(intensities), 2) if intensities else 0
    }