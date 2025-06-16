
import React from 'react';
import { Loader2, Brain } from 'lucide-react';

interface ConditionalLogicLoaderProps {
  message?: string;
  isEvaluating?: boolean;
}

const ConditionalLogicLoader: React.FC<ConditionalLogicLoaderProps> = ({
  message = "Processing conditional logic...",
  isEvaluating = false
}) => {
  return (
    <div className="flex items-center justify-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          {isEvaluating ? (
            <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
          ) : (
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          )}
          <div className="w-8 h-1 bg-blue-200 rounded-full overflow-hidden">
            <div className="w-full h-full bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div>
          <p className="text-blue-800 font-medium">{message}</p>
          <p className="text-sm text-blue-600 mt-1">
            {isEvaluating ? "Analyzing your answers..." : "Please wait..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConditionalLogicLoader;
