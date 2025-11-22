# app/routes/realtime_routes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.realtime_service import (
    get_latest_tremor_status,
    get_realtime_series,
    get_fft_spectrum,
    get_sensor_health
)

router = APIRouter(prefix="/realtime", tags=["Real-time"])


@router.get("/status")
def route_tremor_status(db: Session = Depends(get_db)):
    """
    Retorna status atual do tremor com métricas para dashboard.
    Inclui: intensidade atual, média 30s, status qualitativo, frequência dominante.
    """
    return get_latest_tremor_status(db)


@router.get("/series")
def route_realtime_series(
    duration_seconds: int = Query(60, ge=10, le=300, description="Duração em segundos"),
    db: Session = Depends(get_db)
):
    """
    Retorna série temporal para gráfico em tempo real.
    Últimos N segundos de dados com intensidade, magnitudes e frequência.
    """
    return {
        "duration_seconds": duration_seconds,
        "data": get_realtime_series(db, duration_seconds=duration_seconds)
    }


@router.get("/fft")
def route_fft_spectrum(
    window_size: int = Query(100, ge=20, le=500, description="Tamanho da janela"),
    db: Session = Depends(get_db)
):
    """
    Retorna espectro FFT para visualização de frequências.
    Útil para identificar tremor parkinsoniano (4-6 Hz).
    """
    return get_fft_spectrum(db, window_size=window_size)


@router.get("/sensor-health")
def route_sensor_health(db: Session = Depends(get_db)):
    """
    Retorna status de saúde do sensor (online/offline, última leitura, etc).
    """
    return get_sensor_health(db)