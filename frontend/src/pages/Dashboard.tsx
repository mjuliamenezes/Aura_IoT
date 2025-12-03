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
      const element = document.getElementById('pdf-export-wrapper');
      
      if (!element) {
        alert('Erro ao capturar conteúdo');
        setExporting(false);
        return;
      }

      // PASSO 1: Remover TODOS os efeitos visuais problemáticos
      const style = document.createElement('style');
      style.id = 'temp-pdf-style';
      style.innerHTML = `
        .pdf-exporting,
        .pdf-exporting * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
          opacity: 1 !important;
          box-shadow: none !important;
        }
        
        /* Forçar todos os fundos brancos/transparentes para branco sólido */
        .pdf-exporting *[class*="bg-white"],
        .pdf-exporting *[class*="backdrop-blur"],
        .pdf-exporting .bg-white\\/70,
        .pdf-exporting .bg-white\\/80,
        .pdf-exporting .bg-white\\/90,
        .pdf-exporting .bg-white\\/95 {
          background-color: rgb(255, 255, 255) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* Garantir que fundos gradientes permaneçam */
        .pdf-exporting *[class*="bg-gradient"] {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* Forçar visibilidade de todo texto */
        .pdf-exporting * {
          color: inherit !important;
        }
      `;
      document.head.appendChild(style);

      // Adicionar classe temporária
      element.classList.add('pdf-exporting');

      // PASSO 2: Aguardar renderização (aumentado para garantir)
      await new Promise(resolve => setTimeout(resolve, 800));

      // PASSO 3: Capturar com configurações otimizadas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        imageTimeout: 0,
        removeContainer: false,
        ignoreElements: (el) => {
          // Ignorar elementos ocultos
          return el.classList.contains('hidden') || 
                 el.style.display === 'none' ||
                 el.style.visibility === 'hidden';
        },
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('pdf-export-wrapper');
          if (clonedElement) {
            // Forçar estilos no clone
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.padding = '24px';
            clonedElement.style.opacity = '1';
            
            // Remover TODOS os backdrop-blur, transparências e GRADIENTES problemáticos
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.backdropFilter = 'none';
              htmlEl.style.webkitBackdropFilter = 'none';
              htmlEl.style.filter = 'none';
              htmlEl.style.opacity = '1';
              
              // Remover gradientes problemáticos e substituir por cor sólida
              const computedStyle = window.getComputedStyle(htmlEl);
              const bgImage = computedStyle.backgroundImage;
              
              if (bgImage && bgImage.includes('gradient')) {
                // Se for gradiente, substituir por cor sólida
                if (htmlEl.classList.contains('from-purple-600') || 
                    htmlEl.classList.contains('from-purple-500')) {
                  htmlEl.style.background = '#9333ea'; // purple-600
                  htmlEl.style.backgroundImage = 'none';
                } else if (htmlEl.className.includes('bg-gradient')) {
                  htmlEl.style.background = '#9333ea'; // purple-600 como fallback
                  htmlEl.style.backgroundImage = 'none';
                } else {
                  // Manter fundo mas remover gradiente
                  htmlEl.style.backgroundImage = 'none';
                }
              }
              
              // Substituir fundos transparentes por branco
              const bgColor = computedStyle.backgroundColor;
              if (bgColor.includes('rgba') && bgColor.includes('0.')) {
                htmlEl.style.backgroundColor = '#ffffff';
              }
            });
            
            // Tratamento especial para textos com bg-clip-text
            const textGradients = clonedElement.querySelectorAll('[class*="bg-clip-text"]');
            textGradients.forEach(el => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.backgroundImage = 'none';
              htmlEl.style.webkitBackgroundClip = 'unset';
              htmlEl.style.backgroundClip = 'unset';
              htmlEl.style.webkitTextFillColor = 'unset';
              htmlEl.style.color = '#9333ea'; // Cor roxa sólida
            });
          }
        }
      });

      // PASSO 4: Limpar estilos temporários
      element.classList.remove('pdf-exporting');
      document.getElementById('temp-pdf-style')?.remove();

      // PASSO 5: Converter para imagem
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (!imgData || imgData === 'data:,') {
        throw new Error('Falha ao gerar imagem');
      }

      // PASSO 6: Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Margens
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let yPosition = margin;
      let page = 1;

      // Primeira página
      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);

      // Páginas adicionais
      while (heightLeft > 0) {
        pdf.addPage();
        page++;
        yPosition = -(imgHeight - heightLeft) + margin;
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - margin * 2);
      }

      // PASSO 7: Salvar
      const today = new Date().toISOString().split('T')[0];
      pdf.save(`relatorio-aura-${today}.pdf`);
      
      alert('✅ Relatório exportado com sucesso!');
      
    } catch (error) {
      console.error('Erro detalhado ao exportar PDF:', error);
      alert(`❌ Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Garantir limpeza em caso de erro
      document.getElementById('pdf-export-wrapper')?.classList.remove('pdf-exporting');
      document.getElementById('temp-pdf-style')?.remove();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center"
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
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white rounded-2xl p-2 flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-600 bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* IMPORTANTE: Wrapper com fundo branco sólido para PDF */}
        <div id="pdf-export-wrapper" className="bg-white rounded-2xl p-6">
          <div id="dashboard-content" className="animate-fadeIn">
            {activeTab === 'realtime' && <RealtimeTab />}
            {activeTab === 'analysis' && <AnalysisTab />}
            {activeTab === 'episodes' && <EpisodesTab />}
            {activeTab === 'calendar' && <CalendarTab />}
          </div>
        </div>
      </div>
    </div>
  );
}