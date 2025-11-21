import { useEffect, useState } from "react";

interface Reading {
  acc_x: number;
  acc_y: number;
  acc_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  temp: number;
  ts_ms: number;
}

function App() {
  const [data, setData] = useState<Reading | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("[WS] Conectado ao backend");
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);
        // console.log("Recebido do WS:", json);
        setData(json);
      } catch (err) {
        console.error("Erro ao receber WS:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Erro:", err);
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-indigo-200 p-8">
      <div className="max-w-xl mx-auto bg-white/60 backdrop-blur-lg shadow-2xl rounded-3xl p-6">
        <h1 className="text-3xl font-bold text-violet-800 mb-4">
          Aura — Monitoramento
        </h1>

        {!data ? (
          <p className="text-gray-600">Aguardando dados…</p>
        ) : (
          <div className="space-y-3">
            <p><strong>Acelerômetro:</strong></p>
            <p>X: {data.acc_x.toFixed(3)}</p>
            <p>Y: {data.acc_y.toFixed(3)}</p>
            <p>Z: {data.acc_z.toFixed(3)}</p>

            <p className="mt-4"><strong>Giroscópio:</strong></p>
            <p>X: {data.gyro_x.toFixed(3)}</p>
            <p>Y: {data.gyro_y.toFixed(3)}</p>
            <p>Z: {data.gyro_z.toFixed(3)}</p>

            <p className="mt-4">
              <strong>Temperatura:</strong> {data.temp}°C
            </p>

            <p className="mt-4 text-sm text-gray-600">
              Timestamp: {data.ts_ms}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
