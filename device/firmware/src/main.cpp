// device/firmware/src/main.cpp
// Versão com FreeRTOS - Aura IoT
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ===== CONFIGURAÇÕES =====
const char* ssid = "CLARO_2G2500B5";
const char* password = "AF2500B5";
const char* mqtt_server = "192.168.0.76"; 
const uint16_t mqtt_port = 1883;
const char* mqtt_topic = "parkinson/mpu6050";
const unsigned long publishIntervalMs = 500; // 2 leituras/segundo

// ===== OBJETOS =====
Adafruit_MPU6050 mpu;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ===== FreeRTOS: HANDLES DAS TASKS =====
TaskHandle_t taskSensorHandle = NULL;
TaskHandle_t taskMQTTHandle = NULL;
TaskHandle_t taskWiFiMonitorHandle = NULL;

// ===== FreeRTOS: FILA PARA COMUNICAÇÃO =====
QueueHandle_t sensorDataQueue;

// ===== FreeRTOS: MUTEX PARA PROTEÇÃO =====
SemaphoreHandle_t mqttMutex;

// ===== ESTRUTURA DE DADOS DO SENSOR =====
struct SensorData {
  float acc_x;
  float acc_y;
  float acc_z;
  float gyro_x;
  float gyro_y;
  float gyro_z;
  float temp;
  unsigned long timestamp;
};

// ===================================================
// FUNÇÕES AUXILIARES (WiFi e MQTT)
// ===================================================
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
  String clientId = "esp32_mpu_";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

  if (mqttClient.connect(clientId.c_str())) {
    Serial.println("conectado!");
  } else {
    Serial.print("falhou, rc=");
    Serial.print(mqttClient.state());
    Serial.println(" tentando novamente em 2s");
    delay(2000);
  }
}

// ===================================================
// TASK 1: Leitura do Sensor MPU6050
// Core: 1 | Prioridade: 3 (ALTA) | Frequência: 25Hz
// ===================================================
void taskReadSensor(void *parameter) {
  Serial.print("[TASK SENSOR] Iniciada no Core: ");
  Serial.println(xPortGetCoreID());
  
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(40); // 25 Hz = 40ms
  
  while (true) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    
    // Preparar dados para enviar à fila
    SensorData data;
    data.acc_x = a.acceleration.x;
    data.acc_y = a.acceleration.y;
    data.acc_z = a.acceleration.z;
    data.gyro_x = g.gyro.x;
    data.gyro_y = g.gyro.y;
    data.gyro_z = g.gyro.z;
    data.temp = temp.temperature;
    data.timestamp = millis();
    
    // Enviar para fila (timeout = 0, não bloqueia se cheia)
    if (xQueueSend(sensorDataQueue, &data, 0) != pdTRUE) {
      Serial.println("[TASK SENSOR] Fila cheia! Dado descartado.");
    }
    
    // Aguardar próximo ciclo (mantém 25Hz preciso)
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// ===================================================
// TASK 2: Publicação MQTT
// Core: 0 | Prioridade: 2 (MÉDIA)
// ===================================================
void taskPublishMQTT(void *parameter) {
  Serial.print("[TASK MQTT] Iniciada no Core: ");
  Serial.println(xPortGetCoreID());
  
  SensorData data;
  
  while (true) {
    // Aguardar dados da fila (timeout 1 segundo)
    if (xQueueReceive(sensorDataQueue, &data, pdMS_TO_TICKS(1000)) == pdTRUE) {
      
      // Adquirir mutex para acesso exclusivo ao MQTT
      if (xSemaphoreTake(mqttMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        
        // Verificar conexão MQTT
        if (!mqttClient.connected()) {
          Serial.println("[TASK MQTT] Reconectando MQTT...");
          mqttReconnect();
        }
        
        // Montar JSON
        String payload = "{";
        payload += "\"acc_x\":" + String(data.acc_x, 4) + ",";
        payload += "\"acc_y\":" + String(data.acc_y, 4) + ",";
        payload += "\"acc_z\":" + String(data.acc_z, 4) + ",";
        payload += "\"gyro_x\":" + String(data.gyro_x, 4) + ",";
        payload += "\"gyro_y\":" + String(data.gyro_y, 4) + ",";
        payload += "\"gyro_z\":" + String(data.gyro_z, 4) + ",";
        payload += "\"temp\":" + String(data.temp, 2) + ",";
        payload += "\"ts_ms\":" + String(data.timestamp);
        payload += "}";
        
        // Publicar
        bool ok = mqttClient.publish(mqtt_topic, payload.c_str());
        
        Serial.print("Publicando -> ");
        Serial.println(payload);
        Serial.print("MQTT publish status: ");
        Serial.println(ok ? "OK" : "FAIL");
        
        // Loop do cliente MQTT (importante!)
        mqttClient.loop();
        
        // Liberar mutex
        xSemaphoreGive(mqttMutex);
      } else {
        Serial.println("[TASK MQTT] Timeout ao aguardar mutex");
      }
    }
    
    // Pequeno delay para não sobrecarregar
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// ===================================================
// TASK 3: Monitor de WiFi
// Core: 0 | Prioridade: 1 (BAIXA)
// ===================================================
void taskWiFiMonitor(void *parameter) {
  Serial.print("[TASK WIFI] Iniciada no Core: ");
  Serial.println(xPortGetCoreID());
  
  while (true) {
    // Verificar se WiFi está conectado
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[TASK WIFI] WiFi desconectado! Reconectando...");
      WiFi.reconnect();
      
      // Aguardar reconexão (máx 10 segundos)
      int attempts = 0;
      while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
        attempts++;
      }
      
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.print("[TASK WIFI] Reconectado! IP: ");
        Serial.println(WiFi.localIP());
      } else {
        Serial.println();
        Serial.println("[TASK WIFI] Falha ao reconectar. Tentando novamente...");
      }
    }
    
    // Verificar a cada 10 segundos
    vTaskDelay(pdMS_TO_TICKS(10000));
  }
}

// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("  AURA IoT - Monitor de Tremores");
  Serial.println("  Versão: FreeRTOS");
  Serial.println("========================================\n");
  
  // Inicializar WiFi
  setup_wifi();
  
  // Inicializar MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttReconnect();
  
  // Inicializar MPU6050
  Serial.println("Inicializando MPU6050...");
  if (!mpu.begin()) {
    Serial.println("Erro: não foi possível encontrar MPU6050!");
    Serial.println("Verifique as conexões I2C.");
    while (1) delay(10);
  }
  Serial.println("MPU6050 encontrado!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  delay(100);
  
  // ===== CRIAR RECURSOS DO FreeRTOS =====
  
  // Criar Fila (capacidade: 10 leituras)
  sensorDataQueue = xQueueCreate(10, sizeof(SensorData));
  if (sensorDataQueue == NULL) {
    Serial.println("ERRO: Falha ao criar fila!");
    while (1) delay(10);
  }
  Serial.println("Fila criada: 10 slots de SensorData");
  
  // Criar Mutex
  mqttMutex = xSemaphoreCreateMutex();
  if (mqttMutex == NULL) {
    Serial.println("ERRO: Falha ao criar mutex!");
    while (1) delay(10);
  }
  Serial.println("Mutex criado para proteção MQTT");
  
  // ===== CRIAR TASKS =====
  
  Serial.println("\nCriando tasks do FreeRTOS...\n");
  
  // Task 1: Sensor (Core 1, Prioridade 3)
  xTaskCreatePinnedToCore(
    taskReadSensor,          // Função da task
    "TaskSensor",            // Nome (para debug)
    4096,                    // Stack size (bytes)
    NULL,                    // Parâmetro
    3,                       // Prioridade (3 = alta)
    &taskSensorHandle,       // Handle
    1                        // Core (1 = dedicado para sensor)
  );
  Serial.println("✓ Task Sensor criada (Core 1, Prioridade 3)");
  
  // Task 2: MQTT (Core 0, Prioridade 2)
  xTaskCreatePinnedToCore(
    taskPublishMQTT,
    "TaskMQTT",
    8192,                    // Stack maior para JSON
    NULL,
    2,                       // Prioridade média
    &taskMQTTHandle,
    0                        // Core 0 (WiFi/MQTT)
  );
  Serial.println("✓ Task MQTT criada (Core 0, Prioridade 2)");
  
  // Task 3: WiFi Monitor (Core 0, Prioridade 1)
  xTaskCreatePinnedToCore(
    taskWiFiMonitor,
    "TaskWiFi",
    2048,
    NULL,
    1,                       // Prioridade baixa
    &taskWiFiMonitorHandle,
    0                        // Core 0
  );
  Serial.println("✓ Task WiFi Monitor criada (Core 0, Prioridade 1)");
  
  Serial.println("\n========================================");
  Serial.println("Sistema operacional!");
  Serial.println("FreeRTOS gerenciando 3 tasks");
  Serial.println("========================================\n");
}

// ===================================================
// LOOP (vazio - FreeRTOS gerencia tudo)
// ===================================================
void loop() {
  // Loop vazio - FreeRTOS cuida de tudo!
  // O scheduler do FreeRTOS alterna entre as tasks
  vTaskDelay(portMAX_DELAY);
}