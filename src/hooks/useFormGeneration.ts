
import { useState } from 'react';
import { FormGenerationService, GenerationResult } from '@/services/formGenerationService';
import { FormGenerationDebugService } from '@/services/formGenerationDebugService';
import { useToast } from '@/hooks/use-toast';

export const useFormGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const generateChecklist = async (projectId: string, forceRegenerate: boolean = false) => {
    try {
      setLoading(true);
      setResult(null);

      console.log('🔧 Hook: Starting generation for project:', projectId);
      
      // Log debug info before generation
      await FormGenerationDebugService.logDebugInfo(projectId);
      
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

      // Log debug info after generation
      await FormGenerationDebugService.logDebugInfo(projectId);

      return generationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Hook: Generation failed:', error);
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

      console.log('🔄 Hook: Starting COMPLETE regeneration for project:', projectId);
      
      // Clean up conditional questions first
      const cleanupResult = await FormGenerationDebugService.cleanupConditionalQuestions(projectId);
      console.log('🧹 Cleanup result:', cleanupResult);
      
      // Force complete regeneration
      const generationResult = await FormGenerationService.regenerateChecklistForProject(projectId);
      setResult(generationResult);

      toast({
        title: "Checklist completely regenerated",
        description: `Cleaned up ${cleanupResult.deletedCount} problematic items and generated ${generationResult.itemsCreated} new checklist items`,
      });

      // Log final debug info
      await FormGenerationDebugService.logDebugInfo(projectId);

      return generationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Hook: Regeneration failed:', error);
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

  const debugProject = async (projectId: string) => {
    try {
      await FormGenerationDebugService.logDebugInfo(projectId);
      const debugInfo = await FormGenerationDebugService.getProjectDebugInfo(projectId);
      
      toast({
        title: "Debug information logged",
        description: `Found ${debugInfo.checklistItemsStats.problemItems.length} problem items. Check console for details.`,
      });
      
      return debugInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Hook: Debug failed:', error);
      toast({
        title: "Debug failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    loading,
    result,
    generateChecklist,
    regenerateChecklist,
    debugProject,
  };
};
