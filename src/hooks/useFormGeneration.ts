
import { useState } from 'react';
import { FormGenerationService, GenerationResult } from '@/services/formGenerationService';
import { useToast } from '@/hooks/use-toast';

export const useFormGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const generateChecklist = async (projectId: string, forceRegenerate: boolean = false) => {
    try {
      setLoading(true);
      setResult(null);

      const generationResult = await FormGenerationService.generateChecklistForProject(
        projectId,
        forceRegenerate
      );

      setResult(generationResult);

      if (generationResult.errors.length > 0) {
        toast({
          title: "Form generation completed with warnings",
          description: `Generated ${generationResult.itemsCreated} items with ${generationResult.errors.length} warnings`,
          variant: "default",
        });
      } else {
        toast({
          title: "Form generation successful",
          description: `Generated ${generationResult.itemsCreated} checklist items`,
        });
      }

      return generationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Form generation failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const regenerateChecklist = async (projectId: string) => {
    try {
      setLoading(true);
      setResult(null);

      const generationResult = await FormGenerationService.regenerateChecklistForProject(projectId);
      setResult(generationResult);

      toast({
        title: "Checklist regenerated",
        description: `Generated ${generationResult.itemsCreated} new checklist items`,
      });

      return generationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Checklist regeneration failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    result,
    generateChecklist,
    regenerateChecklist,
  };
};
