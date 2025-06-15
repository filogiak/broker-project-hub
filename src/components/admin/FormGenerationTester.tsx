
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormGeneration } from '@/hooks/useFormGeneration';
import { FormGenerationService } from '@/services/formGenerationService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, RotateCcw, Info } from 'lucide-react';

const FormGenerationTester = () => {
  const [projectId, setProjectId] = useState('');
  const [generationStatus, setGenerationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { generateChecklist, regenerateChecklist, result } = useFormGeneration();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!projectId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateChecklist(projectId);
      await checkStatus();
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!projectId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await regenerateChecklist(projectId);
      await checkStatus();
    } catch (error) {
      console.error('Regeneration error:', error);
    }
  };

  const checkStatus = async () => {
    if (!projectId.trim()) return;

    try {
      setLoading(true);
      const status = await FormGenerationService.getGenerationStatus(projectId);
      setGenerationStatus(status);
    } catch (error) {
      toast({
        title: "Error checking status",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Form Generation Engine Tester
          </CardTitle>
          <CardDescription>
            Test the simplified form generation engine with the two core filtering rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project UUID..."
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Generate Checklist
            </Button>
            
            <Button 
              onClick={handleRegenerate}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>

            <Button 
              onClick={checkStatus}
              disabled={loading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {generationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Generated:</strong> {generationStatus.isGenerated ? 'Yes' : 'No'}</p>
              <p><strong>Generated At:</strong> {generationStatus.generatedAt || 'Never'}</p>
              <p><strong>Item Count:</strong> {generationStatus.itemCount}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Last Generation Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Items Created:</strong> {result.itemsCreated}</p>
              <p><strong>Items Skipped:</strong> {result.itemsSkipped}</p>
              {result.errors.length > 0 && (
                <div>
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FormGenerationTester;
