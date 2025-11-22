# app/routes/heatmap_routes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.db import get_db
from app.services.heatmap_service import (
    get_hourly_heatmap,
    get_minute_heatmap,
    get_amplitude_timeline
)

router = APIRouter(prefix="/heatmap", tags=["Heatmap"])


@router.get("/hourly")
def route_hourly_heatmap(
    for_date: Optional[str] = Query(None, description="YYYY-MM-DD (default = today)"),
    db: Session = Depends(get_db)
):
    """
    Retorna heatmap de intensidade agrupado por hora (0-23).
    """
    if for_date:
        dt = date.fromisoformat(for_date)
    else:
        dt = date.today()
    
    return get_hourly_heatmap(db, for_date=dt)


@router.get("/minute")
def route_minute_heatmap(
    for_date: Optional[str] = Query(None, description="YYYY-MM-DD (default = today)"),
    db: Session = Depends(get_db)
):
    """
    Retorna matriz 24x60 com intensidade média por minuto.
    Formato: [[min0-59 da hora 0], [min0-59 da hora 1], ...]
    """
    if for_date:
        dt = date.fromisoformat(for_date)
    else:
        dt = date.today()
    
    matrix = get_minute_heatmap(db, for_date=dt)
    
    return {
        "date": dt.isoformat(),
        "matrix": matrix,
        "shape": [24, 60]
    }


@router.get("/timeline")
def route_amplitude_timeline(
    for_date: Optional[str] = Query(None, description="YYYY-MM-DD (default = today)"),
    bucket_minutes: int = Query(10, ge=1, le=60, description="Agrupamento em minutos"),
    db: Session = Depends(get_db)
):
    """
    Retorna timeline de amplitude ao longo do dia, agrupado em buckets.
    Útil para gráfico de área mostrando padrão diário.
    """
    if for_date:
        dt = date.fromisoformat(for_date)
    else:
        dt = date.today()
    
    return {
        "date": dt.isoformat(),
        "bucket_minutes": bucket_minutes,
        "timeline": get_amplitude_timeline(db, for_date=dt, bucket_minutes=bucket_minutes)
    }