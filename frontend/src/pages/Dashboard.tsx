// src/pages/Dashboard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Home, 
  TrendingUp, 
  Calendar, 
  Zap,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RealtimeTab from '../components/tabs/RealtimeTab';
import AnalysisTab from '../components/tabs/AnalysisTab';
import CalendarTab from '../components/tabs/CalendarTab';
import EpisodesTab from '../components/tabs/EpisodesTab';

type Tab = 'realtime' | 'analysis' | 'episodes' | 'calendar';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('realtime');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'analysis', label: 'Análise', icon: TrendingUp },
    { id: 'episodes', label: 'Episódios', icon: Zap },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    
    try {
      const element = document.getElementById('dashboard-content');
      
      if (!element) {
        alert('Erro ao capturar conteúdo');
        return;
      }

      // Capturar o conteúdo como imagem
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#faf5ff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      // Adicionar páginas extras se necessário
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Salvar PDF
      const today = new Date().toISOString().split('T')[0];
      pdf.save(`relatorio-aura-${today}.pdf`);
      
      alert('✅ Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('❌ Erro ao exportar PDF. Verifique o console.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Home className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Aura Dashboard
                </h1>
                <p className="text-xs text-gray-500">Monitoramento de Tremores</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div id="dashboard-content" className="animate-fadeIn">
          {activeTab === 'realtime' && <RealtimeTab />}
          {activeTab === 'analysis' && <AnalysisTab />}
          {activeTab === 'episodes' && <EpisodesTab />}
          {activeTab === 'calendar' && <CalendarTab />}
        </div>
      </div>
    </div>
  );
}