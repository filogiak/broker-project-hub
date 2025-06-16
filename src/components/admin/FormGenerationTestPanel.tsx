
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormGeneration } from '@/hooks/useFormGeneration';
import { Badge } from '@/components/ui/badge';

interface FormGenerationTestPanelProps {
  projectId: string;
  projectName: string;
}

const FormGenerationTestPanel: React.FC<FormGenerationTestPanelProps> = ({ projectId, projectName }) => {
  const { loading, result, generateChecklist, regenerateChecklist, debugProject } = useFormGeneration();
  const [lastAction, setLastAction] = useState<string>('');

  const handleGenerate = async () => {
    setLastAction('generate');
    await generateChecklist(projectId, false);
  };

  const handleRegenerate = async () => {
    setLastAction('regenerate');
    await regenerateChecklist(projectId);
  };

  const handleForceRegenerate = async () => {
    setLastAction('force-regenerate');
    await generateChecklist(projectId, true);
  };

  const handleDebug = async () => {
    setLastAction('debug');
    await debugProject(projectId);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Form Generation Test Panel</CardTitle>
        <CardDescription>
          Test and debug form generation for project: {projectName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            variant="default"
          >
            {loading && lastAction === 'generate' ? 'Generating...' : 'Generate Checklist'}
          </Button>
          
          <Button 
            onClick={handleRegenerate} 
            disabled={loading}
            variant="outline"
          >
            {loading && lastAction === 'regenerate' ? 'Regenerating...' : 'Smart Regenerate'}
          </Button>
          
          <Button 
            onClick={handleForceRegenerate} 
            disabled={loading}
            variant="secondary"
          >
            {loading && lastAction === 'force-regenerate' ? 'Force Regenerating...' : 'Force Regenerate'}
          </Button>
          
          <Button 
            onClick={handleDebug} 
            disabled={loading}
            variant="ghost"
          >
            {loading && lastAction === 'debug' ? 'Debugging...' : 'Debug Project'}
          </Button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Generation Result:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Badge variant="default">{result.itemsCreated} Created</Badge>
              </div>
              <div>
                <Badge variant="secondary">{result.itemsSkipped} Skipped</Badge>
              </div>
              <div>
                <Badge variant={result.errors.length > 0 ? "destructive" : "outline"}>
                  {result.errors.length} Errors
                </Badge>
              </div>
              {result.debugInfo && (
                <div>
                  <Badge variant="outline">{result.debugInfo.totalItemsInDatabase} Total Items</Badge>
                </div>
              )}
            </div>

            {result.debugInfo && (
              <div className="text-sm space-y-1">
                <p><strong>Filtering Pipeline:</strong></p>
                <p>• Total items in database: {result.debugInfo.totalItemsInDatabase}</p>
                <p>• After project type filter: {result.debugInfo.itemsAfterProjectTypeFilter}</p>
                <p>• After subcategory filter: {result.debugInfo.itemsAfterSubcategoryFilter}</p>
                <p>• Final items passed: {result.debugInfo.itemsPassedAllFilters}</p>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-destructive mb-2">Errors:</h4>
                <ul className="text-sm text-destructive space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p><strong>Actions:</strong></p>
          <p>• <strong>Generate:</strong> Normal generation (skips if already generated)</p>
          <p>• <strong>Smart Regenerate:</strong> Cleans problematic items and regenerates</p>
          <p>• <strong>Force Regenerate:</strong> Completely clears and regenerates all items</p>
          <p>• <strong>Debug:</strong> Logs detailed debug information to console</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormGenerationTestPanel;
