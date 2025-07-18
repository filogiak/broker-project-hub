import { useMutation } from '@tanstack/react-query';
import { formLinkService } from '@/services/formLinkService';
import { useToast } from '@/hooks/use-toast';

interface FormLinkRequest {
  name: string;
  email: string;
  phone: string;
  formSlug: string;
}

export const useFormLink = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: FormLinkRequest) => formLinkService.getFormLink(request),
    onError: (error: Error) => {
      console.error('Form link generation failed:', error);
      toast({
        title: "Errore",
        description: "Impossibile generare il link del modulo. Riprova più tardi.",
        variant: "destructive",
      });
    },
  });
};