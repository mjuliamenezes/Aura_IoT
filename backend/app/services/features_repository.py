# app/services/features_repository.py
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import SensorFeature, SensorReading


def get_latest_features(db: Session) -> Optional[SensorFeature]:
    return db.query(SensorFeature).order_by(SensorFeature.id.desc()).first()


def get_last_n_features(db: Session, n: int = 100) -> List[SensorFeature]:
    return db.query(SensorFeature).order_by(SensorFeature.id.desc()).limit(n).all()


def get_feature_by_id(db: Session, feature_id: int) -> Optional[SensorFeature]:
    return db.query(SensorFeature).filter(SensorFeature.id == feature_id).first()


def get_latest_sensor_readings(db: Session, limit: int = 100) -> List[SensorReading]:
    return db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(limit).all()


def count_total_windows(db: Session) -> int:
    return db.query(SensorFeature).count()


def count_total_readings(db: Session) -> int:
    return db.query(SensorReading).count()
