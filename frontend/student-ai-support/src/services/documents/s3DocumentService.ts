import { DocumentServiceProvider } from './documentServiceProvider';
import { Document, ApprovalStatus, DocumentStatus } from '../../types';
import { apiClient } from '../../api/client';

// Backend document structure
type BackendDocument = {
  documentId: string;
  title: string;
  description?: string;
  documentType?: string;
  department?: string;
  academicYear?: string;
  version?: number;
  tags?: string[];
  uploadedAt: string;
  processingStatus: string;
  approvalStatus: string;
  fileSize?: number;
  fileName?: string;
  s3Key?: string;
  pageCount?: number;
};

// Map backend document format to frontend Document type
function mapBackendDocument(backendDoc: BackendDocument): Document {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    id: backendDoc.documentId,
    title: backendDoc.title,
    fileName: backendDoc.fileName || backendDoc.title || 'Unknown',
    fileUrl: backendDoc.s3Key || '',
    status: backendDoc.processingStatus as DocumentStatus,
    approvalStatus: backendDoc.approvalStatus as ApprovalStatus,
    metadata: {
      category: backendDoc.documentType || 'general',
      department: backendDoc.department || '',
      author: 'System',
      version: backendDoc.version ? `v${backendDoc.version}` : 'v1',
      pageCount: backendDoc.pageCount || 0,
      uploadedAt: backendDoc.uploadedAt,
      fileSize: formatFileSize(backendDoc.fileSize),
    },
  };
}

export class S3DocumentService implements DocumentServiceProvider {
  async getDocuments(): Promise<Document[]> {
    const res = await apiClient<{ documents?: BackendDocument[]; count?: number } | BackendDocument[]>('/documents');
    if (!res.success) throw new Error(res.error?.message || 'Failed to load documents');
    
    // Backend returns {documents: [...], count: N} but handle both formats
    const backendDocs = Array.isArray(res.data) 
      ? res.data 
      : (res.data?.documents || []);
    
    return backendDocs.map(mapBackendDocument);
  }

  async uploadDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document> {
    // Step 1: Get presigned upload URL from backend
    // Backend expects: title, description, documentType, department, academicYear, tags, mimeType, fileSize
    const uploadMetadata = {
      title: file.name,
      description: '',
      documentType: metadata?.category || 'general',
      department: metadata?.department || '',
      academicYear: '',
      tags: [] as string[],
      mimeType: file.type,
      fileSize: file.size
    };

    const metadataRes = await apiClient<{
      documentId: string;
      uploadUrl: string;
      s3Key: string;
      expiresIn: number;
      processingStatus: string;
    }>('/documents', {
      method: 'POST',
      body: JSON.stringify(uploadMetadata)
    });

    if (!metadataRes.success || !metadataRes.data) {
      throw new Error(metadataRes.error?.message || 'Failed to get upload URL');
    }

    const { uploadUrl, documentId } = metadataRes.data;

    // Step 2: Upload file directly to S3 using presigned URL
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!s3Response.ok) {
      throw new Error(`S3 upload failed: ${s3Response.statusText}`);
    }

    // Step 3: Fetch and return document metadata
    const docRes = await apiClient<BackendDocument>(`/documents/${documentId}`);
    if (!docRes.success || !docRes.data) {
      throw new Error('Upload succeeded but failed to fetch document metadata');
    }

    return mapBackendDocument(docRes.data);
  }

  async approveDocument(documentId: string, status: ApprovalStatus): Promise<Document> {
    // Backend approve endpoint doesn't accept body, just sets to APPROVED
    const res = await apiClient<{ documentId: string; approvalStatus: string }>(`/documents/${documentId}/approve`, {
      method: 'POST'
    });
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to approve document');
    
    // Fetch full document to return complete metadata
    const docRes = await apiClient<BackendDocument>(`/documents/${documentId}`);
    if (!docRes.success || !docRes.data) throw new Error('Approved but failed to fetch document');
    return mapBackendDocument(docRes.data);
  }

  async deleteDocument(documentId: string): Promise<void> {
    const res = await apiClient<null>(`/documents/${documentId}`, { method: 'DELETE' });
    if (!res.success) throw new Error(res.error?.message || 'Failed to delete document');
  }
}
