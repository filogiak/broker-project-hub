
import React from 'react';
import { FileText, BarChart3, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BrokerageQuickActions = () => {
  const { toast } = useToast();

  const handleExportData = () => {
    toast({
      title: "Prossimamente",
      description: "La funzione di esportazione dati è in fase di sviluppo."
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Prossimamente", 
      description: "La generazione report è in fase di sviluppo."
    });
  };

  const handleSendUpdate = () => {
    toast({
      title: "Prossimamente",
      description: "L'invio aggiornamenti è in fase di sviluppo."
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[12px] border border-form-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-form-green font-dm-sans mb-4">Azioni Rapide</h3>
        <div className="space-y-3">
          <button 
            onClick={handleExportData}
            className="w-full text-left p-4 rounded-[10px] hover:bg-vibe-green-light transition-colors border border-form-border/50"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-form-green" />
              <div>
                <p className="font-medium text-form-green font-dm-sans">Esporta Dati</p>
                <p className="text-xs text-gray-500 font-dm-sans">Scarica dati della brokerage</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={handleGenerateReport}
            className="w-full text-left p-4 rounded-[10px] hover:bg-vibe-green-light transition-colors border border-form-border/50"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-form-green" />
              <div>
                <p className="font-medium text-form-green font-dm-sans">Genera Report</p>
                <p className="text-xs text-gray-500 font-dm-sans">Crea report di performance</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={handleSendUpdate}
            className="w-full text-left p-4 rounded-[10px] hover:bg-vibe-green-light transition-colors border border-form-border/50"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-form-green" />
              <div>
                <p className="font-medium text-form-green font-dm-sans">Invia Aggiornamento</p>
                <p className="text-xs text-gray-500 font-dm-sans">Notifica team brokerage</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrokerageQuickActions;
