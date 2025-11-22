# app/routes/episodes_routes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional

from app.db import get_db
from app.services.episodes_service import (
    detect_and_save_episodes,
    get_episodes_by_date,
    get_episodes_summary
)

router = APIRouter(prefix="/episodes", tags=["Episodes"])


@router.post("/detect")
def route_detect_episodes(
    lookback_minutes: int = Query(5, ge=1, le=60, description="Minutos para trás"),
    db: Session = Depends(get_db)
):
    """
    Detecta e salva novos episódios de tremor intenso.
    """
    episodes = detect_and_save_episodes(db, lookback_minutes=lookback_minutes)
    return {
        "detected": len(episodes),
        "episodes": [
            {
                "start_time": ep.start_time.isoformat(),
                "end_time": ep.end_time.isoformat(),
                "duration_minutes": round(ep.duration, 2) if ep.duration else 0,
                "max_intensity": round(ep.max_intensity, 2) if ep.max_intensity else 0
            }
            for ep in episodes
        ]
    }


@router.get("/daily")
def route_episodes_daily(
    for_date: Optional[str] = Query(None, description="YYYY-MM-DD (default = today)"),
    db: Session = Depends(get_db)
):
    """
    Retorna todos os episódios de um dia específico.
    """
    if for_date:
        dt = date.fromisoformat(for_date)
    else:
        dt = date.today()
    
    return {
        "date": dt.isoformat(),
        "episodes": get_episodes_by_date(db, for_date=dt)
    }


@router.get("/summary")
def route_episodes_summary(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Retorna resumo de episódios em um período.
    """
    if end_date:
        end_dt = date.fromisoformat(end_date)
    else:
        end_dt = date.today()
    
    if start_date:
        start_dt = date.fromisoformat(start_date)
    else:
        start_dt = end_dt - timedelta(days=7)
    
    return get_episodes_summary(db, start_date=start_dt, end_date=end_dt)