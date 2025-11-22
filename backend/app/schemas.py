# app/schemas.py
from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional


# ============================================================
# SENSOR READINGS
# ============================================================

class SensorReadingBase(BaseModel):
    """Schema base para leituras do sensor."""
    timestamp: Optional[datetime] = None
    acc_x: Optional[float] = None
    acc_y: Optional[float] = None
    acc_z: Optional[float] = None
    gyro_x: Optional[float] = None
    gyro_y: Optional[float] = None
    gyro_z: Optional[float] = None
    temp: Optional[float] = None
    ts_ms: Optional[int] = None


class SensorReadingRead(SensorReadingBase):
    """Schema para leitura de dados do sensor."""
    id: int

    class Config:
        from_attributes = True


# ============================================================
# SENSOR FEATURES
# ============================================================

class SensorFeatureBase(BaseModel):
    """Schema base para features processadas."""
    timestamp: Optional[datetime] = None
    
    # Magnitudes
    acc_magnitude: Optional[float] = None
    gyro_magnitude: Optional[float] = None
    
    # Estatísticas
    acc_mean: Optional[float] = None
    acc_std: Optional[float] = None
    acc_amplitude: Optional[float] = None
    
    gyro_mean: Optional[float] = None
    gyro_std: Optional[float] = None
    gyro_amplitude: Optional[float] = None
    
    # Métricas derivadas
    intensity: Optional[float] = Field(None, ge=0, le=10)
    freq_dominant: Optional[float] = None
    tremor_score: Optional[float] = None


class SensorFeatureCreate(SensorFeatureBase):
    """Schema para criação de features."""
    reading_id: int


class SensorFeatureRead(SensorFeatureBase):
    """Schema para leitura de features."""
    id: int
    reading_id: int

    class Config:
        from_attributes = True


# ============================================================
# EPISODES
# ============================================================

class EpisodeBase(BaseModel):
    """Schema base para episódios."""
    start_time: datetime
    end_time: datetime
    duration: Optional[float] = None
    max_intensity: Optional[float] = None
    freq_dominant: Optional[float] = None
    description: Optional[str] = None


class EpisodeCreate(EpisodeBase):
    """Schema para criação de episódios."""
    pass


class EpisodeRead(EpisodeBase):
    """Schema para leitura de episódios."""
    id: int

    class Config:
        from_attributes = True


# ============================================================
# DAILY STATS
# ============================================================

class DailyStatsBase(BaseModel):
    """Schema base para estatísticas diárias."""
    date: date
    avg_intensity: Optional[float] = None
    max_intensity: Optional[float] = None
    episodes_count: Optional[int] = None
    total_episode_time: Optional[float] = None  # minutos
    strongest_freq: Optional[float] = None


class DailyStatsCreate(DailyStatsBase):
    """Schema para criação de estatísticas diárias."""
    pass


class DailyStatsRead(DailyStatsBase):
    """Schema para leitura de estatísticas diárias."""
    id: int

    class Config:
        from_attributes = True


# ============================================================
# REAL-TIME RESPONSES
# ============================================================

class TremorStatusResponse(BaseModel):
    """Resposta do status atual do tremor."""
    status: str
    status_text: str
    color: str
    current_intensity: float
    avg_intensity_30s: float
    acc_magnitude: float
    gyro_magnitude: float
    freq_dominant: Optional[float]
    timestamp: str
    is_parkinsonian: bool


class SensorHealthResponse(BaseModel):
    """Resposta da saúde do sensor."""
    status: str
    message: str
    last_seen: Optional[str]
    age_seconds: Optional[int]
    readings_last_hour: Optional[int]
    temperature: Optional[float]