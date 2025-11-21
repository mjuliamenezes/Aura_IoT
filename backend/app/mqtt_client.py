import json
import threading
from typing import List, Dict, Any
import paho.mqtt.client as mqtt

# TÓPICO que o ESP32 publica
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "parkinson/mpu6050"

# Buffer temporário (será substituído depois por banco de dados)
sensor_buffer: List[Dict[str, Any]] = []


def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Conectado com código: {rc}")
    client.subscribe(MQTT_TOPIC)


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        sensor_buffer.append(payload)
        print("[MQTT] Nova leitura recebida:", payload)

    except Exception as e:
        print("[MQTT] Erro ao processar mensagem:", str(e))


def start_mqtt():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    print("[MQTT] Conectando ao broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)

    # Rodar MQTT no background
    thread = threading.Thread(target=client.loop_forever)
    thread.daemon = True
    thread.start()

    print("[MQTT] Serviço MQTT iniciado em background")
