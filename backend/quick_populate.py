# quick_populate.py
"""
Script RÁPIDO para popular banco com dados mockados.
Executa em ~5 segundos.
"""

import random
from datetime import datetime, timedelta
from app.db import SessionLocal, engine
from app.models import Base, SensorReading, SensorFeature, Episode

def quick_populate():
    """Popular banco rapidamente com dados pré-calculados."""
    
    print("🚀 Iniciando população rápida do banco...")
    
    # 1. CRIAR TABELAS
    print("📊 Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas/verificadas")
    
    db = SessionLocal()
    
    try:
        # 2. LIMPAR DADOS ANTIGOS
        print("🗑️  Limpando dados antigos...")
        try:
            db.query(Episode).delete()
            db.query(SensorFeature).delete()
            db.query(SensorReading).delete()
            db.commit()
            print("✅ Dados antigos removidos")
        except Exception as e:
            print(f"⚠️  Aviso ao limpar: {e}")
            db.rollback()
        
        now = datetime.now()
        
        # ============================================
        # 3. ÚLTIMAS 2 HORAS (dados recentes)
        # ============================================
        print("\n📊 Gerando últimas 2 horas...")
        start_time = now - timedelta(hours=2)
        
        readings = []
        features = []
        
        # 1 leitura por segundo = 7200 leituras
        for i in range(7200):
            timestamp = start_time + timedelta(seconds=i)
            
            # Variar intensidade
            time_factor = (i % 600) / 600
            base_intensity = 3.0 + 2.0 * time_factor
            
            # Picos (episódios)
            if i % 800 == 0 or (i > 3000 and i < 3100):
                base_intensity = 7.5
            
            # Valores do sensor
            acc_x = random.gauss(0, 0.5) + base_intensity * 0.1
            acc_y = random.gauss(0, 0.5) + base_intensity * 0.08
            acc_z = 9.81 + random.gauss(0, 0.1)
            gyro_x = random.gauss(0, 0.05) + base_intensity * 0.02
            gyro_y = random.gauss(0, 0.05) + base_intensity * 0.015
            gyro_z = random.gauss(0, 0.02)
            
            reading = SensorReading(
                timestamp=timestamp,
                acc_x=acc_x,
                acc_y=acc_y,
                acc_z=acc_z,
                gyro_x=gyro_x,
                gyro_y=gyro_y,
                gyro_z=gyro_z,
                temp=25.0 + random.gauss(0, 0.5),
                ts_ms=i * 1000
            )
            readings.append(reading)
            
            # Feature a cada 25 leituras
            if i % 25 == 0:
                acc_mag = (acc_x**2 + acc_y**2 + acc_z**2)**0.5
                gyro_mag = (gyro_x**2 + gyro_y**2 + gyro_z**2)**0.5
                
                feature = SensorFeature(
                    timestamp=timestamp,
                    acc_magnitude=acc_mag,
                    gyro_magnitude=gyro_mag,
                    acc_mean=random.gauss(0.5, 0.2),
                    acc_std=random.gauss(0.3, 0.1),
                    acc_amplitude=random.gauss(1.0, 0.3),
                    gyro_mean=random.gauss(0.1, 0.05),
                    gyro_std=random.gauss(0.05, 0.02),
                    gyro_amplitude=random.gauss(0.2, 0.05),
                    intensity=base_intensity,
                    freq_dominant=random.gauss(5.0, 0.5),
                    tremor_score=gyro_mag
                )
                features.append(feature)
        
        # Salvar leituras
        print(f"  Salvando {len(readings)} leituras...")
        db.bulk_save_objects(readings)
        db.commit()
        
        # Buscar IDs
        all_readings = db.query(SensorReading).order_by(SensorReading.id).all()
        
        # Associar features
        for i, feature in enumerate(features):
            if i * 25 < len(all_readings):
                feature.reading_id = all_readings[i * 25].id
        
        print(f"  Salvando {len(features)} features...")
        db.bulk_save_objects(features)
        db.commit()
        
        # ============================================
        # 4. ONTEM (dia completo)
        # ============================================
        print("\n📊 Gerando dia de ontem...")
        yesterday = now - timedelta(days=1)
        yesterday_start = datetime(yesterday.year, yesterday.month, yesterday.day, 8, 0)
        
        for hour in range(12):
            for minute in [0, 15, 30, 45]:
                timestamp = yesterday_start + timedelta(hours=hour, minutes=minute)
                intensity = 3.0 + hour * 0.3 + random.gauss(0, 0.5)
                
                reading = SensorReading(
                    timestamp=timestamp,
                    acc_x=random.gauss(0, 0.5),
                    acc_y=random.gauss(0, 0.5),
                    acc_z=9.81,
                    gyro_x=random.gauss(0, 0.05),
                    gyro_y=random.gauss(0, 0.05),
                    gyro_z=random.gauss(0, 0.02),
                    temp=25.0,
                    ts_ms=0
                )
                db.add(reading)
                db.flush()
                
                feature = SensorFeature(
                    reading_id=reading.id,
                    timestamp=timestamp,
                    acc_magnitude=random.gauss(10.0, 0.5),
                    gyro_magnitude=random.gauss(0.1, 0.02),
                    acc_mean=0.5,
                    acc_std=0.3,
                    acc_amplitude=1.0,
                    gyro_mean=0.1,
                    gyro_std=0.05,
                    gyro_amplitude=0.2,
                    intensity=intensity,
                    freq_dominant=random.gauss(5.0, 0.5),
                    tremor_score=random.gauss(0.1, 0.02)
                )
                db.add(feature)
        
        db.commit()
        
        # ============================================
        # 5. ÚLTIMA SEMANA (esparso)
        # ============================================
        print("\n📊 Gerando última semana...")
        for days_ago in range(2, 8):
            day = now - timedelta(days=days_ago)
            day_start = datetime(day.year, day.month, day.day, 10, 0)
            intensity_base = random.uniform(2.5, 6.5)
            
            for minutes in range(0, 180, 5):
                timestamp = day_start + timedelta(minutes=minutes)
                intensity = max(0, min(10, intensity_base + random.gauss(0, 1.0)))
                
                reading = SensorReading(
                    timestamp=timestamp,
                    acc_x=random.gauss(0, 0.5),
                    acc_y=random.gauss(0, 0.5),
                    acc_z=9.81,
                    gyro_x=random.gauss(0, 0.05),
                    gyro_y=random.gauss(0, 0.05),
                    gyro_z=random.gauss(0, 0.02),
                    temp=25.0,
                    ts_ms=0
                )
                db.add(reading)
                db.flush()
                
                feature = SensorFeature(
                    reading_id=reading.id,
                    timestamp=timestamp,
                    acc_magnitude=random.gauss(10.0, 0.5),
                    gyro_magnitude=random.gauss(0.1, 0.02),
                    acc_mean=0.5,
                    acc_std=0.3,
                    acc_amplitude=1.0,
                    gyro_mean=0.1,
                    gyro_std=0.05,
                    gyro_amplitude=0.2,
                    intensity=intensity,
                    freq_dominant=random.gauss(5.0, 0.5),
                    tremor_score=random.gauss(0.1, 0.02)
                )
                db.add(feature)
        
        db.commit()
        
        # ============================================
        # 6. EPISÓDIOS
        # ============================================
        print("\n📊 Criando episódios...")
        
        # Hoje
        episode1 = Episode(
            start_time=now - timedelta(hours=1, minutes=30),
            end_time=now - timedelta(hours=1, minutes=28),
            duration=2.0,
            max_intensity=7.8,
            freq_dominant=5.2,
            description="Episódio detectado"
        )
        db.add(episode1)
        
        episode2 = Episode(
            start_time=now - timedelta(minutes=45),
            end_time=now - timedelta(minutes=43),
            duration=2.0,
            max_intensity=8.2,
            freq_dominant=4.8,
            description="Episódio detectado"
        )
        db.add(episode2)
        
        # Ontem
        episode3 = Episode(
            start_time=yesterday_start + timedelta(hours=3),
            end_time=yesterday_start + timedelta(hours=3, minutes=5),
            duration=5.0,
            max_intensity=7.5,
            freq_dominant=5.0,
            description="Episódio detectado"
        )
        db.add(episode3)
        
        db.commit()
        
        # ============================================
        # RESUMO
        # ============================================
        print("\n" + "="*50)
        print("✅ População concluída!")
        print("="*50)
        
        total_readings = db.query(SensorReading).count()
        total_features = db.query(SensorFeature).count()
        total_episodes = db.query(Episode).count()
        
        print(f"\n📊 Resumo:")
        print(f"  • Leituras: {total_readings:,}")
        print(f"  • Features: {total_features:,}")
        print(f"  • Episódios: {total_episodes}")
        
        print(f"\n🚀 Backend pronto para testes!")
        print(f"   Acesse: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    quick_populate()