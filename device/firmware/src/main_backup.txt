#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ----- CONFIG -----
const char* ssid = "CLARO_2G2500B5";
const char* password = "AF2500B5";
const char* mqtt_server = "192.168.0.76"; 
const uint16_t mqtt_port = 1883;
const char* mqtt_topic = "parkinson/mpu6050";
const unsigned long publishIntervalMs = 500; // intervalo de publicação

// ----- OBJECTS -----
Adafruit_MPU6050 mpu;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ----- STATE -----
unsigned long lastPublish = 0;

void setup_wifi() {
  Serial.println();
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
    if (millis() - start > 20000) { 
      Serial.println();
      Serial.println("Falha ao conectar no WiFi (timeout). Reiniciando...");
      ESP.restart();
    }
  }

  Serial.println();
  Serial.print("WiFi conectado! IP: ");
  Serial.println(WiFi.localIP());
}

void mqttReconnect() {
  if (mqttClient.connected()) return;

  Serial.print("Conectando ao broker MQTT...");
  // clientId pode ser único usando MAC
  String clientId = "esp32_mpu_";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

  if (mqttClient.connect(clientId.c_str())) {
    Serial.println("conectado!");
    // (opcional) mqttClient.subscribe("algum/topico");
  } else {
    Serial.print("falhou, rc=");
    Serial.print(mqttClient.state());
    Serial.println(" tentando novamente em 2s");
    delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  // WiFi
  setup_wifi();

  // MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);

  // MPU6050 init
  if (!mpu.begin()) {
    Serial.println("Erro: não foi possível encontrar MPU6050. Verifique conexões.");
    while (1) delay(10);
  }
  Serial.println("MPU6050 encontrado.");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  delay(100);
}

void loop() {
  // garantir conexão MQTT
  if (!mqttClient.connected()) {
    mqttReconnect();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= publishIntervalMs) {
    lastPublish = now;

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // montar JSON simples
    String payload = "{";
    payload += "\"acc_x\":" + String(a.acceleration.x, 4) + ",";
    payload += "\"acc_y\":" + String(a.acceleration.y, 4) + ",";
    payload += "\"acc_z\":" + String(a.acceleration.z, 4) + ",";
    payload += "\"gyro_x\":" + String(g.gyro.x, 4) + ",";
    payload += "\"gyro_y\":" + String(g.gyro.y, 4) + ",";
    payload += "\"gyro_z\":" + String(g.gyro.z, 4) + ",";
    payload += "\"temp\":" + String(temp.temperature, 2) + ",";
    payload += "\"ts_ms\":" + String(now);
    payload += "}";

    bool ok = mqttClient.publish(mqtt_topic, payload.c_str());
    Serial.print("Publicando -> ");
    Serial.println(payload);
    Serial.print("MQTT publish status: ");
    Serial.println(ok ? "OK" : "FAIL");
  }
}
