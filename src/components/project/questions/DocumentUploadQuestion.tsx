
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';

interface DocumentUploadQuestionProps {
  value?: string; // document_reference_id
  onChange: (value: string | null) => void;
  required?: boolean;
  itemName?: string;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}

const DocumentUploadQuestion = ({ 
  value, 
  onChange, 
  required = false,
  itemName = "Document"
}: DocumentUploadQuestionProps) => {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [document, setDocument] = useState<UploadedDocument | null>(null);

  // Load existing document if value is provided
  React.useEffect(() => {
    if (value && !document) {
      loadDocument(value);
    }
  }, [value]);

  const loadDocument = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      if (data) {
        setDocument({
          id: data.id,
          fileName: data.file_name,
          fileSize: data.file_size || 0,
          mimeType: data.mime_type || '',
          filePath: data.file_path,
          status: data.status || 'pending',
          uploadedAt: data.created_at
        });
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast({
        title: "Error loading document",
        description: "Failed to load the existing document.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is required for file upload.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${projectId}/${fileName}`;

      // Upload to Supabase Storage (we'll create the bucket later)
      // For now, we'll just create the database record
      const { data: docData, error: docError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (docError) throw docError;

      setUploadProgress(100);
      
      const newDocument: UploadedDocument = {
        id: docData.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: filePath,
        status: 'pending',
        uploadedAt: docData.created_at
      };

      setDocument(newDocument);
      onChange(docData.id);

      toast({
        title: "Document uploaded successfully",
        description: `${file.name} has been uploaded.`,
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveDocument = async () => {
    if (!document) return;

    try {
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      setDocument(null);
      onChange(null);

      toast({
        title: "Document removed",
        description: "The document has been removed successfully.",
      });

    } catch (error) {
      console.error('Error removing document:', error);
      toast({
        title: "Error",
        description: "Failed to remove the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (document) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-medium truncate max-w-xs">{document.fileName}</div>
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(document.fileSize)} • Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(document.status)}>
                {document.status}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveDocument}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin mx-auto">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Uploading...</div>
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <div className="text-lg font-medium mb-2">
                Drop your {itemName.toLowerCase()} here
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </div>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
            <div className="text-xs text-muted-foreground">
              Maximum file size: 10MB
            </div>
          </div>
        )}
      </div>
      
      {required && (
        <p className="text-sm text-muted-foreground mt-2">
          * This document is required
        </p>
      )}
    </div>
  );
};

export default DocumentUploadQuestion;
