# app/routes/features_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas import SensorFeatureRead, SensorFeatureBase, DailyStatsRead
from app.services.features_repository import (
    get_latest_features,
    get_last_n_features,
    get_latest_sensor_readings,
    count_total_readings,
    count_total_windows
)

router = APIRouter(prefix="/features", tags=["Features"])


@router.get("/latest", response_model=SensorFeatureRead | dict)
def route_get_latest_feature(db: Session = Depends(get_db)):
    result = get_latest_features(db)
    if result is None:
        return {"status": "no_data"}
    return result


@router.get("/history", response_model=list[SensorFeatureRead])
def route_get_feature_history(limit: int = 200, db: Session = Depends(get_db)):
    return get_last_n_features(db, n=limit)


@router.get("/raw/latest")
def route_get_latest_sensor_readings(limit: int = 200, db: Session = Depends(get_db)):
    rows = get_latest_sensor_readings(db, limit=limit)
    return rows


@router.get("/stats")
def route_get_stats(db: Session = Depends(get_db)):
    return {
        "total_readings": count_total_readings(db),
        "total_windows": count_total_windows(db),
    }
