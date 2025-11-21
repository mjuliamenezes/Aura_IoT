import asyncio
from fastapi import FastAPI, WebSocket
from .mqtt_client import start_mqtt, sensor_buffer

app = FastAPI()

@app.on_event("startup")
def startup_event():
    print("[FastAPI] Iniciando serviço MQTT...")
    start_mqtt()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    last_len = 0

    while True:
        # pequeno delay para não travar o servidor
        await asyncio.sleep(0.1)

        if len(sensor_buffer) > last_len:
            last_len = len(sensor_buffer)
            await websocket.send_json(sensor_buffer[-1])