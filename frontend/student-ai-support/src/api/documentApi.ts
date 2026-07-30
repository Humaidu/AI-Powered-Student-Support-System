import { documentService } from '../services/documents/documentService';
import { Document, ApprovalStatus, ApiResponse } from '../types';

export const documentApi = {
  getDocuments: async (): Promise<ApiResponse<Document[]>> => {
    try {
      const data = await documentService.getDocuments();
      return { success: true, message: 'Documents fetched successfully', data };
    } catch (e: any) {
      return { success: false, error: { code: 'DOCS_FETCH_ERROR', message: e.message } };
    }
  },

  uploadDocument: async (file: File, metadata?: Partial<Document['metadata']>): Promise<ApiResponse<Document>> => {
    try {
      const data = await documentService.uploadDocument(file, metadata);
      return { success: true, message: 'Document uploaded and queued for embedding', data };
    } catch (e: any) {
      return { success: false, error: { code: 'UPLOAD_ERROR', message: e.message } };
    }
  },

  approveDocument: async (id: string, status: ApprovalStatus): Promise<ApiResponse<Document>> => {
    try {
      const data = await documentService.approveDocument(id, status);
      return { success: true, message: `Document status changed to ${status}`, data };
    } catch (e: any) {
      return { success: false, error: { code: 'APPROVAL_ERROR', message: e.message } };
    }
  },

  deleteDocument: async (id: string): Promise<ApiResponse<null>> => {
    try {
      await documentService.deleteDocument(id);
      return { success: true, message: 'Document deleted successfully', data: null };
    } catch (e: any) {
      return { success: false, error: { code: 'DELETE_DOC_ERROR', message: e.message } };
    }
  }
};
