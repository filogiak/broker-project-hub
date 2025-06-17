
import { useCallback, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
}

export const useAutoSave = ({ delay = 3000, onSave, onError }: UseAutoSaveOptions) => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const triggerSave = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSave();
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        onError?.(error as Error);
      } finally {
        setIsSaving(false);
      }
    }, delay);
  }, [delay, onSave, onError]);

  const saveImmediately = useCallback(async () => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      setIsSaving(true);
      await onSave();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Immediate save failed:', error);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onError]);

  const cancelPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasUnsavedChanges(false);
  }, []);

  return {
    triggerSave,
    saveImmediately,
    cancelPendingSave,
    isSaving,
    hasUnsavedChanges
  };
};
