
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, CheckCircle, Archive, TrendingUp } from 'lucide-react';
import { simulationService } from '@/services/simulationService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Simulation = Database['public']['Tables']['simulations']['Row'];

interface BrokerageSimulationStatsProps {
  brokerageId: string;
}

const BrokerageSimulationStats = ({ brokerageId }: BrokerageSimulationStatsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulations();
  }, [brokerageId]);

  const loadSimulations = async () => {
    try {
      setLoading(true);
      const data = await simulationService.getBrokerageSimulations(brokerageId);
      setSimulations(data);
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationsClick = () => {
    navigate(`/brokerage/${brokerageId}/simulations`);
  };

  const draftCount = simulations.filter(s => s.status === 'draft').length;
  const inProgressCount = simulations.filter(s => s.status === 'in_progress').length;
  const completedCount = simulations.filter(s => s.status === 'completed').length;

  if (loading) {
    return (
      <Card className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-form-placeholder rounded w-24 mb-2"></div>
            <div className="h-8 bg-form-placeholder rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" 
      onClick={handleSimulationsClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-9 w-9 text-form-green-dark" />
          </div>
          <span className="bg-accent-yellow text-form-green text-xs font-medium px-2 py-1 rounded-md">
            {simulations.length} totali
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Gestione Simulazioni</h3>
            <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
              Crea e gestisci simulazioni pre-progetto per i tuoi clienti
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Archive className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-500">Bozze</span>
              </div>
              <span className="font-semibold text-gray-700">{draftCount}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Play className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-500">In Corso</span>
              </div>
              <span className="font-semibold text-blue-600">{inProgressCount}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-500">Completate</span>
              </div>
              <span className="font-semibold text-green-600">{completedCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrokerageSimulationStats;
