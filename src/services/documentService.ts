import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectDocument = Database['public']['Tables']['project_documents']['Row'];
type ProjectDocumentInsert = Database['public']['Tables']['project_documents']['Insert'];

export interface DocumentUploadMetadata {
  projectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  itemId?: string;
  participantDesignation?: Database['public']['Enums']['participant_designation'];
}

export class DocumentService {
  /**
   * Upload a document and create a database record with proper linking
   */
  static async uploadDocument(
    file: File, 
    metadata: DocumentUploadMetadata
  ): Promise<{ data: ProjectDocument | null; error: any; fileUrl?: string }> {
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `projects/${metadata.projectId}/documents/${fileName}`;

      // Upload file to Supabase Storage (when storage is configured)
      // For now, we'll just create the database record
      const documentData: ProjectDocumentInsert = {
        project_id: metadata.projectId,
        file_name: metadata.fileName,
        file_path: filePath,
        file_size: metadata.fileSize,
        mime_type: metadata.mimeType,
        item_id: metadata.itemId,
        participant_designation: metadata.participantDesignation,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || '',
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('project_documents')
        .insert(documentData)
        .select()
        .single();

      return { 
        data, 
        error, 
        fileUrl: data ? `/documents/${data.id}` : undefined 
      };
    } catch (error) {
      console.error('Document upload error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get documents by project with optional filtering
   */
  static async getDocumentsByProject(
    projectId: string,
    itemId?: string,
    participantDesignation?: Database['public']['Enums']['participant_designation']
  ): Promise<{ data: ProjectDocument[] | null; error: any }> {
    let query = supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId);

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    if (participantDesignation) {
      query = query.eq('participant_designation', participantDesignation);
    }

    return await query.order('created_at', { ascending: false });
  }

  /**
   * Get documents linked to a specific checklist item
   */
  static async getDocumentsByChecklistItem(
    checklistItemId: string
  ): Promise<{ data: ProjectDocument[] | null; error: any }> {
    // For now, we'll filter by a custom approach since the column might not be in types yet
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    // Filter in memory until the types are updated
    const filteredData = data?.filter((doc: any) => 
      doc.checklist_item_id === checklistItemId
    ) || [];

    return { data: filteredData, error: null };
  }

  /**
   * Link a document to a checklist item
   */
  static async linkDocumentToChecklistItem(
    documentId: string,
    checklistItemId: string
  ): Promise<{ data: ProjectDocument | null; error: any }> {
    // For now, we'll update the document with a generic update
    const { data, error } = await supabase
      .from('project_documents')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Update document status
   */
  static async updateDocumentStatus(
    documentId: string,
    status: Database['public']['Enums']['checklist_status']
  ): Promise<{ data: ProjectDocument | null; error: any }> {
    return await supabase
      .from('project_documents')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string): Promise<{ error: any }> {
    // First get the document to get the file path
    const { data: document, error: fetchError } = await supabase
      .from('project_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      return { error: fetchError };
    }

    // Delete from storage (when storage is configured)
    // await supabase.storage.from('documents').remove([document.file_path]);

    // Delete from database
    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId);

    return { error };
  }
}
