# app/models.py
from sqlalchemy import Column, Integer, Float, DateTime, Date, String, ForeignKey
from sqlalchemy.sql import func
from app.db import Base


class SensorReading(Base):
    """Leituras brutas do sensor MPU6050."""
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)  # SEM timezone=True

    # Acelerômetro (m/s²)
    acc_x = Column(Float, nullable=True)
    acc_y = Column(Float, nullable=True)
    acc_z = Column(Float, nullable=True)

    # Giroscópio (rad/s)
    gyro_x = Column(Float, nullable=True)
    gyro_y = Column(Float, nullable=True)
    gyro_z = Column(Float, nullable=True)

    # Temperatura e timestamp do dispositivo
    temp = Column(Float, nullable=True)
    ts_ms = Column(Integer, nullable=True)


class SensorFeature(Base):
    """Features processadas a partir das leituras brutas."""
    __tablename__ = "sensor_features"

    id = Column(Integer, primary_key=True, index=True)
    reading_id = Column(Integer, ForeignKey("sensor_readings.id"), nullable=False, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)  # SEM timezone=True

    # Magnitudes vetoriais
    acc_magnitude = Column(Float, nullable=True)
    gyro_magnitude = Column(Float, nullable=True)

    # Estatísticas do acelerômetro
    acc_mean = Column(Float, nullable=True)
    acc_std = Column(Float, nullable=True)
    acc_amplitude = Column(Float, nullable=True)

    # Estatísticas do giroscópio
    gyro_mean = Column(Float, nullable=True)
    gyro_std = Column(Float, nullable=True)
    gyro_amplitude = Column(Float, nullable=True)

    # RMS (Root Mean Square) - opcional
    rms_acc = Column(Float, nullable=True)
    rms_gyro = Column(Float, nullable=True)

    # Métricas derivadas
    intensity = Column(Float, nullable=True)  # 0-10
    freq_dominant = Column(Float, nullable=True)  # Hz
    tremor_score = Column(Float, nullable=True)


class Episode(Base):
    """Episódios de tremor intenso detectados."""
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, index=True, nullable=False)  # SEM timezone=True
    end_time = Column(DateTime, index=True, nullable=False)  # SEM timezone=True
    
    # Duração em minutos
    duration = Column(Float, nullable=True)
    
    # Métricas do episódio
    max_intensity = Column(Float, nullable=True)
    freq_dominant = Column(Float, nullable=True)
    
    # Descrição opcional
    description = Column(String(255), nullable=True)


class DailyStats(Base):
    """Estatísticas agregadas por dia (pode ser calculado dinamicamente)."""
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True, nullable=False)
    
    avg_intensity = Column(Float, nullable=True)
    max_intensity = Column(Float, nullable=True)
    episodes_count = Column(Integer, nullable=True)
    total_episode_time = Column(Float, nullable=True)  # minutos
    strongest_freq = Column(Float, nullable=True)