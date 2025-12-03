# 🩺 Aura IoT - Sistema de Monitoramento de Tremores Parkinsonianos

<div align="center">

![Status](https://img.shields.io/badge/Status-Concluído-success)
![Platform](https://img.shields.io/badge/Platform-ESP32-blue)
![Framework](https://img.shields.io/badge/Framework-FreeRTOS-orange)
![License](https://img.shields.io/badge/License-MIT-green)

**Sistema IoT para monitoramento em tempo real de tremores em pacientes com Parkinson**

</div>

---

## 📋 Descrição

**Aura IoT** é um sistema completo de monitoramento de tremores parkinsonianos que utiliza sensor inercial (MPU6050) conectado a um ESP32 para coletar dados em tempo real. O sistema processa essas informações através de um backend FastAPI e apresenta em um dashboard.

### 🎯 Objetivo

Desenvolver uma solução IoT que auxilie pacientes com Parkinson e seus cuidadores a:
- Monitorar tremores em tempo real (25 Hz)
- Identificar padrões e tendências
- Detectar episódios de tremor intenso
- Distinguir tremor parkinsoniano clássico (4-6 Hz)
- Gerar relatórios em PDF para acompanhamento médico

---

## 👥 Equipe

| Nome | Email |
|------|-------|
| **João Victor Ferraz** | jvfg@cesar.school |
| **Maria Júlia Menezes** | mjotm@cesar.school |
| **Maria Luísa Coimbra** | mlcl@cesar.school |

**Instituição**: CESAR School  
**Período**: 2025.2  
**Disciplina**: Sistemas Embarcados

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     AURA IoT SYSTEM                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   HARDWARE   │      │   SOFTWARE   │      │   FRONTEND   │
│              │      │              │      │              │
│  ESP32 +     │ MQTT │  Mosquitto   │ HTTP │   React +    │
│  MPU6050  ───┼─────→│   Broker  ───┼─────→│  Dashboard   │
│  (25 Hz)     │      │              │      │              │
│  FreeRTOS    │      │  FastAPI     │ WS   │  Real-time   │
│  3 Tasks     │      │  Backend     │ ←────│  Updates     │
└──────────────┘      └──────────────┘      └──────────────┘
      │                      │                      │
      │                      │                      │
   I²C (SDA/SCL)        SQLite DB               Recharts
   WiFi 2.4GHz          PostgreSQL              Tailwind
   PubSubClient         Numpy/Scipy             TypeScript
```

### 🔄 Fluxo de Dados

```
1. COLETA
   ├─ MPU6050 lê aceleração (X,Y,Z) e rotação (X,Y,Z)
   ├─ Task Sensor (FreeRTOS) captura dados a 25 Hz
   └─ Envia para fila (Queue) → Task MQTT

2. TRANSMISSÃO
   ├─ Task MQTT consome fila
   ├─ Publica JSON via MQTT (QoS 1)
   └─ Broker Mosquitto distribui

3. PROCESSAMENTO
   ├─ Backend FastAPI recebe via MQTT
   ├─ Salva leitura bruta (sensor_readings)
   ├─ Calcula features (janela deslizante 25 amostras)
   │   ├─ Magnitude vetorial
   │   ├─ Estatísticas (média, desvio, amplitude)
   │   ├─ FFT (frequência dominante)
   │   └─ Intensidade normalizada (0-10)
   └─ Salva features processadas (sensor_features)

4. ANÁLISE
   ├─ Detecção de episódios (threshold > 6.0)
   ├─ Agregação por dia/semana/mês
   ├─ Heatmap de intensidade por hora
   └─ Comparação entre períodos

5. VISUALIZAÇÃO
   ├─ Dashboard React consome API REST
   ├─ Gráficos em tempo real (2s refresh)
   ├─ FFT mostra frequência dominante
   ├─ Calendário (dias bons/ruins)
   └─ Exportação de relatórios em PDF
```

---

## 📁 Estrutura do Projeto

```
Aura_IoT/
│
├── device/                    # Firmware ESP32
├── backend/                   # API FastAPI + Python
├── frontend/                  # Dashboard 
├── infra/                     # Infraestrutura
├── docs/                      # Documentação
└── README.md                 
```

---

## 🛠️ Tecnologias Utilizadas

### Hardware
- **ESP32 DevKit** - Microcontrolador (Dual-core 240MHz, WiFi)
- **MPU6050** - Sensor IMU (Acelerômetro + Giroscópio)
- **Conexão I²C** - SDA (GPIO21), SCL (GPIO22)

### Firmware (ESP32)
- **FreeRTOS** - Sistema operacional de tempo real
  - Task 1: Leitura do sensor (Core 1, 25Hz)
  - Task 2: Publicação MQTT (Core 0)
  - Task 3: Monitor WiFi (Core 0)
- **PlatformIO** - Build system
- **Arduino Framework** - API de desenvolvimento
- **PubSubClient** - Biblioteca MQTT
- **Adafruit MPU6050** - Driver do sensor

### Backend
- **Python 3.10+** - Linguagem principal
- **FastAPI** - Framework web assíncrono
- **SQLAlchemy** - ORM para banco de dados
- **SQLite** - Banco de dados (dev)
- **Mosquitto** - Broker MQTT
- **Paho MQTT** - Cliente MQTT Python
- **NumPy/SciPy** - Processamento numérico (FFT)
- **Uvicorn** - Servidor ASGI

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Recharts** - Biblioteca de gráficos
- **Nivo** - Heatmaps avançados
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas
- **jsPDF + html2canvas** - Exportação PDF

### DevOps
- **Docker** - Containerização (Mosquitto)
- **Git/GitHub** - Versionamento
- **VS Code** - IDE

---

## 📦 Instalação

### Pré-requisitos

- **Hardware**: ESP32 + MPU6050 montados
- **Software**:
  - Python 3.10+
  - Node.js 18+
  - PlatformIO CLI
  - Docker (para Mosquitto)

### 1. Configure as credenciais Wi-Fi e MQTT

Abra o arquivo `device/firmware/src/main.cpp` e altere as seguintes variáveis:
```cpp
const char* ssid = "SEU_WIFI_AQUI";
const char* password = "SUA_SENHA_AQUI";
const char* mqtt_server = "SEU_IP_AQUI";
```

**Como descobrir seu IP local (Linux):**
```bash
hostname -I
```
Use o primeiro endereço IP retornado como `mqtt_server`.

--- 

### 2. Faça o upload do firmware para o dispositivo

Abra um terminal e execute:
```bash
cd device/firmware
pio run --target upload
```
Aguarde o upload concluir. O dispositivo será reiniciado automaticamente.

---

### 3. Executar o Backend

Abra um **novo terminal** e siga os passos:
```bash
# Navegue até a pasta do backend
cd backend

# Ative o ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Inicie o servidor
uvicorn app.main:app --reload
```

O backend estará rodando em: `http://localhost:8000`

--- 

### 4. Executar o Frontend

Abra **outro terminal** e execute:
```bash
# Navegue até a pasta do frontend
cd frontend

# Instale as dependências (apenas na primeira vez)
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5173` (ou a porta indicada no terminal)

---

## 🚀 Como Usar

### 1. Acesse a Landing Page
Navegue até `http://localhost:5173` e clique em **"Acessar Dashboard"**.

### 2. Dashboard - Tempo Real
- 📈 **Gráfico ao vivo**: Intensidade dos últimos 60s
- 🌡️ **Termômetro**: Intensidade atual (0-10)
- 📊 **Status do sensor**: Online/Offline
- 🔬 **FFT**: Frequência dominante (identifica 4-6 Hz parkinsoniano)

### 3. Dashboard - Análise
- 📈 **Amplitude ao longo do dia**: Padrão diário de intensidade
- 📊 **Comparação semanal**: Esta semana vs anterior
- 🔥 **Heatmap por hora**: Distribuição 24h

### 4. Dashboard - Episódios
- ⚡ **Detecção automática**: Clique para detectar picos
- 📝 **Lista de episódios**: Horário, duração, intensidade
- 📊 **Estatísticas**: Total, duração média, máxima

### 5. Dashboard - Calendário
- 📅 **Visualização mensal**: 
- 🟢 **Dias bons**: Intensidade < 6.0
- 🔴 **Dias ruins**: Intensidade ≥ 6.0
- 💡 **Tooltip**: Detalhes ao passar o mouse

### 6. Exportar Relatório PDF
Clique no botão **"Exportar PDF"** no topo do dashboard.

---

## 📊 Funcionalidades Implementadas

### ✅ Hardware & Firmware
- [x] Leitura contínua do MPU6050 a 25 Hz
- [x] 3 Tasks FreeRTOS concorrentes
- [x] Uso de ambos os cores do ESP32
- [x] Comunicação via MQTT (QoS 1)
- [x] Reconexão automática WiFi/MQTT
- [x] Sincronização com Queue e Mutex

### ✅ Backend
- [x] Ingestão de dados via MQTT
- [x] Processamento em tempo real
  - Magnitude vetorial
  - Estatísticas (média, desvio, amplitude)
  - FFT (frequência dominante)
  - Intensidade normalizada (0-10)
- [x] Detecção automática de episódios
- [x] Agregações temporais (dia/semana/mês)
- [x] Heatmap de intensidade por hora
- [x] API REST completa (11 endpoints)
- [x] WebSocket para streaming

### ✅ Frontend
- [x] Landing page moderna
- [x] Dashboard com 4 abas
- [x] Gráficos em tempo real (Recharts)
- [x] Espectro FFT interativo
- [x] Calendário estilo Clue
- [x] Heatmap com Nivo
- [x] Exportação PDF
- [x] Design responsivo
- [x] Animações suaves

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

