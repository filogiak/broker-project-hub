
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadQuestionProps {
  question: any;
  value?: string;
  onChange: (value: string) => void;
  projectId: string;
  participantDesignation?: string;
}

const DocumentUploadQuestion = ({ 
  question, 
  value, 
  onChange, 
  projectId, 
  participantDesignation 
}: DocumentUploadQuestionProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(value || null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Here you would implement actual file upload logic
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileName = file.name;
      setUploadedFile(fileName);
      onChange(fileName);
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onChange('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {question.item_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Upload your document here
              </p>
              <label className="cursor-pointer">
                <Button 
                  variant="outline" 
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{uploadedFile}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor('pending')}`}>
                  Pending Review
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadQuestion;
