# app/main.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.mqtt_client import start_mqtt
from app.services.features_repository import get_latest_sensor_readings
from app.routes.features_routes import router as features_router
from app.routes.stats_routes import router as stats_router
from app.routes.episodes_routes import router as episodes_router
from app.routes.heatmap_routes import router as heatmap_router
from app.routes.realtime_routes import router as realtime_router
from app.db import engine, get_db

from app.models import Base as ModelsBase

app = FastAPI(
    title="Aura Backend - Parkinson Tremor Monitor",
    description="API para monitoramento de tremores em pacientes com Parkinson",
    version="1.0.0"
)

# CORS - permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    print("[FastAPI] 🚀 Iniciando Aura Backend...")
    print("[FastAPI] 📊 Criando tabelas (se necessário)...")
    ModelsBase.metadata.create_all(bind=engine)
    print("[FastAPI] ✅ Tabelas criadas/verificadas")
    print("[FastAPI] 📡 Iniciando cliente MQTT...")
    start_mqtt()
    print("[FastAPI] ✅ Sistema pronto!")


@app.get("/")
def root():
    return {
        "message": "Aura Backend - Parkinson Tremor Monitor",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "docs": "/docs",
            "realtime_websocket": "/ws",
            "features": "/features/*",
            "stats": "/stats/*",
            "episodes": "/episodes/*",
            "heatmap": "/heatmap/*",
            "realtime": "/realtime/*"
        }
    }


@app.get("/health")
def health_check():
    """Endpoint de health check para monitoramento."""
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket para streaming de dados em tempo real.
    Envia última leitura do sensor a cada 100ms.
    """
    await websocket.accept()
    last_id = None
    
    try:
        while True:
            await asyncio.sleep(0.1)  # 100ms
            
            db = next(get_db())
            try:
                latest = get_latest_sensor_readings(db, limit=1)
                if not latest:
                    continue
                    
                latest_item = latest[0]
                
                # Enviar apenas se for nova leitura
                if last_id != latest_item.id:
                    last_id = latest_item.id
                    await websocket.send_json({
                        "type": "sensor_reading",
                        "id": latest_item.id,
                        "timestamp": latest_item.timestamp.isoformat(),
                        "acc_x": latest_item.acc_x,
                        "acc_y": latest_item.acc_y,
                        "acc_z": latest_item.acc_z,
                        "gyro_x": latest_item.gyro_x,
                        "gyro_y": latest_item.gyro_y,
                        "gyro_z": latest_item.gyro_z,
                        "temp": latest_item.temp
                    })
            finally:
                db.close()
                
    except WebSocketDisconnect:
        print("[WebSocket] Cliente desconectado")
    except Exception as e:
        print(f"[WebSocket] Erro: {e}")


# Registrar rotas
app.include_router(features_router)
app.include_router(stats_router)
app.include_router(episodes_router)
app.include_router(heatmap_router)
app.include_router(realtime_router)

print("[FastAPI] 📡 Rotas registradas:")
print("  - /features/* (Dados processados e features)")
print("  - /stats/* (Estatísticas diárias/semanais/calendário)")
print("  - /episodes/* (Detecção e análise de episódios)")
print("  - /heatmap/* (Heatmaps e timelines)")
print("  - /realtime/* (Dados em tempo real)")