# app/mqtt_client.py
import json
import threading
import paho.mqtt.client as mqtt
from datetime import datetime
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import SensorReading
from app.services.features_service import process_new_reading

# Configurações MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "parkinson/mpu6050"
MQTT_QOS = 1  # Quality of Service


def save_reading_to_db(payload: dict):
    """
    Salva leitura bruta no banco e processa features.
    
    Args:
        payload: Dicionário com dados do sensor
    """
    db: Session = SessionLocal()
    try:
        # Criar leitura bruta (SEM timezone)
        reading = SensorReading(
            timestamp=datetime.now(),  # SEM timezone
            acc_x=payload.get("acc_x"),
            acc_y=payload.get("acc_y"),
            acc_z=payload.get("acc_z"),
            gyro_x=payload.get("gyro_x"),
            gyro_y=payload.get("gyro_y"),
            gyro_z=payload.get("gyro_z"),
            temp=payload.get("temp"),
            ts_ms=payload.get("ts_ms"),
        )
        
        db.add(reading)
        db.commit()
        db.refresh(reading)
        
        print(f"[MQTT] ✅ Leitura salva: id={reading.id} | "
              f"acc=({reading.acc_x:.2f}, {reading.acc_y:.2f}, {reading.acc_z:.2f}) | "
              f"gyro=({reading.gyro_x:.2f}, {reading.gyro_y:.2f}, {reading.gyro_z:.2f})")

        # Processar e salvar features
        process_new_reading(db, reading)

    except Exception as e:
        print(f"[MQTT] ❌ Erro ao salvar leitura: {e}")
        db.rollback()
    finally:
        db.close()


def on_connect(client, userdata, flags, rc):
    """Callback quando conecta ao broker MQTT."""
    if rc == 0:
        print(f"[MQTT] ✅ Conectado ao broker (rc={rc})")
        client.subscribe(MQTT_TOPIC, qos=MQTT_QOS)
        print(f"[MQTT] 📡 Inscrito no tópico: {MQTT_TOPIC}")
    else:
        print(f"[MQTT] ❌ Falha na conexão (rc={rc})")


def on_disconnect(client, userdata, rc):
    """Callback quando desconecta do broker MQTT."""
    if rc != 0:
        print(f"[MQTT] ⚠️  Desconectado inesperadamente (rc={rc}). Tentando reconectar...")


def on_message(client, userdata, msg):
    """Callback quando recebe mensagem MQTT."""
    try:
        # Decodificar payload JSON
        payload = json.loads(msg.payload.decode("utf-8"))
        
        # Validar campos obrigatórios
        required_fields = ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]
        if not all(field in payload for field in required_fields):
            print(f"[MQTT] ⚠️  Payload incompleto: {payload}")
            return
        
        # Salvar no banco
        save_reading_to_db(payload)
        
    except json.JSONDecodeError as e:
        print(f"[MQTT] ❌ Erro ao decodificar JSON: {e}")
    except Exception as e:
        print(f"[MQTT] ❌ Erro ao processar mensagem: {e}")


def on_subscribe(client, userdata, mid, granted_qos):
    """Callback quando inscrição é confirmada."""
    print(f"[MQTT] ✅ Inscrição confirmada (QoS={granted_qos})")


def start_mqtt():
    """
    Inicia cliente MQTT em thread separada.
    """
    try:
        # Criar cliente MQTT
        client = mqtt.Client(client_id="aura_backend", clean_session=True)
        
        # Configurar callbacks
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect
        client.on_message = on_message
        client.on_subscribe = on_subscribe
        
        # Configurar Will (mensagem caso desconecte)
        client.will_set(
            "parkinson/status",
            payload=json.dumps({"status": "offline"}),
            qos=1,
            retain=True
        )
        
        print(f"[MQTT] 🔌 Conectando ao broker {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        
        # Iniciar loop em thread separada
        thread = threading.Thread(target=client.loop_forever, daemon=True)
        thread.start()
        
        print("[MQTT] ✅ Cliente MQTT iniciado em background")
        
    except Exception as e:
        print(f"[MQTT] ❌ Erro ao iniciar MQTT: {e}")
        raise