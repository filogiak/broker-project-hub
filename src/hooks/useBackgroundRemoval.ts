
import { useState, useEffect } from 'react';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';

export const useBackgroundRemoval = (imagePath: string) => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        // Fetch the original image
        const response = await fetch(imagePath);
        const blob = await response.blob();
        
        // Load as HTMLImageElement
        const imageElement = await loadImage(blob);
        
        // Remove background
        const processedBlob = await removeBackground(imageElement);
        
        // Create URL for the processed image
        const url = URL.createObjectURL(processedBlob);
        setProcessedImageUrl(url);
      } catch (err) {
        console.error('Background removal failed:', err);
        setError(err instanceof Error ? err.message : 'Background removal failed');
        // Fallback to original image
        setProcessedImageUrl(imagePath);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();

    // Cleanup function
    return () => {
      if (processedImageUrl && processedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [imagePath]);

  return { processedImageUrl, isProcessing, error };
};
